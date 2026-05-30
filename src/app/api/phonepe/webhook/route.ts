import { syncPhonePeOrderPayment } from "@/lib/payments/orderPaymentSync";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  if (!rawBody.trim()) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  let body: Record<string, unknown> = {};
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>;
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid JSON payload" },
      { status: 400 },
    );
  }

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

  if (!merchantTransactionId) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  if (!merchantTransactionId.startsWith("ORD_")) {
    return NextResponse.json({ ok: true, skipped: true });
  }

  try {
    await syncPhonePeOrderPayment({
      merchantTransactionId,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[phonepe] webhook sync failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
