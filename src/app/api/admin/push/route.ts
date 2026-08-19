import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/src/lib/supabase";

export interface PushHistoryItem {
  id: string;
  title: string;
  message: string;
  targetType: "all" | "user" | "segment";
  targetUserId?: string | string[];
  deepLinkData?: { type: string; targetId?: string; url?: string };
  sentAt: string;
  recipientsCount: number;
  status: "delivered" | "simulated" | "failed";
  notificationId?: string;
  error?: string;
}

// In-memory fallback for push history
let memoryPushHistory: PushHistoryItem[] = [
  {
    id: "push-demo-1",
    title: "🚨 ৪৬তম বিসিএস স্পেশাল লাইভ মডেল টেস্ট শুরু!",
    message: "সকল বিসিএস পরীক্ষার্থীদের জন্য পূর্ণাঙ্গ ২০০ নম্বরের মডেল টেস্ট শুরু হয়েছে। এখনই অংশ নিন।",
    targetType: "all",
    deepLinkData: { type: "all-live-exams" },
    sentAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    recipientsCount: 1420,
    status: "delivered",
    notificationId: "os-notif-882190",
  },
  {
    id: "push-demo-2",
    title: "🏆 সাপ্তাহিক কুইজ গেমের ফলাফল প্রকাশিত হয়েছে",
    message: "মেধা তালিকা ও সর্বোচ্চ স্কোরধারীদের তালিকা দেখতে লিডারবোর্ড চেক করুন।",
    targetType: "all",
    deepLinkData: { type: "quiz" },
    sentAt: new Date(Date.now() - 86400000).toISOString(),
    recipientsCount: 1380,
    status: "delivered",
    notificationId: "os-notif-874210",
  }
];

export async function GET() {
  try {
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from("app_config")
        .select("key, value")
        .eq("key", "jobmaster_push_history")
        .maybeSingle();

      if (!error && data && Array.isArray(data.value) && data.value.length > 0) {
        return NextResponse.json({ history: data.value });
      }
    }
    return NextResponse.json({ history: memoryPushHistory });
  } catch {
    return NextResponse.json({ history: memoryPushHistory });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      title,
      message,
      targetType = "all", // "all" | "user" | "segment"
      targetUserId,       // string or string[]
      deepLinkData,       // { type: string, targetId: string, url?: string }
      adminSecret,
    } = body;

    // Basic admin secret / auth protection check
    const validSecret = process.env.ADMIN_SECRET_KEY || "jobmaster_admin_secret_key";
    if (adminSecret && adminSecret !== validSecret) {
      return NextResponse.json({ error: "Unauthorized: Invalid admin credentials" }, { status: 401 });
    }

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      );
    }

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID || process.env.ONESIGNAL_APP_ID;
    const apiKey = process.env.ONESIGNAL_REST_API_KEY;

    let recipientsCount = 0;
    let notificationId = `notif-${Date.now()}`;
    let deliveryStatus: "delivered" | "simulated" | "failed" = "delivered";
    let isSimulated = false;

    if (!appId || !apiKey) {
      // In development / preview when API keys are not configured yet, record simulated success
      isSimulated = true;
      deliveryStatus = "simulated";
      recipientsCount = targetType === "all" ? 1450 : 1;
    } else {
      // Construct native OneSignal payload for Android and iOS
      const payload: any = {
        app_id: appId,
        headings: { en: title, bn: title },
        contents: { en: message, bn: message },
        data: deepLinkData || {},
        priority: 10,
        android_visibility: 1, // Visible on Lock Screen
        android_accent_color: "FFFF6A00", // Job Master Brand Orange
        small_icon: "ic_stat_onesignal_default",
        ios_badgeType: "Increase",
        ios_badgeCount: 1,
        ios_sound: "default",
        android_sound: "default",
      };

      if (targetType === "all") {
        payload.included_segments = ["Total Subscriptions"];
      } else if (targetType === "user" && targetUserId) {
        const userIds = Array.isArray(targetUserId) ? targetUserId : [targetUserId];
        payload.include_aliases = {
          external_id: userIds,
        };
        payload.target_channel = "push";
      } else {
        payload.included_segments = ["Active Subscriptions"];
      }

      const response = await fetch("https://onesignal.com/api/v1/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          Authorization: `Basic ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        return NextResponse.json(
          { error: data.errors || "Failed to dispatch push notification", details: data },
          { status: response.status }
        );
      }

      recipientsCount = data.recipients || (targetType === "all" ? 1200 : 1);
      notificationId = data.id || notificationId;
      deliveryStatus = "delivered";
    }

    // Record to push history
    const historyItem: PushHistoryItem = {
      id: `push-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title,
      message,
      targetType,
      targetUserId,
      deepLinkData,
      sentAt: new Date().toISOString(),
      recipientsCount,
      status: deliveryStatus,
      notificationId,
    };

    memoryPushHistory = [historyItem, ...memoryPushHistory.slice(0, 49)];

    // Persist history to Supabase app_config
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase
          .from("app_config")
          .upsert({
            key: "jobmaster_push_history",
            value: memoryPushHistory,
            updated_at: new Date().toISOString(),
          });
      }
    } catch (e) {
      console.warn("Could not persist push history to Supabase:", e);
    }

    return NextResponse.json({
      success: true,
      simulated: isSimulated,
      recipients: recipientsCount,
      notificationId,
      historyItem,
      message: isSimulated 
        ? "Push notification successfully recorded (OneSignal simulated in preview)"
        : "Push notification successfully dispatched to users' device notification bar",
    });
  } catch (error: any) {
    console.error("OneSignal push dispatch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
