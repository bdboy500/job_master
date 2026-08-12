import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { LeaderboardUser, INITIAL_LEADERBOARD_USERS } from "@/src/lib/leaderboard";

const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_leaderboard_v2";

// In-memory cache for server persistence fallback
let globalLeaderboardStore: LeaderboardUser[] = [...INITIAL_LEADERBOARD_USERS];
let isStoreInitialized = false;

async function loadServerStore(): Promise<LeaderboardUser[]> {
  if (isStoreInitialized && globalLeaderboardStore.length > 0) {
    return globalLeaderboardStore;
  }

  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_config")
        .select("key, value")
        .eq("key", "jobmaster_leaderboard_v2")
        .maybeSingle();

      if (!error && data && Array.isArray(data.value) && data.value.length > 0) {
        globalLeaderboardStore = data.value;
        isStoreInitialized = true;
        return globalLeaderboardStore;
      }
    }

    // Try Cloud KV
    const res = await fetch(CLOUD_KV_URL, { cache: "no-store" });
    if (res.ok) {
      const kvData = await res.json();
      if (Array.isArray(kvData) && kvData.length > 0) {
        globalLeaderboardStore = kvData;
        isStoreInitialized = true;
        return globalLeaderboardStore;
      }
    }
  } catch (e) {
    console.warn("Could not fetch remote leaderboard store, using default:", e);
  }

  isStoreInitialized = true;
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
