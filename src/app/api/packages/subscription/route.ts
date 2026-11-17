import { NextRequest, NextResponse } from "next/server";
import {
  getAllPaymentsAdminServer,
  getUserSubscriptionDataServer,
} from "@/src/lib/subscriptions_server";
import { isBkashConfigured } from "@/src/lib/bkash";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const mode = req.nextUrl.searchParams.get("mode");
    if (mode === "admin") {
      const data = await getAllPaymentsAdminServer();
      return NextResponse.json({
        ...data,
        bkashConfigured: isBkashConfigured(),
      });
    }

    const userId = req.nextUrl.searchParams.get("userId");
    const email = req.nextUrl.searchParams.get("email");
    if (!userId && !email) {
      return NextResponse.json({ activeSubscription: null, transactions: [] });
    }

    const data = await getUserSubscriptionDataServer(userId, email);
    return NextResponse.json({
      ...data,
      bkashConfigured: isBkashConfigured(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { activeSubscription: null, transactions: [], error: err?.message },
      { status: 500 }
    );
  }
}
