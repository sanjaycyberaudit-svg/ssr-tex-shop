import { getWhatsAppConfig } from "@/lib/integrations/settings";
import { normalizeIndianMobile } from "@/lib/payments/phonepe";
import { SelectOrders } from "@/lib/supabase/schema";

type SendOrderSuccessWhatsAppParams = {
  mobile: string;
  customerName?: string | null;
  orderId: string;
  amount: string;
};

export async function sendOrderSuccessWhatsApp(
  params: SendOrderSuccessWhatsAppParams,
) {
  const config = await getWhatsAppConfig();
  if (!config)
    return { sent: false, reason: "whatsapp_not_configured" as const };

  const to = normalizeIndianMobile(params.mobile);
  if (!to) return { sent: false, reason: "invalid_mobile" as const };

  const endpoint = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`;

  const templateName = config.templateName?.trim();
  const language = config.templateLanguage || "en";

  const body = templateName
    ? {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: language },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: params.customerName || "Customer" },
                { type: "text", text: params.orderId },
                { type: "text", text: params.amount },
              ],
            },
          ],
        },
      }
    : {
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: {
          body: `Hi ${params.customerName || "Customer"}, your order #${params.orderId} is confirmed. Amount paid: INR ${params.amount}. Thank you for shopping with Sakthi Textile.`,
        },
      };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "WhatsApp API error");
    return { sent: false, reason: err };
  }

  return { sent: true as const };
}

type SendSellerOrderWhatsAppParams = {
  mobile: string;
  orderId: string;
  amount: string;
  customerName?: string | null;
  customerMobile?: string | null;
};

export async function sendSellerOrderWhatsApp(
  params: SendSellerOrderWhatsAppParams,
) {
  const config = await getWhatsAppConfig();
  if (!config)
    return { sent: false, reason: "whatsapp_not_configured" as const };

  const to = normalizeIndianMobile(params.mobile);
  if (!to) return { sent: false, reason: "invalid_mobile" as const };

  const endpoint = `https://graph.facebook.com/v20.0/${config.phoneNumberId}/messages`;
  const body = {
    messaging_product: "whatsapp",
    to,
    type: "text",
    text: {
      body: `New paid order received.\nOrder: #${params.orderId}\nAmount: INR ${params.amount}\nCustomer: ${params.customerName || "N/A"}\nMobile: ${params.customerMobile || "N/A"}`,
    },
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.accessToken}`,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const err = await res.text().catch(() => "WhatsApp API error");
    return { sent: false, reason: err };
  }

  return { sent: true as const };
}

export async function sendSellerWhatsAppBulk(params: {
  orderId: string;
  amount: string;
  customerName?: string | null;
  customerMobile?: string | null;
}) {
  const config = await getWhatsAppConfig();
  if (!config || !config.notifySeller || config.sellerMobiles.length === 0) {
    return {
      sent: false as const,
      reason: "seller_notification_not_configured",
    };
  }

  let sentCount = 0;
  for (const mobile of config.sellerMobiles) {
    const res = await sendSellerOrderWhatsApp({
      mobile,
      orderId: params.orderId,
      amount: params.amount,
      customerName: params.customerName,
      customerMobile: params.customerMobile,
    });
    if (res.sent) sentCount += 1;
  }

  return { sent: sentCount > 0, sentCount };
}

export async function notifyOrderWhatsAppTargets(order: SelectOrders) {
  const result = {
    customerNotified: false,
    sellerNotified: false,
  };

  if (order.customer_mobile && !order.whatsapp_notified) {
    const customerRes = await sendOrderSuccessWhatsApp({
      mobile: order.customer_mobile,
      customerName: order.name,
      orderId: order.id,
      amount: String(order.amount),
    });
    result.customerNotified = customerRes.sent;
  }

  if (!order.whatsapp_seller_notified) {
    const sellerRes = await sendSellerWhatsAppBulk({
      orderId: order.id,
      amount: String(order.amount),
      customerName: order.name,
      customerMobile: order.customer_mobile,
    });
    result.sellerNotified = sellerRes.sent;
  }

  return result;
}
