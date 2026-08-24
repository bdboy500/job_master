import { getSupabase } from "./supabase";

export interface PopupNotificationConfig {
  enabled: boolean;
  badgeText?: string;
  title?: string;
  highlightText?: string;
  message?: string;
  bannerImageUrl?: string;
  points?: string[];
  buttonText?: string;
  buttonActionType?: "screen" | "url";
  buttonActionValue?: string;
  cancelButtonText?: string;
  showFrequency?: "every_visit" | "once_a_day" | "once_per_session";
  updated_at?: string;
}

export interface PwaAssetLinksConfig {
  packageName?: string;
  sha256Fingerprints?: string[];
}

export interface AppSettings {
  ourCoursesHomeLimit: number; // 1 - 12
  prepHubHomeLimit: number;   // 1 - 12
  proSectionHomeLimit?: number; // 1 - 12
  proSectionActive?: boolean;
  popupNotification?: PopupNotificationConfig;
  pwaAssetLinks?: PwaAssetLinksConfig;
}

export const DEFAULT_POPUP_CONFIG: PopupNotificationConfig = {
  enabled: true,
  badgeText: "বিশেষ শিক্ষার্থী অফার",
  title: "প্রথমবার প্রস্তুতি শুরু করুন",
  highlightText: "সম্পূর্ণ ফ্রিতে!",
  message: "বিসিএস, প্রাইমারি ও ব্যাংক পরীক্ষার লাইভ মডেল টেস্ট, ব্যাখ্যাসহ বিগত সালের প্রশ্ন ও ডেইলি রুটিন প্র্যাকটিস করুন যেকোনো সময়।",
  bannerImageUrl: "",
  points: [
    "আনলিমিটেড ফ্রি লাইভ ও আর্কাইভ টেস্ট",
    "সঠিক ও নির্ভুল ব্যাখ্যাসহ সমাধান শিট"
  ],
  buttonText: "এখনই পরীক্ষা দিন",
  buttonActionType: "screen",
  buttonActionValue: "all-live-exams",
  cancelButtonText: "পরে দেখব",
  showFrequency: "once_a_day"
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ourCoursesHomeLimit: 5,
  prepHubHomeLimit: 4,
  proSectionHomeLimit: 4,
  proSectionActive: true,
  popupNotification: DEFAULT_POPUP_CONFIG
};

const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_app_settings_v2";
const LOCAL_STORAGE_KEY = "jobmaster_app_settings_cache";

let memorySettingsCache: AppSettings | null = null;
let settingsInFlightPromise: Promise<AppSettings> | null = null;
let lastFetchedAt = 0;
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
  try {
    broadcastChannel = new BroadcastChannel("jobmaster_app_settings_channel");
  } catch (e) {}
}

export function invalidateAppSettingsCache() {
  memorySettingsCache = null;
  settingsInFlightPromise = null;
  lastFetchedAt = 0;
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
  const now = Date.now();
  // Low egress caching: Reuse cache if refreshed within last 2 minutes unless forced
  if (!forceRefresh && memorySettingsCache && (now - lastFetchedAt < 120000)) {
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
            const merged: AppSettings = {
              ...DEFAULT_APP_SETTINGS,
              ...data.value,
              popupNotification: {
                ...DEFAULT_POPUP_CONFIG,
                ...(data.value.popupNotification || {})
              }
            };
            memorySettingsCache = merged;
            lastFetchedAt = Date.now();
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
              } catch (e) {}
            }
            return merged;
          }
        }
      } catch (e) {
        console.warn("Direct Supabase settings fetch note:", e);
      }

      // 2. Next try API endpoint
      try {
        const res = await fetch("/api/app-settings", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (data && data.settings && typeof data.settings.ourCoursesHomeLimit === "number") {
            memorySettingsCache = data.settings;
            lastFetchedAt = Date.now();
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

// Debounce timer for API/Supabase writes to prevent rapid bursts when admin clicks multiple buttons
let saveDebounceTimer: NodeJS.Timeout | null = null;
let pendingSaveSettings: AppSettings | null = null;

export async function saveAppSettingsToDb(settings: AppSettings): Promise<boolean> {
  memorySettingsCache = settings;
  lastFetchedAt = Date.now();

  // 1. Instant local persistence & Cross-tab broadcast (0 network latency & 0 DB hits)
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      window.dispatchEvent(new CustomEvent("jobmaster_app_settings_updated", { detail: settings }));
      if (broadcastChannel) {
        broadcastChannel.postMessage(settings);
      }
    } catch (e) {}
  }

  pendingSaveSettings = settings;

  return new Promise<boolean>((resolve) => {
    if (saveDebounceTimer) clearTimeout(saveDebounceTimer);
    
    saveDebounceTimer = setTimeout(async () => {
      const targetSettings = pendingSaveSettings || settings;
      let saved = true;

      // 2. Direct Supabase save
      try {
        const supabase = getSupabase();
        if (supabase) {
          const { error } = await supabase
            .from("app_config")
            .upsert(
              { key: "home_display_settings", value: targetSettings, updated_at: new Date().toISOString() },
              { onConflict: "key" }
            );
          if (error) {
            console.warn("Supabase direct app_config upsert note:", error);
          }
        }
      } catch (e) {
        console.warn("Direct Supabase save app_settings note:", e);
      }

      // 3. API endpoint save
      try {
        const res = await fetch("/api/app-settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetSettings)
        });
        if (!res.ok) saved = false;
      } catch (e) {
        console.warn("Failed to save app settings via API:", e);
      }

      resolve(saved);
    }, 200);
  });
}

// Real-time synchronization subscription helper with minimal network egress
export function subscribeToAppSettings(onSettings: (settings: AppSettings) => void) {
  if (typeof window === "undefined") return () => {};

  const handleUpdate = (e: any) => {
    if (e.detail && typeof e.detail.ourCoursesHomeLimit === "number") {
      onSettings(e.detail);
    } else {
      const cached = getCachedAppSettings();
      onSettings(cached);
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && typeof parsed.ourCoursesHomeLimit === "number") {
          memorySettingsCache = parsed;
          onSettings(parsed);
        }
      } catch (err) {}
    }
  };

  const handleBroadcast = (e: MessageEvent) => {
    if (e.data && typeof e.data.ourCoursesHomeLimit === "number") {
      memorySettingsCache = e.data;
      onSettings(e.data);
    }
  };

  window.addEventListener("jobmaster_app_settings_updated", handleUpdate);
  window.addEventListener("storage", handleStorage);

  if (broadcastChannel) {
    broadcastChannel.addEventListener("message", handleBroadcast);
  }

  // Low egress Supabase Realtime channel: listens only to changes on home_display_settings
  let supabaseChannel: any = null;
  let supabaseRef: any = null;

  try {
    const supabase = getSupabase();
    if (supabase) {
      supabaseRef = supabase;
      supabaseChannel = supabase
        .channel("app_settings_realtime_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "app_config", filter: "key=eq.home_display_settings" },
          (payload: any) => {
            if (payload?.new?.value && typeof payload.new.value.ourCoursesHomeLimit === "number") {
              const freshSettings = payload.new.value;
              memorySettingsCache = freshSettings;
              lastFetchedAt = Date.now();
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(freshSettings));
              } catch (e) {}
              onSettings(freshSettings);
            } else {
              invalidateAppSettingsCache();
              fetchAppSettingsFromDb(true).then(onSettings);
            }
          }
        )
        .subscribe();
    }
  } catch (err) {
    console.warn("AppSettings realtime sub note:", err);
  }

  return () => {
    window.removeEventListener("jobmaster_app_settings_updated", handleUpdate);
    window.removeEventListener("storage", handleStorage);
    if (broadcastChannel) {
      broadcastChannel.removeEventListener("message", handleBroadcast);
    }
    if (supabaseRef && supabaseChannel) {
      try {
        supabaseRef.removeChannel(supabaseChannel);
      } catch (e) {}
    }
  };
}
