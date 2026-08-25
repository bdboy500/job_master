import { getSupabase } from "./supabase";

export interface LeaderboardUser {
  id: string;
  name: string;
  student_id: string;
  avatar_url?: string;
  today_score: number;
  week_score: number;
  month_score: number;
  all_time_score: number;
  updated_at?: string;
}

export interface QuizScoreRecord {
  id: string;
  user_id: string;
  user_name: string;
  student_id: string;
  avatar_url?: string;
  score: number; // Correct answers count (+1 per correct answer)
  created_at: string; // ISO string timestamp
}

export const INITIAL_LEADERBOARD_USERS: LeaderboardUser[] = [
  {
    id: "user_top_1",
    name: "মেহেদী হাসান",
    student_id: "JM-882104",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    today_score: 18,
    week_score: 145,
    month_score: 450,
    all_time_score: 820,
    updated_at: new Date().toISOString()
  },
  {
    id: "user_top_2",
    name: "তানজিলা ইসলাম",
    student_id: "JM-742910",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    today_score: 16,
    week_score: 138,
    month_score: 420,
    all_time_score: 790,
    updated_at: new Date().toISOString()
  },
  {
    id: "user_top_3",
    name: "সাব্বির হোসেন",
    student_id: "JM-630192",
    avatar_url: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80",
    today_score: 15,
    week_score: 130,
    month_score: 395,
    all_time_score: 740,
    updated_at: new Date().toISOString()
  },
  {
    id: "user_top_4",
    name: "মোরশেদ আলম",
    student_id: "JM-519283",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    today_score: 12,
    week_score: 110,
    month_score: 320,
    all_time_score: 610,
    updated_at: new Date().toISOString()
  },
  {
    id: "user_top_5",
    name: "এশা রহমান",
    student_id: "JM-482019",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    today_score: 10,
    week_score: 98,
    month_score: 280,
    all_time_score: 540,
    updated_at: new Date().toISOString()
  },
  {
    id: "user_top_6",
    name: "কাউসার আহমেদ",
    student_id: "JM-391827",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    today_score: 8,
    week_score: 85,
    month_score: 250,
    all_time_score: 490,
    updated_at: new Date().toISOString()
  },
  {
    id: "user_top_7",
    name: "সামিউল ইসলাম",
    student_id: "JM-281930",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80",
    today_score: 7,
    week_score: 74,
    month_score: 210,
    all_time_score: 410,
    updated_at: new Date().toISOString()
  },
  {
    id: "user_top_8",
    name: "আফসানা মিমি",
    student_id: "JM-192837",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    today_score: 6,
    week_score: 65,
    month_score: 180,
    all_time_score: 360,
    updated_at: new Date().toISOString()
  },
  {
    id: "user_top_9",
    name: "প্রিয়া রায়",
    student_id: "JM-102938",
    avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80",
    today_score: 5,
    week_score: 55,
    month_score: 150,
    all_time_score: 310,
    updated_at: new Date().toISOString()
  },
  {
    id: "user_top_10",
    name: "রাশেদ খান",
    student_id: "JM-091827",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
    today_score: 4,
    week_score: 42,
    month_score: 120,
    all_time_score: 250,
    updated_at: new Date().toISOString()
  }
];

// Helper to get Date object forced to Bangladesh Time (Asia/Dhaka, UTC+6)
export function getBangladeshDate(dateInput?: string | number | Date): Date {
  const d = dateInput ? new Date(dateInput) : new Date();
  const bdStr = d.toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
  return new Date(bdStr);
}

// 1. Daily Cycle: Starts at today 00:00:00.000 BD time (resets every midnight)
export function getBDDailyCycleStart(refDate?: Date): Date {
  const bd = getBangladeshDate(refDate);
  bd.setHours(0, 0, 0, 0);
  return bd;
}

// 2. Weekly Cycle: Resets every Friday at 12:00 AM (00:00:00.000 BD time)
// In JavaScript getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
// Days since last Friday: (bdDay - 5 + 7) % 7
export function getBDWeeklyCycleStart(refDate?: Date): Date {
  const bd = getBangladeshDate(refDate);
  bd.setHours(0, 0, 0, 0);
  const day = bd.getDay();
  const daysSinceFriday = (day - 5 + 7) % 7;
  bd.setDate(bd.getDate() - daysSinceFriday);
  return bd;
}

// 3. Monthly Cycle: Resets at the start of each month (1st of month at 00:00:00.000 BD time)
export function getBDMonthlyCycleStart(refDate?: Date): Date {
  const bd = getBangladeshDate(refDate);
  bd.setDate(1);
  bd.setHours(0, 0, 0, 0);
  return bd;
}

export function isToday(dateStr?: string): boolean {
  if (!dateStr) return false;
  const scoreDate = getBangladeshDate(dateStr);
  const cycleStart = getBDDailyCycleStart();
  return scoreDate.getTime() >= cycleStart.getTime();
}

export function isThisWeek(dateStr?: string): boolean {
  if (!dateStr) return false;
  const scoreDate = getBangladeshDate(dateStr);
  const cycleStart = getBDWeeklyCycleStart();
  return scoreDate.getTime() >= cycleStart.getTime();
}

export function isThisMonth(dateStr?: string): boolean {
  if (!dateStr) return false;
  const scoreDate = getBangladeshDate(dateStr);
  const cycleStart = getBDMonthlyCycleStart();
  return scoreDate.getTime() >= cycleStart.getTime();
}

// Client helper API calls with in-memory TTL caching
let clientLeaderboardCache: { users: LeaderboardUser[]; timestamp: number } | null = null;
const CLIENT_CACHE_TTL_MS = 30000; // 30 seconds client-side cache

export async function fetchLeaderboard(forceRefresh = false): Promise<LeaderboardUser[]> {
  const now = Date.now();
  if (!forceRefresh && clientLeaderboardCache && (now - clientLeaderboardCache.timestamp) < CLIENT_CACHE_TTL_MS) {
    return clientLeaderboardCache.users;
  }

  try {
    const res = await fetch("/api/leaderboard", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users) && data.users.length > 0) {
        clientLeaderboardCache = { users: data.users, timestamp: Date.now() };
        return data.users;
      }
    }
  } catch (e) {
    console.error("Failed to fetch leaderboard:", e);
  }
  return clientLeaderboardCache?.users || INITIAL_LEADERBOARD_USERS;
}

export async function submitLiveQuizScore(payload: {
  userId: string;
  userName: string;
  studentId?: string;
  avatarUrl?: string;
  score: number;
}): Promise<LeaderboardUser[]> {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users)) {
        clientLeaderboardCache = { users: data.users, timestamp: Date.now() };
        return data.users;
      }
    }
  } catch (e) {
    console.error("Failed to submit live quiz score:", e);
  }
  return clientLeaderboardCache?.users || INITIAL_LEADERBOARD_USERS;
}

export async function adminUpdateLeaderboardUser(payload: {
  userId: string;
  today_score?: number;
  week_score?: number;
  month_score?: number;
  all_time_score?: number;
  name?: string;
}): Promise<LeaderboardUser[]> {
  try {
    const res = await fetch("/api/leaderboard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.users)) {
        return data.users;
      }
    }
  } catch (e) {
    console.error("Failed to update user score by admin:", e);
  }
  return INITIAL_LEADERBOARD_USERS;
}
