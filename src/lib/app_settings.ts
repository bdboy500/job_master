import { getSupabase } from "./supabase";

export interface PopupNotificationConfig {
  enabled: boolean;            // ON/OFF toggle
  badgeText: string;          // e.g. "বিশেষ শিক্ষার্থী অফার" / "জরুরি বিজ্ঞপ্তি"
  title: string;              // e.g. "প্রথমবার প্রস্তুতি শুরু করুন সম্পূর্ণ ফ্রিতে!"
  description: string;        // e.g. "বিসিএস, প্রাইমারি ও ব্যাংক পরীক্ষার লাইভ মডেল টেস্ট..."
  perk1: string;              // e.g. "আনলিমিটেড ফ্রি লাইভ ও আর্কাইভ টেস্ট"
  perk2: string;              // e.g. "সঠিক ও নির্ভুল ব্যাখ্যাসহ সমাধান শিট"
  buttonText: string;         // e.g. "এখনই পরীক্ষা দিন"
  actionType: "all-live-exams" | "packages" | "prep_hub" | "courses" | "leaderboard" | "custom_url";
  customUrl?: string;
  showOncePerDay?: boolean;   // if true, shows once per 24 hours; if false, shows every visit
}

export interface AppSettings {
  ourCoursesHomeLimit: number; // 1 - 12
  prepHubHomeLimit: number;   // 1 - 12
  proSectionHomeLimit?: number; // 1 - 12
  proSectionActive?: boolean;
  popupNotification?: PopupNotificationConfig;
}

export const DEFAULT_POPUP_NOTIFICATION: PopupNotificationConfig = {
  enabled: true,
  badgeText: "বিশেষ শিক্ষার্থী অফার",
  title: "প্রথমবার প্রস্তুতি শুরু করুন সম্পূর্ণ ফ্রিতে!",
  description: "বিসিএস, প্রাইমারি ও ব্যাংক পরীক্ষার লাইভ মডেল টেস্ট, ব্যাখ্যাসহ বিগত সালের প্রশ্ন ও ডেইলি রুটিন প্র্যাকটিস করুন যেকোনো সময়।",
  perk1: "আনলিমিটেড ফ্রি লাইভ ও আর্কাইভ টেস্ট",
  perk2: "সঠিক ও নির্ভুল ব্যাখ্যাসহ সমাধান শিট",
  buttonText: "এখনই পরীক্ষা দিন",
  actionType: "all-live-exams",
  customUrl: "",
  showOncePerDay: true
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ourCoursesHomeLimit: 5,
  prepHubHomeLimit: 4,
  proSectionHomeLimit: 4,
  proSectionActive: true,
  popupNotification: DEFAULT_POPUP_NOTIFICATION
};

const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_app_settings_v2";
const LOCAL_STORAGE_KEY = "jobmaster_app_settings_cache";

let memorySettingsCache: AppSettings | null = null;
let settingsInFlightPromise: Promise<AppSettings> | null = null;

export function invalidateAppSettingsCache() {
  memorySettingsCache = null;
  settingsInFlightPromise = null;
}

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

export async function fetchAppSettingsFromDb(forceRefresh = false): Promise<AppSettings> {
  if (!forceRefresh && memorySettingsCache) {
    return memorySettingsCache;
  }

  if (!forceRefresh && settingsInFlightPromise) {
    return settingsInFlightPromise;
  }

  const currentLocal = getCachedAppSettings();

  settingsInFlightPromise = (async () => {
    try {
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
    } finally {
      settingsInFlightPromise = null;
    }
  })();

  return settingsInFlightPromise;
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
