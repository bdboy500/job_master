import { NextRequest, NextResponse } from "next/server";
import { bkashCreatePayment, isBkashConfigured } from "@/src/lib/bkash";
import { isValidRegisteredEmail, parsePackageAmountBDT } from "@/src/lib/subscriptions";
import {
  findPackageByIdServer,
  savePaymentTransactionServer,
} from "@/src/lib/subscriptions_server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";
    const userEmail = typeof body.userEmail === "string" ? body.userEmail.trim() : "";
    const packageId = typeof body.packageId === "string" ? body.packageId.trim() : "";
    const payerReference =
      typeof body.payerReference === "string" && body.payerReference.trim()
        ? body.payerReference.trim()
        : userEmail;

    // 1. Enforce mandatory email registration before package purchase
    if (!userId || !isValidRegisteredEmail(userEmail)) {
      return NextResponse.json(
        {
          success: false,
          code: "EMAIL_REGISTRATION_REQUIRED",
          error: "প্যাকেজ কিনতে অবশ্যই ইমেইল দিয়ে রেজিস্ট্রেশন ও লগইন থাকতে হবে।",
        },
        { status: 401 }
      );
    }

    if (!packageId) {
      return NextResponse.json(
        { success: false, error: "Package ID is required." },
        { status: 400 }
      );
    }

    // 2. Fetch authoritative package price & title on server
    const pkg = await findPackageByIdServer(packageId);
    if (!pkg) {
      return NextResponse.json(
        { success: false, error: "প্যাকেজটি পাওয়া যায়নি।" },
        { status: 404 }
      );
    }

    const amount = parsePackageAmountBDT(pkg.price);
    if (amount <= 0) {
      return NextResponse.json(
        { success: false, error: "প্যাকেজের মূল্য সঠিক নয়।" },
        { status: 400 }
      );
    }

    const fwdProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const fwdHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
    const hostHeader = req.headers.get("host")?.trim();
    const origin = fwdHost
      ? `${fwdProto || "https"}://${fwdHost}`
      : hostHeader && !hostHeader.startsWith("0.0.0.0")
        ? `${fwdProto || (hostHeader.includes("localhost") || hostHeader.startsWith("127.0.0.1") ? "http" : "https")}://${hostHeader}`
        : req.nextUrl.origin;
    const configuredCallback = (process.env.BKASH_CALLBACK_URL || "").trim();
    const callbackURL = configuredCallback || `${origin}/api/bkash/callback`;
    const merchantInvoiceNumber = `JM-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Call bKash Create Payment API (or Sandbox Test Simulator if credentials not yet added)
    const created = await bkashCreatePayment({
      amount,
      merchantInvoiceNumber,
      callbackURL,
      payerReference,
      packageTitle: pkg.title,
    });

    const nowIso = new Date().toISOString();
    await savePaymentTransactionServer({
      id: `tx_${created.paymentID}`,
      userId,
      userEmail,
      packageId: pkg.id,
      packageTitle: pkg.title,
      amount,
      currency: "BDT",
      merchantInvoiceNumber,
      paymentId: created.paymentID,
      trxId: null,
      payerReference,
      status: "pending",
      statusCode: created.statusCode || null,
      statusMessage: created.statusMessage || "Initiated",
      createdAt: nowIso,
      updatedAt: nowIso,
    });

    return NextResponse.json({
      success: true,
      mode: isBkashConfigured() ? "bkash_api" : "sandbox_test",
      paymentID: created.paymentID,
      bkashURL: created.bkashURL,
      merchantInvoiceNumber,
    });
  } catch (err: any) {
    console.error("POST /api/bkash/create error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err?.message || "bKash পেমেন্ট শুরু করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।",
      },
      { status: 500 }
    );
  }
}
