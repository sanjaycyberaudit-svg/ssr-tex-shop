import { syncPhonePeOrderPayment } from "@/lib/payments/orderPaymentSync";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("orderId");
  const merchantTransactionId =
    request.nextUrl.searchParams.get("merchantTransactionId") ||
    request.nextUrl.searchParams.get("transactionId");

  const safeOrderPath = orderId ? `/orders/${orderId}` : "/orders";

  try {
    if (orderId || merchantTransactionId) {
      await syncPhonePeOrderPayment({
        orderId,
        merchantTransactionId: merchantTransactionId ?? undefined,
      });
    }
  } catch (error) {
    console.error("[phonepe] redirect sync failed:", error);
  }

  return NextResponse.redirect(new URL(safeOrderPath, request.url));
}
