import { syncPhonePeOrderPayment } from "@/lib/payments/orderPaymentSync";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const responseEnvelope = String((body?.response as string) || "").trim();
  let decoded: Record<string, unknown> = {};
  if (responseEnvelope) {
    try {
      decoded = JSON.parse(
        Buffer.from(responseEnvelope, "base64").toString("utf8"),
      ) as Record<string, unknown>;
    } catch {
      decoded = {};
    }
  }

  const merchantTransactionId = String(
    (body?.merchantTransactionId as string) ||
      (body?.merchantOrderId as string) ||
      (decoded?.merchantTransactionId as string) ||
      ((decoded?.data as Record<string, unknown> | undefined)
        ?.merchantTransactionId as string) ||
      (body?.transactionId as string) ||
      "",
  ).trim();

  const orderId = String((body?.orderId as string) || "").trim();

  if (!merchantTransactionId && !orderId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await syncPhonePeOrderPayment({
      orderId: orderId || undefined,
      merchantTransactionId: merchantTransactionId || undefined,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[phonepe] webhook sync failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
