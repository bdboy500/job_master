import { NextRequest, NextResponse } from "next/server";
import { bkashRefundTransaction } from "@/src/lib/bkash";
import {
  findTransactionByPaymentIdServer,
  markSubscriptionRefundedByPaymentId,
  savePaymentTransactionServer,
} from "@/src/lib/subscriptions_server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const paymentID = typeof body.paymentID === "string" ? body.paymentID.trim() : "";
    const trxID = typeof body.trxID === "string" ? body.trxID.trim() : "";
    const amount = body.amount;
    const sku = typeof body.sku === "string" ? body.sku.trim() : "JobMaster-Package";
    const reason =
      typeof body.reason === "string" && body.reason.trim()
        ? body.reason.trim()
        : "Admin initiated refund";

    if (!paymentID || !trxID || !amount) {
      return NextResponse.json(
        { success: false, error: "paymentID, trxID, and amount are required for refund." },
        { status: 400 }
      );
    }

    // Reuses cached id_token in live/sandbox bKash mode, or runs clean refund in test simulator mode
    const refundRes = await bkashRefundTransaction({
      paymentID,
      trxID,
      amount,
      sku,
      reason,
    });

    const nowIso = new Date().toISOString();
    const existingTx = await findTransactionByPaymentIdServer(paymentID);
    if (existingTx) {
      await savePaymentTransactionServer({
        ...existingTx,
        status: "refunded",
        refundTrxId: refundRes.refundTrxID ? String(refundRes.refundTrxID) : null,
        refundAmount: Number(refundRes.amount || amount),
        refundReason: reason,
        refundedAt: nowIso,
        statusMessage: refundRes.statusMessage
          ? String(refundRes.statusMessage)
          : "Refund Completed",
        updatedAt: nowIso,
      });
    }

    await markSubscriptionRefundedByPaymentId(paymentID);

    return NextResponse.json({
      success: true,
      refund: refundRes,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to process refund." },
      { status: 500 }
    );
  }
}
