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
        .select("id, full_name, student_id");

      const { data: quizScores } = await supabase
        .from("quiz_scores")
        .select("id, user_id, score, created_at")
        .order("created_at", { ascending: false });

      // Aggregate quiz scores per user according to cycles and detect duplicates to clean
      const userScoresAgg = new Map<string, { today: number; week: number; month: number; allTime: number; primaryId: string; duplicateIds: string[] }>();
      
      if (Array.isArray(quizScores)) {
        for (const qs of quizScores) {
          const uid = qs.user_id;
          if (!uid) continue;
          const sc = Number(qs.score) || 0;
          const createdAt = qs.created_at || new Date().toISOString();

          if (!userScoresAgg.has(uid)) {
            userScoresAgg.set(uid, { 
              today: 0, 
              week: 0, 
              month: 0, 
              allTime: 0,
              primaryId: qs.id,
              duplicateIds: []
            });
          } else {
            // Found a duplicate row for this user! (Strategy 3: auto cleanup)
            const agg = userScoresAgg.get(uid)!;
            if (qs.id && qs.id !== agg.primaryId) {
              agg.duplicateIds.push(qs.id);
            }
          }

          const agg = userScoresAgg.get(uid)!;
          agg.allTime = Math.max(agg.allTime, sc);
          if (isBDToday(createdAt)) agg.today = Math.max(agg.today, sc);
          if (isBDThisWeek(createdAt)) agg.week = Math.max(agg.week, sc);
          if (isBDThisMonth(createdAt)) agg.month = Math.max(agg.month, sc);
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
          const uid = p.id;
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
              updated_at: new Date().toISOString()
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn("Error augmenting store from Supabase DB:", err);
  }

  // Sanitize all output users and enforce active cycle zeroing
  const sanitizedUsers = baseUsers.map((u) => {
    const isTodayScoreValid = isBDToday(u.updated_at);
    const isWeekScoreValid = isBDThisWeek(u.updated_at);
    const isMonthScoreValid = isBDThisMonth(u.updated_at);

    const rawToday = isTodayScoreValid ? Number(u.today_score ?? (u as any).score ?? 0) : 0;
    const rawWeek = isWeekScoreValid ? Number(u.week_score ?? (u as any).score ?? rawToday) : 0;
    const rawMonth = isMonthScoreValid ? Number(u.month_score ?? (u as any).score ?? rawWeek) : 0;
    const rawAllTime = Number(u.all_time_score ?? (u as any).score ?? rawMonth);

    return {
      id: u.id || `user_${Date.now()}`,
      name: u.name || "শিক্ষার্থী",
      student_id: u.student_id || `JM-${Math.floor(100000 + Math.random() * 900000)}`,
      avatar_url: u.avatar_url || "",
      today_score: isNaN(rawToday) ? 0 : rawToday,
      week_score: isNaN(rawWeek) ? 0 : rawWeek,
      month_score: isNaN(rawMonth) ? 0 : rawMonth,
      all_time_score: isNaN(rawAllTime) ? 0 : rawAllTime,
      updated_at: u.updated_at || new Date().toISOString()
    };
  });

  globalLeaderboardStore = sanitizedUsers;
  lastDbSyncTime = Date.now();
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

// POST /api/leaderboard - Submit Live Quiz score with Single-Row Upsert & Aggregation
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

    if (existingIndex >= 0) {
      const u = currentUsers[existingIndex];
      const validToday = isBDToday(u.updated_at);
      const validWeek = isBDThisWeek(u.updated_at);
      const validMonth = isBDThisMonth(u.updated_at);

      u.today_score = (validToday ? u.today_score || 0 : 0) + score;
      u.week_score = (validWeek ? u.week_score || 0 : 0) + score;
      u.month_score = (validMonth ? u.month_score || 0 : 0) + score;
      u.all_time_score = (u.all_time_score || 0) + score;
      if (userName) u.name = userName;
      if (avatarUrl) u.avatar_url = avatarUrl;
      if (studentId) u.student_id = studentId;
      u.updated_at = nowIso;
      currentUsers[existingIndex] = u;
    } else {
      const newUser: LeaderboardUser = {
        id: userId || `user_${Date.now()}`,
        name: userName || "শিক্ষার্থী",
        student_id: studentId || `JM-${Math.floor(100000 + Math.random() * 900000)}`,
        avatar_url: avatarUrl || "",
        today_score: score,
        week_score: score,
        month_score: score,
        all_time_score: score,
        updated_at: nowIso
      };
      currentUsers.push(newUser);
    }

    // Save in server store / app_config
    await saveServerStore(currentUsers);

    // Strategy 1 & 2: Update Supabase quiz_scores as a compact single-row upsert
    try {
      const supabase = getSupabase();
      if (supabase && userId && !userId.startsWith("user_")) {
        const { data: existingRows } = await supabase
          .from("quiz_scores")
          .select("id, score")
          .eq("user_id", userId);

        if (existingRows && existingRows.length > 0) {
          const primary = existingRows[0];
          await supabase
            .from("quiz_scores")
            .update({ score: score, created_at: nowIso })
            .eq("id", primary.id);

          if (existingRows.length > 1) {
            const dups = existingRows.slice(1).map(r => r.id);
            await supabase.from("quiz_scores").delete().in("id", dups);
          }
        } else {
          await supabase.from("quiz_scores").insert([
            { user_id: userId, score: score, created_at: nowIso }
          ]);
        }
      }
    } catch (dbErr) {
      console.warn("DB compact write notice:", dbErr);
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
    return NextResponse.json({ success: true, users: currentUsers });
  } catch (e) {
    console.error("PATCH /api/leaderboard error:", e);
    return NextResponse.json({ error: "Failed to update score" }, { status: 500 });
  }
}
