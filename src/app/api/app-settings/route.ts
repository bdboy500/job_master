import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_APP_SETTINGS, DEFAULT_POPUP_CONFIG, AppSettings } from "@/src/lib/app_settings";

const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_app_settings_v2";

export async function GET() {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_config")
        .select("key, value")
        .eq("key", "home_display_settings")
        .maybeSingle();

      if (!error && data && data.value) {
        const merged = {
          ...DEFAULT_APP_SETTINGS,
          ...data.value,
          popupNotification: {
            ...DEFAULT_POPUP_CONFIG,
            ...(data.value.popupNotification || {})
          }
        };
        return NextResponse.json({ settings: merged });
      }
    }

    // Fallback to Cloud KV
    const res = await fetch(CLOUD_KV_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.ourCoursesHomeLimit === "number") {
        const merged = {
          ...DEFAULT_APP_SETTINGS,
          ...data,
          popupNotification: {
            ...DEFAULT_POPUP_CONFIG,
            ...(data.popupNotification || {})
          }
        };
        return NextResponse.json({ settings: merged });
      }
    }
  } catch (e) {
    console.error("GET /api/app-settings error:", e);
  }

  return NextResponse.json({
    settings: DEFAULT_APP_SETTINGS
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings: AppSettings = {
      ourCoursesHomeLimit: Math.min(12, Math.max(1, Number(body.ourCoursesHomeLimit) || 5)),
      prepHubHomeLimit: Math.min(12, Math.max(1, Number(body.prepHubHomeLimit) || 4)),
      proSectionActive: body.proSectionActive !== false,
      proSectionHomeLimit: Math.min(12, Math.max(1, Number(body.proSectionHomeLimit) || 4)),
      popupNotification: body.popupNotification ? {
        enabled: body.popupNotification.enabled !== false,
        badgeText: typeof body.popupNotification.badgeText === "string" ? body.popupNotification.badgeText : DEFAULT_POPUP_CONFIG.badgeText,
        title: typeof body.popupNotification.title === "string" ? body.popupNotification.title : DEFAULT_POPUP_CONFIG.title,
        highlightText: typeof body.popupNotification.highlightText === "string" ? body.popupNotification.highlightText : DEFAULT_POPUP_CONFIG.highlightText,
        message: typeof body.popupNotification.message === "string" ? body.popupNotification.message : DEFAULT_POPUP_CONFIG.message,
        bannerImageUrl: typeof body.popupNotification.bannerImageUrl === "string" ? body.popupNotification.bannerImageUrl : "",
        points: Array.isArray(body.popupNotification.points) ? body.popupNotification.points : DEFAULT_POPUP_CONFIG.points,
        buttonText: typeof body.popupNotification.buttonText === "string" ? body.popupNotification.buttonText : DEFAULT_POPUP_CONFIG.buttonText,
        buttonActionType: body.popupNotification.buttonActionType === "url" ? "url" : "screen",
        buttonActionValue: typeof body.popupNotification.buttonActionValue === "string" ? body.popupNotification.buttonActionValue : "all-live-exams",
        cancelButtonText: typeof body.popupNotification.cancelButtonText === "string" ? body.popupNotification.cancelButtonText : DEFAULT_POPUP_CONFIG.cancelButtonText,
        showFrequency: body.popupNotification.showFrequency || "once_a_day",
        updated_at: new Date().toISOString()
      } : DEFAULT_POPUP_CONFIG
    };

    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase
        .from("app_config")
        .upsert(
          { key: "home_display_settings", value: settings, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) {
        console.error("Supabase upsert app_config error in POST route:", error);
      }
    }

    // Sync to Cloud KV
    try {
      await fetch(CLOUD_KV_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
    } catch (e) {}

    return NextResponse.json({ success: true, settings });
  } catch (e) {
    console.error("POST /api/app-settings error:", e);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}
