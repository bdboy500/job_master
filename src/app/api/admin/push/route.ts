import { NextRequest, NextResponse } from "next/server";

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

    if (!appId || !apiKey) {
      // In development / preview when API keys are not configured yet, return a clean simulated success response
      return NextResponse.json({
        success: true,
        simulated: true,
        message: "Push notification simulated successfully (OneSignal keys not configured in environment)",
        data: { title, message, targetType, targetUserId, deepLinkData },
      });
    }

    // Construct OneSignal payload
    const payload: any = {
      app_id: appId,
      headings: { en: title },
      contents: { en: message },
      data: deepLinkData || {},
      priority: 10,
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

    return NextResponse.json({
      success: true,
      recipients: data.recipients,
      notificationId: data.id,
    });
  } catch (error: any) {
    console.error("OneSignal push dispatch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
