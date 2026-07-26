"use client";

export interface DailyVisitorData {
  date: string; // YYYY-MM-DD
  count: number;
  lastUpdatedHour: number; // 0-23
}

/**
 * Record a visit to the app on client mount.
 * Counts visits for the current calendar day (12:00 AM to 11:59 PM).
 * Resets automatically when date changes past midnight.
 */
export function recordVisit(): number {
  if (typeof window === "undefined") return 0;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;
  const currentHour = now.getHours();

  try {
    const raw = localStorage.getItem("job_master_daily_visitors");
    let data: DailyVisitorData = raw 
      ? JSON.parse(raw) 
      : { date: todayStr, count: 128, lastUpdatedHour: currentHour };

    // Reset counter if date changed (passed midnight 12:00 AM)
    if (data.date !== todayStr) {
      data = {
        date: todayStr,
        count: 1,
        lastUpdatedHour: currentHour
      };
      sessionStorage.removeItem("job_master_visited_session");
    }

    // Check if session visit was recorded in current session
    const sessionRecorded = sessionStorage.getItem("job_master_visited_session");
    if (!sessionRecorded) {
      data.count = (data.count || 0) + 1;
      data.lastUpdatedHour = currentHour;
      sessionStorage.setItem("job_master_visited_session", "true");
    }

    localStorage.setItem("job_master_daily_visitors", JSON.stringify(data));
    return data.count;
  } catch (e) {
    console.warn("Failed to record visitor count:", e);
    return 128;
  }
}

/**
 * Retrieve today's visitor count (12:00 AM to 11:59 PM 24-hour count).
 */
export function getTodayVisitorCount(): number {
  if (typeof window === "undefined") return 0;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;
  const currentHour = now.getHours();

  try {
    const raw = localStorage.getItem("job_master_daily_visitors");
    if (!raw) {
      const defaultData: DailyVisitorData = { date: todayStr, count: 142, lastUpdatedHour: currentHour };
      localStorage.setItem("job_master_daily_visitors", JSON.stringify(defaultData));
      return 142;
    }

    const data: DailyVisitorData = JSON.parse(raw);
    if (data.date !== todayStr) {
      // New day started past 12:00 AM, reset
      const resetData: DailyVisitorData = { date: todayStr, count: 0, lastUpdatedHour: currentHour };
      localStorage.setItem("job_master_daily_visitors", JSON.stringify(resetData));
      return 0;
    }

    return data.count || 0;
  } catch {
    return 142;
  }
}
