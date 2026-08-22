import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";
import { DEFAULT_APP_SETTINGS, DEFAULT_POPUP_NOTIFICATION } from "@/src/lib/app_settings";

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
            ...DEFAULT_POPUP_NOTIFICATION,
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
            ...DEFAULT_POPUP_NOTIFICATION,
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
    const settings = {
      ourCoursesHomeLimit: Math.min(12, Math.max(1, Number(body.ourCoursesHomeLimit) || 5)),
      prepHubHomeLimit: Math.min(12, Math.max(1, Number(body.prepHubHomeLimit) || 4)),
      proSectionActive: body.proSectionActive !== false,
      proSectionHomeLimit: Math.min(12, Math.max(1, Number(body.proSectionHomeLimit) || 4)),
      popupNotification: {
        enabled: body.popupNotification?.enabled !== false,
        badgeText: body.popupNotification?.badgeText || DEFAULT_POPUP_NOTIFICATION.badgeText,
        title: body.popupNotification?.title || DEFAULT_POPUP_NOTIFICATION.title,
        description: body.popupNotification?.description || DEFAULT_POPUP_NOTIFICATION.description,
        perk1: body.popupNotification?.perk1 || DEFAULT_POPUP_NOTIFICATION.perk1,
        perk2: body.popupNotification?.perk2 || DEFAULT_POPUP_NOTIFICATION.perk2,
        buttonText: body.popupNotification?.buttonText || DEFAULT_POPUP_NOTIFICATION.buttonText,
        actionType: body.popupNotification?.actionType || DEFAULT_POPUP_NOTIFICATION.actionType,
        customUrl: body.popupNotification?.customUrl || "",
        showOncePerDay: body.popupNotification?.showOncePerDay !== false
      }
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
