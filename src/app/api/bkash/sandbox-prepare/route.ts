import { NextRequest, NextResponse } from "next/server";
import { isBkashConfigured } from "@/src/lib/bkash";
import {
  findTransactionByPaymentIdServer,
  savePaymentTransactionServer,
} from "@/src/lib/subscriptions_server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    if (isBkashConfigured()) {
      return NextResponse.json(
        { success: false, error: "Sandbox simulator is disabled when live bKash env vars are active." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const paymentID = typeof body.paymentID === "string" ? body.paymentID.trim() : "";
    const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";
    const pin = typeof body.pin === "string" ? body.pin.trim() : "";
    const otp = typeof body.otp === "string" ? body.otp.trim() : "";
    const action = typeof body.action === "string" ? body.action.trim() : "confirm";

    if (!paymentID || !paymentID.startsWith("SANDBOX_PAY_")) {
      return NextResponse.json(
        { success: false, error: "Invalid sandbox test paymentID." },
        { status: 400 }
      );
    }

    if (action === "cancel") {
      return NextResponse.json({
        success: true,
        redirectUrl: `/api/bkash/callback?paymentID=${encodeURIComponent(paymentID)}&status=cancel`,
      });
    }

    if (action === "failure") {
      return NextResponse.json({
        success: true,
        redirectUrl: `/api/bkash/callback?paymentID=${encodeURIComponent(paymentID)}&status=failure`,
      });
    }

    if (!/^01\d{9}$/.test(wallet)) {
      return NextResponse.json(
        { success: false, error: "সঠিক ১১ সংখ্যার টেস্ট বিকাশ নম্বর দিন (যেমন: 01770618575)।" },
        { status: 400 }
      );
    }

    if (otp !== "123456") {
      return NextResponse.json(
        { success: false, error: "ভুল OTP! টেস্ট মোডের জন্য OTP হলো: 123456" },
        { status: 400 }
      );
    }

    if (pin !== "12121") {
      return NextResponse.json(
        { success: false, error: "ভুল PIN! টেস্ট মোডের জন্য PIN হলো: 12121" },
        { status: 400 }
      );
    }

    const existingTx = await findTransactionByPaymentIdServer(paymentID);
    if (existingTx) {
      let marker = "SANDBOX_READY";
      if (wallet === "01823074817") marker = "SANDBOX_INSUFFICIENT_BALANCE";
      if (wallet === "01823074818") marker = "SANDBOX_DEBIT_BLOCK";

      await savePaymentTransactionServer({
        ...existingTx,
        customerMsisdn: wallet,
        statusMessage: marker,
        updatedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      redirectUrl: `/api/bkash/callback?paymentID=${encodeURIComponent(paymentID)}&status=success`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Sandbox checkout processing error." },
      { status: 500 }
    );
  }
}
