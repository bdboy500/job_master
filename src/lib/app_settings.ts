import { getSupabase } from "./supabase";

export interface AppSettings {
  ourCoursesHomeLimit: number; // 1 - 12
  prepHubHomeLimit: number;   // 1 - 12
  proSectionHomeLimit?: number; // 1 - 12
  proSectionActive?: boolean;
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ourCoursesHomeLimit: 5,
  prepHubHomeLimit: 4,
  proSectionHomeLimit: 4,
  proSectionActive: true
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
  const currentLocal = getCachedAppSettings();

  // 1. Try direct Supabase query first
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_config")
        .select("value")
        .eq("key", "home_display_settings")
        .maybeSingle();

      if (!error && data && data.value && typeof data.value.ourCoursesHomeLimit === "number") {
        memorySettingsCache = data.value;
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.value));
          } catch (e) {}
        }
        return data.value;
      }
    }
  } catch (e) {
    console.warn("Direct Supabase settings fetch error:", e);
  }

  // 2. Next try API endpoint
  try {
    const res = await fetch("/api/app-settings", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && data.settings && typeof data.settings.ourCoursesHomeLimit === "number") {
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

  return currentLocal;
}

export async function saveAppSettingsToDb(settings: AppSettings): Promise<boolean> {
  memorySettingsCache = settings;
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {}
  }

  let savedLocallyOrRemote = true;

  // 1. Direct Supabase save
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("app_config")
        .upsert(
          { key: "home_display_settings", value: settings, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) {
        console.warn("Supabase direct app_config upsert error:", error);
      }
    }
  } catch (e) {
    console.warn("Direct Supabase save app_settings error:", e);
  }

  // 2. API endpoint save
  try {
    const res = await fetch("/api/app-settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings)
    });
    if (!res.ok) savedLocallyOrRemote = false;
  } catch (e) {
    console.warn("Failed to save app settings via API:", e);
  }

  return savedLocallyOrRemote;
}
