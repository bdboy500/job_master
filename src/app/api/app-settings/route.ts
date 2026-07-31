import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";

const CLOUD_KV_URL = "https://kvdb.io/A84N9zB1K2m0P3L4x5Q6/jobmaster_app_settings_v2";

export async function GET() {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_config")
        .select("*")
        .eq("key", "home_display_settings")
        .maybeSingle();

      if (!error && data && data.value) {
        return NextResponse.json({ settings: data.value });
      }
    }

    // Fallback to Cloud KV
    const res = await fetch(CLOUD_KV_URL, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (data && typeof data.ourCoursesHomeLimit === "number") {
        return NextResponse.json({ settings: data });
      }
    }
  } catch (e) {
    console.error("GET /api/app-settings error:", e);
  }

  return NextResponse.json({
    settings: {
      ourCoursesHomeLimit: 5,
      prepHubHomeLimit: 4
    }
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = {
      ourCoursesHomeLimit: Math.min(12, Math.max(1, Number(body.ourCoursesHomeLimit) || 5)),
      prepHubHomeLimit: Math.min(12, Math.max(1, Number(body.prepHubHomeLimit) || 4))
    };

    const supabase = getSupabase();
    if (supabase) {
      await supabase
        .from("app_config")
        .upsert({ key: "home_display_settings", value: settings });
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
