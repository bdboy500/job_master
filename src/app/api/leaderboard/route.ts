import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { LeaderboardUser, INITIAL_LEADERBOARD_USERS } from "@/src/lib/leaderboard";

const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_leaderboard_v2";

// In-memory cache for server persistence fallback
let globalLeaderboardStore: LeaderboardUser[] = [...INITIAL_LEADERBOARD_USERS];
let isStoreInitialized = false;

function getBDDate(dateStr?: string): Date {
  const d = dateStr ? new Date(dateStr) : new Date();
  const bdStr = d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  return new Date(bdStr);
}

function isBDToday(dateStr: string): boolean {
  const d = getBDDate(dateStr);
  const now = getBDDate();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function isBDThisWeek(dateStr: string): boolean {
  const d = getBDDate(dateStr);
  const now = getBDDate();
  const diffMs = Math.abs(now.getTime() - d.getTime());
  return diffMs <= 7 * 24 * 60 * 60 * 1000;
}

function isBDThisMonth(dateStr: string): boolean {
  const d = getBDDate(dateStr);
  const now = getBDDate();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth()
  );
}

async function loadServerStore(): Promise<LeaderboardUser[]> {
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

  // Synchronize with Supabase profiles and quiz_scores if available
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, student_id");

      const { data: quizScores } = await supabase
        .from("quiz_scores")
        .select("user_id, score, created_at");

      // Aggregate quiz scores per user
      const userScoresAgg = new Map<string, { today: number; week: number; month: number; allTime: number }>();
      if (Array.isArray(quizScores)) {
        for (const qs of quizScores) {
          const uid = qs.user_id;
          if (!uid) continue;
          const sc = Number(qs.score) || 0;
          const createdAt = qs.created_at || new Date().toISOString();

          if (!userScoresAgg.has(uid)) {
            userScoresAgg.set(uid, { today: 0, week: 0, month: 0, allTime: 0 });
          }
          const agg = userScoresAgg.get(uid)!;
          agg.allTime += sc;
          if (isBDToday(createdAt)) agg.today += sc;
          if (isBDThisWeek(createdAt)) agg.week += sc;
          if (isBDThisMonth(createdAt)) agg.month += sc;
        }
      }

      // Merge profiles & aggregated scores into baseUsers
      if (Array.isArray(profiles) && profiles.length > 0) {
        for (const p of profiles) {
          const uid = p.id;
          const pName = p.full_name || "শিক্ষার্থী";
          const pStudentId = p.student_id || `JM-${uid.substring(0, 6)}`;
          const pAvatar = (p as any).avatar_url || "";
          const agg = userScoresAgg.get(uid) || { today: 0, week: 0, month: 0, allTime: 0 };

          const existingIdx = baseUsers.findIndex(
            (u) => u.id === uid || (pStudentId && u.student_id === pStudentId) || u.name === pName
          );

          if (existingIdx >= 0) {
            const ex = baseUsers[existingIdx];
            ex.id = uid; // ensure ID is matched
            ex.name = pName || ex.name;
            ex.student_id = pStudentId || ex.student_id;
            if (pAvatar) ex.avatar_url = pAvatar;
            ex.today_score = Math.max(ex.today_score || 0, agg.today);
            ex.week_score = Math.max(ex.week_score || 0, agg.week);
            ex.month_score = Math.max(ex.month_score || 0, agg.month);
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

  // Sanitize all output users to guarantee valid non-NaN scores
  const sanitizedUsers = baseUsers.map((u) => {
    const today = Number(u.today_score ?? (u as any).score ?? 0);
    const week = Number(u.week_score ?? (u as any).score ?? today);
    const month = Number(u.month_score ?? (u as any).score ?? week);
    const allTime = Number(u.all_time_score ?? (u as any).score ?? month);

    return {
      id: u.id || `user_${Date.now()}`,
      name: u.name || "শিক্ষার্থী",
      student_id: u.student_id || `JM-${Math.floor(100000 + Math.random() * 900000)}`,
      avatar_url: u.avatar_url || "",
      today_score: isNaN(today) ? 0 : today,
      week_score: isNaN(week) ? 0 : week,
      month_score: isNaN(month) ? 0 : month,
      all_time_score: isNaN(allTime) ? 0 : allTime,
      updated_at: u.updated_at || new Date().toISOString()
    };
  });

  globalLeaderboardStore = sanitizedUsers;
  return globalLeaderboardStore;
}

async function saveServerStore(users: LeaderboardUser[]) {
  globalLeaderboardStore = users;
  isStoreInitialized = true;

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

// GET /api/leaderboard
export async function GET() {
  const users = await loadServerStore();
  return NextResponse.json({ users });
}

// POST /api/leaderboard - Submit Live Quiz score
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, userName, studentId, avatarUrl, score } = body;

    if (!userId || typeof score !== "number" || score < 0) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const currentUsers = await loadServerStore();
    const existingIndex = currentUsers.findIndex(
      (u) => u.id === userId || (studentId && u.student_id === studentId) || u.name === userName
    );

    const nowIso = new Date().toISOString();

    if (existingIndex >= 0) {
      const u = currentUsers[existingIndex];
      u.today_score = (u.today_score || 0) + score;
      u.week_score = (u.week_score || 0) + score;
      u.month_score = (u.month_score || 0) + score;
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

    await saveServerStore(currentUsers);
    return NextResponse.json({ success: true, users: currentUsers });
  } catch (e) {
    console.error("POST /api/leaderboard error:", e);
    return NextResponse.json({ error: "Failed to submit score" }, { status: 500 });
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
