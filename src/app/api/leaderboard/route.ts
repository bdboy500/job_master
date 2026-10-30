import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import {
  LeaderboardUser,
  INITIAL_LEADERBOARD_USERS,
  getBangladeshDate,
  getBDDailyCycleStart,
  getBDWeeklyCycleStart,
  getBDMonthlyCycleStart,
  isToday as isBDToday,
  isThisWeek as isBDThisWeek,
  isThisMonth as isBDThisMonth
} from "@/src/lib/leaderboard";

const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_leaderboard_v2";

// In-memory cache for server persistence & lightning-fast SWR caching (Strategy 4)
let globalLeaderboardStore: LeaderboardUser[] = [...INITIAL_LEADERBOARD_USERS];
let isStoreInitialized = false;
let lastDbSyncTime = 0;
const DB_SYNC_INTERVAL_MS = 45000; // 45s server cache TTL to prevent Supabase egress spam

async function loadServerStore(forceDbSync = false): Promise<LeaderboardUser[]> {
  const now = Date.now();

  // If already initialized and within cache TTL, return instantly without hitting DB
  if (!forceDbSync && isStoreInitialized && globalLeaderboardStore.length > 0 && (now - lastDbSyncTime < DB_SYNC_INTERVAL_MS)) {
    return globalLeaderboardStore;
  }

  let baseUsers: LeaderboardUser[] = [];

  if (isStoreInitialized && globalLeaderboardStore.length > 0) {
    baseUsers = [...globalLeaderboardStore];
  } else {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("app_config")
          .select("key, value")
          .eq("key", "jobmaster_leaderboard_v2")
          .maybeSingle();

        if (!error && data && Array.isArray(data.value) && data.value.length > 0) {
          baseUsers = data.value;
          isStoreInitialized = true;
        }
      }

      if (baseUsers.length === 0) {
        const res = await fetch(CLOUD_KV_URL, { cache: "no-store" });
        if (res.ok) {
          const kvData = await res.json();
          if (Array.isArray(kvData) && kvData.length > 0) {
            baseUsers = kvData;
            isStoreInitialized = true;
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch remote leaderboard store, using default:", e);
    }

    if (baseUsers.length === 0) {
      baseUsers = [...INITIAL_LEADERBOARD_USERS];
      isStoreInitialized = true;
    }
  }

  // Strategy 1, 2 & 3: Synchronize with Supabase profiles and quiz_scores with Auto-Deduplication
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, student_id, avatar_url");

      let quizScores: any[] | null = null;
      
      // Attempt to select full 4-score columns first
      const fullRes = await supabase
        .from("quiz_scores")
        .select("id, user_id, user_name, student_id, avatar_url, today_score, week_score, month_score, all_time_score, score, updated_at, created_at")
        .order("updated_at", { ascending: false });

      if (!fullRes.error && Array.isArray(fullRes.data)) {
        quizScores = fullRes.data;
      } else {
        // Fallback to legacy columns if table doesn't have 4 columns yet
        const legacyRes = await supabase
          .from("quiz_scores")
          .select("id, user_id, score, created_at")
          .order("created_at", { ascending: false });
        if (!legacyRes.error && Array.isArray(legacyRes.data)) {
          quizScores = legacyRes.data;
        }
      }

      // Aggregate quiz scores per user according to cycles and detect duplicates to clean
      const userScoresAgg = new Map<
        string,
        {
          today: number;
          week: number;
          month: number;
          allTime: number;
          userName?: string;
          studentId?: string;
          avatarUrl?: string;
          updatedAt?: string;
          primaryId: string;
          duplicateIds: string[];
        }
      >();
      
      if (Array.isArray(quizScores)) {
        for (const qs of quizScores) {
          const uid = String(qs.user_id || "");
          if (!uid) continue;
          
          const rawScore = Number(qs.score) || 0;
          const rawAllTime = Number(qs.all_time_score) || rawScore;
          const rawToday = Number(qs.today_score ?? rawScore);
          const rawWeek = Number(qs.week_score ?? rawScore);
          const rawMonth = Number(qs.month_score ?? rawScore);
          const recordDate = qs.updated_at || qs.created_at || new Date().toISOString();

          // Calculate cycle freshness based on Bangladesh Time (UTC+6)
          const validToday = isBDToday(recordDate);
          const validWeek = isBDThisWeek(recordDate);
          const validMonth = isBDThisMonth(recordDate);

          const finalToday = validToday ? rawToday : 0;
          const finalWeek = validWeek ? rawWeek : 0;
          const finalMonth = validMonth ? rawMonth : 0;
          const finalAllTime = rawAllTime;

          if (!userScoresAgg.has(uid)) {
            userScoresAgg.set(uid, { 
              today: finalToday, 
              week: finalWeek, 
              month: finalMonth, 
              allTime: finalAllTime,
              userName: qs.user_name || undefined,
              studentId: qs.student_id || undefined,
              avatarUrl: qs.avatar_url || undefined,
              updatedAt: recordDate,
              primaryId: qs.id,
              duplicateIds: []
            });
          } else {
            // Found a duplicate row for this user! (Strategy 3: auto cleanup)
            const agg = userScoresAgg.get(uid)!;
            if (qs.id && qs.id !== agg.primaryId) {
              agg.duplicateIds.push(qs.id);
            }
            agg.allTime = Math.max(agg.allTime, finalAllTime);
            if (validToday) agg.today = Math.max(agg.today, finalToday);
            if (validWeek) agg.week = Math.max(agg.week, finalWeek);
            if (validMonth) agg.month = Math.max(agg.month, finalMonth);
            if (!agg.userName && qs.user_name) agg.userName = qs.user_name;
            if (!agg.studentId && qs.student_id) agg.studentId = qs.student_id;
            if (!agg.avatarUrl && qs.avatar_url) agg.avatarUrl = qs.avatar_url;
          }
        }

        // Background cleanup of duplicate IDs if found (keeps DB lean and compact)
        const allDuplicateIds: string[] = [];
        userScoresAgg.forEach((agg) => {
          if (agg.duplicateIds.length > 0) {
            allDuplicateIds.push(...agg.duplicateIds);
          }
        });

        if (allDuplicateIds.length > 0) {
          // Asynchronously prune redundant duplicates
          void Promise.resolve(
            supabase.from("quiz_scores").delete().in("id", allDuplicateIds.slice(0, 100))
          ).then(
            () => console.log(`[Auto-Clean] Pruned ${allDuplicateIds.length} duplicate quiz_scores rows`),
            (err) => console.warn("Prune error:", err)
          );
        }
      }

      // Merge profiles & aggregated scores into baseUsers
      if (Array.isArray(profiles) && profiles.length > 0) {
        for (const p of profiles) {
          const uid = String(p.id);
          const pName = p.full_name || "শিক্ষার্থী";
          const pStudentId = p.student_id || `JM-${uid.substring(0, 6)}`;
          const pAvatar = (p as any).avatar_url || "";
          const agg = userScoresAgg.get(uid) || { today: 0, week: 0, month: 0, allTime: 0, primaryId: "", duplicateIds: [] };

          const existingIdx = baseUsers.findIndex(
            (u) => u.id === uid || (pStudentId && u.student_id === pStudentId) || u.name === pName
          );

          if (existingIdx >= 0) {
            const ex = baseUsers[existingIdx];
            ex.id = uid; // ensure ID is matched
            ex.name = pName || ex.name;
            ex.student_id = pStudentId || ex.student_id;
            if (pAvatar) ex.avatar_url = pAvatar;
            ex.today_score = isBDToday(ex.updated_at) ? Math.max(ex.today_score || 0, agg.today) : agg.today;
            ex.week_score = isBDThisWeek(ex.updated_at) ? Math.max(ex.week_score || 0, agg.week) : agg.week;
            ex.month_score = isBDThisMonth(ex.updated_at) ? Math.max(ex.month_score || 0, agg.month) : agg.month;
            ex.all_time_score = Math.max(ex.all_time_score || 0, agg.allTime);
            baseUsers[existingIdx] = ex;
          } else {
            baseUsers.push({
              id: uid,
              name: pName,
              student_id: pStudentId,
              avatar_url: pAvatar,
              today_score: agg.today,
              week_score: agg.week,
              month_score: agg.month,
              all_time_score: agg.allTime,
              updated_at: agg.updatedAt || new Date().toISOString()
            });
          }
        }
      }

      // Also incorporate any quiz_scores users that were not in profiles table
      userScoresAgg.forEach((agg, uid) => {
        const found = baseUsers.some((u) => u.id === uid);
        if (!found) {
          baseUsers.push({
            id: uid,
            name: agg.userName || "শিক্ষার্থী",
            student_id: agg.studentId || `JM-${uid.substring(0, 6)}`,
            avatar_url: agg.avatarUrl || "",
            today_score: agg.today,
            week_score: agg.week,
            month_score: agg.month,
            all_time_score: agg.allTime,
            updated_at: agg.updatedAt || new Date().toISOString()
          });
        }
      });
    }
  } catch (err) {
    console.warn("Error augmenting store from Supabase DB:", err);
  }

  // Deduplicate and consolidate all users by canonical identity
  // (ID, Student ID, Unique Google Avatar, or known profile alias)
  const dedupedMap = new Map<string, LeaderboardUser>();

  for (const u of baseUsers) {
    const isTodayScoreValid = isBDToday(u.updated_at);
    const isWeekScoreValid = isBDThisWeek(u.updated_at);
    const isMonthScoreValid = isBDThisMonth(u.updated_at);

    const rawToday = isTodayScoreValid ? Number(u.today_score ?? (u as any).score ?? 0) : 0;
    const rawWeek = isWeekScoreValid ? Number(u.week_score ?? (u as any).score ?? rawToday) : 0;
    const rawMonth = isMonthScoreValid ? Number(u.month_score ?? (u as any).score ?? rawWeek) : 0;
    const rawAllTime = Number(u.all_time_score ?? (u as any).score ?? rawMonth);

    const safeToday = isNaN(rawToday) ? 0 : rawToday;
    const safeWeek = isNaN(rawWeek) ? 0 : rawWeek;
    const safeMonth = isNaN(rawMonth) ? 0 : rawMonth;
    const safeAllTime = isNaN(rawAllTime) ? 0 : rawAllTime;

    const uUid = String(u.id || "").trim();
    const uSid = String(u.student_id || "").trim();
    const uAvatar = String(u.avatar_url || "").trim();
    const isGoogleAvatar = uAvatar.includes("lh3.googleusercontent.com");

    // Look for matching existing user in dedupedMap
    let matchedKey: string | null = null;
    for (const [key, existing] of dedupedMap.entries()) {
      // 1. Same user ID
      if (uUid && existing.id && existing.id === uUid) {
        matchedKey = key;
        break;
      }
      // 2. Same student ID
      if (uSid && existing.student_id && existing.student_id === uSid) {
        matchedKey = key;
        break;
      }
      // 3. Same Google avatar URL (identifies the same person across profile renames/student ID shifts)
      if (isGoogleAvatar && existing.avatar_url && existing.avatar_url === uAvatar) {
        matchedKey = key;
        break;
      }
      // 4. Known profile alias ("Eomsdv" with "JM-748193" <-> "আহসান হাবীব" with "JM-863962")
      const isAhsanHabibAlias =
        (uSid === "JM-748193" && existing.student_id === "JM-863962") ||
        (uSid === "JM-863962" && existing.student_id === "JM-748193") ||
        (u.name === "Eomsdv" && existing.name === "আহসান হাবীব") ||
        (u.name === "আহসান হাবীব" && existing.name === "Eomsdv");
      if (isAhsanHabibAlias) {
        matchedKey = key;
        break;
      }
    }

    if (matchedKey) {
      const ex = dedupedMap.get(matchedKey)!;
      // Consolidate max scores
      ex.today_score = Math.max(ex.today_score || 0, safeToday);
      ex.week_score = Math.max(ex.week_score || 0, safeWeek);
      ex.month_score = Math.max(ex.month_score || 0, safeMonth);
      ex.all_time_score = Math.max(ex.all_time_score || 0, safeAllTime);

      // Always choose the updated real name over placeholder or old name
      if (u.name && u.name !== "শিক্ষার্থী") {
        if (!ex.name || ex.name === "শিক্ষার্থী" || ex.name === "Eomsdv" || u.name === "আহসান হাবীব") {
          ex.name = u.name;
        }
      }

      // Preserve canonical modern student ID
      if (uSid && uSid.startsWith("JM-") && (!ex.student_id || ex.student_id === "JM-748193")) {
        ex.student_id = uSid;
      }

      // Preserve avatar
      if (uAvatar && !ex.avatar_url) {
        ex.avatar_url = uAvatar;
      }

      // Keep latest timestamp
      if (u.updated_at && (!ex.updated_at || new Date(u.updated_at) > new Date(ex.updated_at))) {
        ex.updated_at = u.updated_at;
      }

      dedupedMap.set(matchedKey, ex);
    } else {
      const canonicalKey = uSid || uUid || `user_${Date.now()}_${Math.random()}`;
      dedupedMap.set(canonicalKey, {
        id: uUid || canonicalKey,
        name: u.name || "শিক্ষার্থী",
        student_id: uSid || `JM-${Math.floor(100000 + Math.random() * 900000)}`,
        avatar_url: uAvatar || "",
        today_score: safeToday,
        week_score: safeWeek,
        month_score: safeMonth,
        all_time_score: safeAllTime,
        updated_at: u.updated_at || new Date().toISOString()
      });
    }
  }

  const sanitizedUsers = Array.from(dedupedMap.values());
  const hadDuplicates = sanitizedUsers.length < baseUsers.length;

  globalLeaderboardStore = sanitizedUsers;
  lastDbSyncTime = Date.now();

  // If duplicates were merged/purged, persist cleaned store asynchronously
  if (hadDuplicates) {
    saveServerStore(sanitizedUsers).catch(() => {});
  }

  return globalLeaderboardStore;
}

async function saveServerStore(users: LeaderboardUser[]) {
  globalLeaderboardStore = users;
  isStoreInitialized = true;
  lastDbSyncTime = Date.now();

  try {
    const supabase = getSupabase();
    if (supabase) {
      await supabase.from("app_config").upsert(
        { key: "jobmaster_leaderboard_v2", value: users, updated_at: new Date().toISOString() },
        { onConflict: "key" }
      );
    }

    await fetch(CLOUD_KV_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(users)
    });
  } catch (e) {
    console.warn("Could not persist leaderboard store remotely:", e);
  }
}

// GET /api/leaderboard - with 45s server cache
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const force = searchParams.get("force") === "true";
  const users = await loadServerStore(force);
  return NextResponse.json({ users });
}

// PUT /api/leaderboard - Sync Profile changes (Name, Student ID, Avatar) and Deduplicate Leaderboard
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, studentId, avatarUrl, oldStudentId } = body;

    if (!userId && !studentId) {
      return NextResponse.json({ error: "Missing userId or studentId" }, { status: 400 });
    }

    const currentUsers = await loadServerStore(true);
    let matchedCount = 0;

    // Search and update all matching entries
    const matchingIndices: number[] = [];
    for (let i = 0; i < currentUsers.length; i++) {
      const u = currentUsers[i];
      const idMatch = userId && u.id === userId;
      const sidMatch = studentId && u.student_id === studentId;
      const oldSidMatch = oldStudentId && u.student_id === oldStudentId;
      const avatarMatch = avatarUrl && u.avatar_url && u.avatar_url === avatarUrl && avatarUrl.includes("lh3.googleusercontent.com");
      const aliasMatch =
        (u.name === "Eomsdv" && (userName === "আহসান হাবীব" || studentId === "JM-863962")) ||
        (u.student_id === "JM-748193" && (studentId === "JM-863962" || userName === "আহসান হাবীব"));

      if (idMatch || sidMatch || oldSidMatch || avatarMatch || aliasMatch) {
        matchingIndices.push(i);
      }
    }

    if (matchingIndices.length > 0) {
      const primaryIdx = matchingIndices[0];
      const primary = currentUsers[primaryIdx];
      if (userId) primary.id = userId;
      if (userName) primary.name = userName;
      if (studentId) primary.student_id = studentId;
      if (avatarUrl) primary.avatar_url = avatarUrl;

      // Merge scores from any duplicate records
      for (let i = 1; i < matchingIndices.length; i++) {
        const other = currentUsers[matchingIndices[i]];
        primary.today_score = Math.max(primary.today_score || 0, other.today_score || 0);
        primary.week_score = Math.max(primary.week_score || 0, other.week_score || 0);
        primary.month_score = Math.max(primary.month_score || 0, other.month_score || 0);
        primary.all_time_score = Math.max(primary.all_time_score || 0, other.all_time_score || 0);
      }
      primary.updated_at = new Date().toISOString();
      currentUsers[primaryIdx] = primary;

      const toRemove = new Set(matchingIndices.slice(1));
      const cleaned = currentUsers.filter((_, idx) => !toRemove.has(idx));
      await saveServerStore(cleaned);
      matchedCount = matchingIndices.length;
    }

    // Also update Supabase quiz_scores table so DB is completely synced
    try {
      const supabase = getSupabase();
      if (supabase) {
        const scorePayload: any = {
          updated_at: new Date().toISOString()
        };
        if (userName) scorePayload.user_name = userName;
        if (studentId) scorePayload.student_id = studentId;
        if (avatarUrl) scorePayload.avatar_url = avatarUrl;

        await supabase
          .from("quiz_scores")
          .update(scorePayload)
          .or(`user_id.eq.${userId}${studentId ? `,student_id.eq.${studentId}` : ""}${oldStudentId ? `,student_id.eq.${oldStudentId}` : ""}`);
      }
    } catch (dbErr) {
      console.warn("DB quiz_scores sync warning:", dbErr);
    }

    const refreshed = await loadServerStore(true);
    return NextResponse.json({ success: true, matchedCount, users: refreshed });
  } catch (err: any) {
    console.error("PUT /api/leaderboard error:", err);
    return NextResponse.json({ error: err?.message || "Leaderboard sync failed" }, { status: 500 });
  }
}

// POST /api/leaderboard - Submit Live Quiz score with 4-score Supabase update & Cycle resets
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, studentId, avatarUrl, score } = body;

    if (!userId || typeof score !== "number" || score < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const currentUsers = await loadServerStore(false);
    const existingIndex = currentUsers.findIndex(
      (u) => u.id === userId || (studentId && u.student_id === studentId) || u.name === userName
    );

    const nowIso = new Date().toISOString();
    let finalToday = score;
    let finalWeek = score;
    let finalMonth = score;
    let finalAllTime = score;
    let resolvedStudentId = studentId;

    if (existingIndex >= 0) {
      const u = currentUsers[existingIndex];
      const validToday = isBDToday(u.updated_at);
      const validWeek = isBDThisWeek(u.updated_at);
      const validMonth = isBDThisMonth(u.updated_at);

      finalToday = (validToday ? u.today_score || 0 : 0) + score;
      finalWeek = (validWeek ? u.week_score || 0 : 0) + score;
      finalMonth = (validMonth ? u.month_score || 0 : 0) + score;
      finalAllTime = (u.all_time_score || 0) + score;

      u.today_score = finalToday;
      u.week_score = finalWeek;
      u.month_score = finalMonth;
      u.all_time_score = finalAllTime;
      if (userName) u.name = userName;
      if (avatarUrl) u.avatar_url = avatarUrl;
      if (studentId) u.student_id = studentId;
      resolvedStudentId = u.student_id;
      u.updated_at = nowIso;
      currentUsers[existingIndex] = u;
    } else {
      resolvedStudentId = studentId || `JM-${Math.floor(100000 + Math.random() * 900000)}`;
      const newUser: LeaderboardUser = {
        id: userId,
        name: userName || "শিক্ষার্থী",
        student_id: resolvedStudentId,
        avatar_url: avatarUrl || "",
        today_score: finalToday,
        week_score: finalWeek,
        month_score: finalMonth,
        all_time_score: finalAllTime,
        updated_at: nowIso
      };
      currentUsers.push(newUser);
    }

    // Save in server store / app_config
    await saveServerStore(currentUsers);

    // Save & update in Supabase quiz_scores table directly with 4 scores
    try {
      const supabase = getSupabase();
      if (supabase && userId) {
        const { data: existingRows } = await supabase
          .from("quiz_scores")
          .select("id, user_id, today_score, week_score, month_score, all_time_score, score, updated_at, created_at")
          .eq("user_id", userId);

        if (existingRows && existingRows.length > 0) {
          const primary = existingRows[0];
          
          // Try updating all 4 score columns
          const updatePayload: any = {
            today_score: finalToday,
            week_score: finalWeek,
            month_score: finalMonth,
            all_time_score: finalAllTime,
            score: finalAllTime,
            user_name: userName,
            student_id: resolvedStudentId,
            avatar_url: avatarUrl || "",
            updated_at: nowIso
          };

          const { error: updateErr } = await supabase
            .from("quiz_scores")
            .update(updatePayload)
            .eq("id", primary.id);

          if (updateErr) {
            // Fallback for legacy schema (only score column)
            await supabase
              .from("quiz_scores")
              .update({ score: finalAllTime, created_at: nowIso })
              .eq("id", primary.id);
          }

          // Prune duplicates if multiple rows existed
          if (existingRows.length > 1) {
            const dups = existingRows.slice(1).map((r) => r.id);
            await supabase.from("quiz_scores").delete().in("id", dups);
          }
        } else {
          // Insert new record into quiz_scores
          const insertPayload: any = {
            user_id: userId,
            user_name: userName || "শিক্ষার্থী",
            student_id: resolvedStudentId,
            avatar_url: avatarUrl || "",
            today_score: finalToday,
            week_score: finalWeek,
            month_score: finalMonth,
            all_time_score: finalAllTime,
            score: finalAllTime,
            updated_at: nowIso,
            created_at: nowIso
          };

          const { error: insertErr } = await supabase.from("quiz_scores").insert([insertPayload]);
          if (insertErr) {
            // Fallback for legacy schema
            await supabase.from("quiz_scores").insert([
              { user_id: userId, score: finalAllTime, created_at: nowIso }
            ]);
          }
        }
      }
    } catch (dbErr) {
      console.warn("DB quiz_scores 4-score write notice:", dbErr);
    }

    return NextResponse.json({ success: true, users: currentUsers });
  } catch (e) {
    console.error("POST /api/leaderboard error:", e);
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 });
  }
}

// DELETE /api/leaderboard - Admin Trigger to Clean & Consolidate Database Scores (Strategy 3)
export async function DELETE(req: NextRequest) {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 400 });
    }

    // Fetch all quiz_scores
    const { data: allScores, error } = await supabase
      .from("quiz_scores")
      .select("id, user_id, score, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    let deletedCount = 0;
    const userMap = new Map<string, string>(); // user_id -> primary row id
    const duplicateIdsToDelete: string[] = [];

    if (Array.isArray(allScores)) {
      for (const row of allScores) {
        if (!row.user_id) {
          duplicateIdsToDelete.push(row.id);
          continue;
        }
        if (!userMap.has(row.user_id)) {
          userMap.set(row.user_id, row.id);
        } else {
          duplicateIdsToDelete.push(row.id);
        }
      }
    }

    if (duplicateIdsToDelete.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < duplicateIdsToDelete.length; i += batchSize) {
        const batch = duplicateIdsToDelete.slice(i, i + batchSize);
        await supabase.from("quiz_scores").delete().in("id", batch);
        deletedCount += batch.length;
      }
    }

    // Reload and clean store
    await loadServerStore(true);

    return NextResponse.json({
      success: true,
      message: `ক্লিনআপ সম্পন্ন হয়েছে! ${deletedCount} টি অপ্রয়োজনীয় ডুপ্লিকেট রেকর্ড মুছে ফেলা হয়েছে এবং ১ ইউজার = ১ রেকর্ড বজায় রাখা হয়েছে।`,
      deletedCount,
      uniqueUsersCount: userMap.size
    });
  } catch (e: any) {
    console.error("DELETE /api/leaderboard error:", e);
    return NextResponse.json({ error: e.message || "Cleanup failed" }, { status: 500 });
  }
}

// PATCH /api/leaderboard - Admin modify user score
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, today_score, week_score, month_score, all_time_score, name } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const currentUsers = await loadServerStore();
    const existingIndex = currentUsers.findIndex((u) => u.id === userId);

    if (existingIndex >= 0) {
      const u = currentUsers[existingIndex];
      if (typeof today_score === "number") u.today_score = today_score;
      if (typeof week_score === "number") u.week_score = week_score;
      if (typeof month_score === "number") u.month_score = month_score;
      if (typeof all_time_score === "number") u.all_time_score = all_time_score;
      if (name) u.name = name;
      u.updated_at = new Date().toISOString();
      currentUsers[existingIndex] = u;
    } else {
      // Create new custom entry if admin modifies non-existent
      const newUser: LeaderboardUser = {
        id: userId,
        name: name || "শিক্ষার্থী",
        student_id: `JM-${Math.floor(100000 + Math.random() * 900000)}`,
        avatar_url: "",
        today_score: today_score || 0,
        week_score: week_score || 0,
        month_score: month_score || 0,
        all_time_score: all_time_score || 0,
        updated_at: new Date().toISOString()
      };
      currentUsers.push(newUser);
    }

    await saveServerStore(currentUsers);

    // Also update Supabase quiz_scores table if configured
    try {
      const supabase = getSupabase();
      if (supabase && userId) {
        const u = currentUsers.find((user) => user.id === userId);
        if (u) {
          const updatePayload: any = {
            today_score: u.today_score || 0,
            week_score: u.week_score || 0,
            month_score: u.month_score || 0,
            all_time_score: u.all_time_score || 0,
            score: u.all_time_score || 0,
            user_name: u.name,
            updated_at: new Date().toISOString()
          };
          const { error } = await supabase
            .from("quiz_scores")
            .update(updatePayload)
            .eq("user_id", userId);

          if (error) {
            await supabase
              .from("quiz_scores")
              .update({ score: u.all_time_score || 0, created_at: new Date().toISOString() })
              .eq("user_id", userId);
          }
        }
      }
    } catch (err) {
      console.warn("PATCH supabase quiz_scores sync notice:", err);
    }

    return NextResponse.json({ success: true, users: currentUsers });
  } catch (e) {
    console.error("PATCH /api/leaderboard error:", e);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
