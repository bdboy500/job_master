import { getSupabase } from "./supabase";

export interface AppSettings {
  ourCoursesHomeLimit: number; // 1 - 12
  prepHubHomeLimit: number;   // 1 - 12
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ourCoursesHomeLimit: 5,
  prepHubHomeLimit: 4
};

const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_app_settings_v2";
const LOCAL_STORAGE_KEY = "jobmaster_app_settings_cache";

let memorySettingsCache: AppSettings | null = null;

export function getCachedAppSettings(): AppSettings {
  if (memorySettingsCache) return memorySettingsCache;
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.ourCoursesHomeLimit === "number") {
          memorySettingsCache = parsed;
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }
  }
  return DEFAULT_APP_SETTINGS;
}

export async function fetchAppSettingsFromDb(): Promise<AppSettings> {
  try {
    const res = await fetch("/api/app-settings", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings) {
        memorySettingsCache = data.settings;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.settings));
          } catch (e) {}
        }
        return data.settings;
      }
    }
  } catch (e) {
    console.warn("Failed to fetch app settings from API:", e);
  }
  return getCachedAppSettings();
}

export async function saveAppSettingsToDb(settings: AppSettings): Promise<boolean> {
  memorySettingsCache = settings;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  try {
    const res = await fetch("/api/app-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    return res.ok;
  } catch (e) {
    console.warn("Failed to save app settings via API:", e);
    return false;
  }
}
