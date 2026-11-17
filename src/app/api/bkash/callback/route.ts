import { NextRequest, NextResponse } from "next/server";
import { bkashExecutePayment } from "@/src/lib/bkash";
import {
  activateSubscriptionForTransaction,
  findTransactionByPaymentIdServer,
  savePaymentTransactionServer,
} from "@/src/lib/subscriptions_server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const fwdProto = req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
  const fwdHost = req.headers.get("x-forwarded-host")?.split(",")[0]?.trim();
  const hostHeader = req.headers.get("host")?.trim();
  const origin = fwdHost
    ? `${fwdProto || "https"}://${fwdHost}`
    : hostHeader && !hostHeader.startsWith("0.0.0.0")
      ? `${fwdProto || (hostHeader.includes("localhost") || hostHeader.startsWith("127.0.0.1") ? "http" : "https")}://${hostHeader}`
      : req.nextUrl.origin;
  const searchParams = req.nextUrl.searchParams;
  const paymentID = (searchParams.get("paymentID") || "").trim();
  const status = (searchParams.get("status") || "").trim().toLowerCase();

  const buildRedirect = (params: Record<string, string>) => {
    const target = new URL("/", origin);
    target.searchParams.set("view", "packages");
    for (const [key, value] of Object.entries(params)) {
      if (value) target.searchParams.set(key, value);
    }
    return NextResponse.redirect(target);
  };

  if (!paymentID) {
    return buildRedirect({
      payment_status: "failed",
      message: "payment failed",
    });
  }

  const existingTx = await findTransactionByPaymentIdServer(paymentID);
  const nowIso = new Date().toISOString();

  // UAT Rule 1 & Rule 2:
  // Execute API MUST ONLY be called when callback status === "success".
  // For failure / cancel status from create payment callback, show "payment failed" after redirect.
  if (status !== "success") {
    if (existingTx) {
      await savePaymentTransactionServer({
        ...existingTx,
        status: status === "cancel" ? "cancelled" : "failed",
        statusMessage: "payment failed",
        updatedAt: nowIso,
      });
    }
    return buildRedirect({
      payment_status: "failed",
      message: "payment failed",
      paymentID,
    });
  }

  try {
    // UAT Rule 2 & 4: Execute Payment (with Query Payment ONLY inside no-response catch block)
    const execResult = await bkashExecutePayment(paymentID);

    // UAT Rule 3: statusCode === "0000" is success; any other failure returns exact statusMessage from API
    const isCompleted =
      execResult.statusCode === "0000" &&
      (!execResult.transactionStatus ||
        execResult.transactionStatus.toLowerCase() === "completed");

    if (isCompleted) {
      const updatedTx = {
        ...(existingTx || {
          id: `tx_${paymentID}`,
          userId: "",
          userEmail: "",
          packageId: "",
          packageTitle: "JobMaster Package",
          amount: Number(execResult.amount || 0),
          currency: execResult.currency || "BDT",
          merchantInvoiceNumber: execResult.merchantInvoiceNumber || "",
          paymentId: paymentID,
          payerReference: "",
          createdAt: nowIso,
        }),
        trxId: execResult.trxID || null,
        customerMsisdn: execResult.customerMsisdn || null,
        status: "completed" as const,
        statusCode: execResult.statusCode,
        statusMessage: execResult.statusMessage || "Successful",
        updatedAt: nowIso,
      };

      await savePaymentTransactionServer(updatedTx);

      if (updatedTx.userId && updatedTx.packageId) {
        await activateSubscriptionForTransaction(updatedTx);
      }

      return buildRedirect({
        payment_status: "success",
        paymentID,
        trxID: execResult.trxID || "",
        pkg: updatedTx.packageId || "",
      });
    }

    // Failure case from Execute API: display exact statusMessage returned by bKash
    const failureMessage = execResult.statusMessage || "payment failed";
    if (existingTx) {
      await savePaymentTransactionServer({
        ...existingTx,
        trxId: execResult.trxID || existingTx.trxId,
        status: "failed",
        statusCode: execResult.statusCode || null,
        statusMessage: failureMessage,
        updatedAt: nowIso,
      });
    }

    return buildRedirect({
      payment_status: "failed",
      paymentID,
      message: failureMessage,
    });
  } catch (err: any) {
    console.error("GET /api/bkash/callback execute error:", err);
    const errMsg = err?.message || "payment failed";
    if (existingTx) {
      await savePaymentTransactionServer({
        ...existingTx,
        status: "failed",
        statusMessage: errMsg,
        updatedAt: nowIso,
      });
    }
    return buildRedirect({
      payment_status: "failed",
      paymentID,
      message: errMsg,
    });
  }
}
