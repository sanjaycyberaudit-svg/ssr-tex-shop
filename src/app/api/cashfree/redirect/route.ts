import { syncCashfreeOrderPayment } from "@/lib/payments/orderPaymentSync";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const orderId = request.nextUrl.searchParams.get("order_id")?.trim() ?? "";
  const safeOrderPath = orderId ? `/orders/${orderId}` : "/orders";

  try {
    if (orderId) {
      await syncCashfreeOrderPayment(orderId);
    }
  } catch (error) {
    console.error("[cashfree] redirect sync failed:", error);
  }

  return NextResponse.redirect(new URL(safeOrderPath, request.url));
}
