import { NextRequest, NextResponse } from "next/server";
import { bkashSearchTransaction } from "@/src/lib/bkash";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const trxID = typeof body.trxID === "string" ? body.trxID.trim() : "";
    if (!trxID) {
      return NextResponse.json(
        { success: false, error: "trxID is required." },
        { status: 400 }
      );
    }

    const result = await bkashSearchTransaction(trxID);
    return NextResponse.json({ success: true, transaction: result });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to search transaction." },
      { status: 500 }
    );
  }
}
