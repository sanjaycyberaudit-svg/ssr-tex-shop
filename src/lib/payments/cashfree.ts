import crypto from "crypto";
import { getCashfreeConfig } from "@/lib/integrations/settings";
import { getURL } from "@/lib/utils";
import { normalizeIndianMobile } from "@/lib/payments/phonepe";

type CreateCashfreePaymentParams = {
  orderId: string;
  amountInRupees: number;
  customerName?: string | null;
  customerMobile?: string | null;
  customerEmail?: string | null;
  customerId?: string | null;
};

type CashfreeCreateOrderResponse = {
  cf_order_id?: string | number;
  order_id?: string;
  payment_session_id?: string;
  order_status?: string;
  message?: string;
  code?: string;
  type?: string;
};

type CashfreeFetchOrderResponse = {
  cf_order_id?: string | number;
  order_id?: string;
  order_status?: string;
  payment_session_id?: string;
  message?: string;
  code?: string;
  type?: string;
};

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

const CASHFREE_WEBHOOK_MAX_DRIFT_MS = 10 * 60 * 1000;

function signCashfreeWebhookPayload(
  rawBody: string,
  timestamp: string,
  secret: string,
) {
  return crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}${rawBody}`)
    .digest("base64");
}

export async function createCashfreePayment(
  params: CreateCashfreePaymentParams,
) {
  const config = await getCashfreeConfig();
  if (!config) return null;

  const phone = normalizeIndianMobile(params.customerMobile).replace(/^91/, "");
  const customerEmail = String(params.customerEmail ?? "").trim() || undefined;
  const customerName = String(params.customerName ?? "").trim() || undefined;
  const customerId =
    String(params.customerId ?? "").trim() || `guest_${params.orderId}`;
  const returnUrl = `${getURL()}api/cashfree/redirect?order_id={order_id}`;
  const notifyUrl = `${getURL()}api/cashfree/webhook`;

  const res = await fetch(`${normalizeBaseUrl(config.baseUrl)}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": config.clientId,
      "x-client-secret": config.clientSecret,
      "x-api-version": config.apiVersion,
    },
    body: JSON.stringify({
      order_id: params.orderId,
      order_amount: Number(params.amountInRupees.toFixed(2)),
      order_currency: "INR",
      customer_details: {
        customer_id: customerId,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: phone || undefined,
      },
      order_meta: {
        return_url: returnUrl,
        notify_url: notifyUrl,
      },
      order_note: `Order ${params.orderId}`,
    }),
    cache: "no-store",
  });

  const data = (await res
    .json()
    .catch(() => null)) as CashfreeCreateOrderResponse | null;
  if (!res.ok || !data?.payment_session_id) {
    const reason = String(
      data?.message || data?.type || data?.code || `HTTP_${res.status}`,
    ).trim();
    throw new Error(`Cashfree order creation failed: ${reason}`);
  }

  return {
    paymentSessionId: data.payment_session_id,
    cashfreeOrderId: String(data.order_id ?? params.orderId).trim(),
    cashfreeCfOrderId: data.cf_order_id ? String(data.cf_order_id) : null,
    environment: config.environment,
  };
}

export async function fetchCashfreeOrderStatus(orderId: string) {
  const config = await getCashfreeConfig();
  if (!config) throw new Error("Cashfree config is not enabled");

  const res = await fetch(
    `${normalizeBaseUrl(config.baseUrl)}/orders/${encodeURIComponent(orderId)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "x-client-id": config.clientId,
        "x-client-secret": config.clientSecret,
        "x-api-version": config.apiVersion,
      },
      cache: "no-store",
    },
  );

  const data = (await res
    .json()
    .catch(() => null)) as CashfreeFetchOrderResponse | null;

  if (!res.ok || !data?.order_id) {
    const reason = String(
      data?.message || data?.type || data?.code || `HTTP_${res.status}`,
    ).trim();
    throw new Error(`Cashfree order status fetch failed: ${reason}`);
  }

  return data;
}

export async function verifyCashfreeWebhookSignature(params: {
  rawBody: string;
  timestamp: string;
  signature: string;
}) {
  const config = await getCashfreeConfig();
  if (!config) {
    throw new Error("Cashfree config is not enabled");
  }

  const ts = Number.parseInt(params.timestamp.trim(), 10);
  if (!Number.isFinite(ts)) return false;

  const now = Date.now();
  if (Math.abs(now - ts) > CASHFREE_WEBHOOK_MAX_DRIFT_MS) {
    return false;
  }

  const computed = signCashfreeWebhookPayload(
    params.rawBody,
    params.timestamp,
    config.clientSecret,
  );
  const provided = params.signature.trim();

  const computedBuffer = Buffer.from(computed);
  const providedBuffer = Buffer.from(provided);
  if (computedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, providedBuffer);
}
