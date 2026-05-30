import { getProductsByIds } from "@/_actions/products";
import type { CartItems } from "@/features/carts";
import { createPhonePePayment } from "@/lib/payments/phonepe";
import { createCashfreePayment } from "@/lib/payments/cashfree";
import { stripe } from "@/lib/stripe";
import db from "@/lib/supabase/db";
import { SelectProducts, orders } from "@/lib/supabase/schema";
import {
  getCashfreeConfig,
  getIntegrationSetting,
  getPhonePeConfig,
  INTEGRATION_KEYS,
} from "@/lib/integrations/settings";
import { getURL } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { orderLines } from "./../../../lib/supabase/schema";

import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const shippingSchema = z.object({
  addressId: z.string().min(1),
  fullName: z.string().min(2),
  email: z.string().email(),
  mobile: z.string().min(10),
});

const orderProductsSchema = z.object({
  orderProducts: z.record(
    z.object({
      quantity: z.number().min(1),
    }),
  ),
  guest: z.boolean(),
  shipping: shippingSchema,
});

type OrderProducts = CartItems;

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const data = (payload ?? {}) as {
    orderProducts: OrderProducts;
    guest: boolean;
    shipping: z.infer<typeof shippingSchema>;
  };

  const validation = orderProductsSchema.safeParse(data);
  const supabase = createRouteHandlerClient({ cookies });

  if (!validation.success)
    return new NextResponse(JSON.stringify("Invalid data format."), {
      status: 400,
    });

  try {
    const [cashfreeConfig, phonePeConfig, cashfreeSetting, phonepeSetting] =
      await Promise.all([
        getCashfreeConfig(),
        getPhonePeConfig(),
        getIntegrationSetting(INTEGRATION_KEYS.cashfree),
        getIntegrationSetting(INTEGRATION_KEYS.phonepe),
      ]);

    if (cashfreeSetting?.isEnabled && !cashfreeConfig) {
      return NextResponse.json(
        {
          message:
            "Cashfree is enabled but configuration is incomplete. Update Client ID, Secret, Base URL and API version in Admin settings.",
        },
        { status: 400 },
      );
    }

    if (phonepeSetting?.isEnabled && !phonePeConfig) {
      return NextResponse.json(
        {
          message:
            "PhonePe is enabled but configuration is incomplete. Update Merchant ID, Salt Key, Salt Index and Base URL in Admin settings.",
        },
        { status: 400 },
      );
    }

    const preferCashfree = Boolean(cashfreeConfig);
    const preferPhonePe = !preferCashfree && Boolean(phonePeConfig);

    const productsQuantity = await mergeProductDetailsWithQuantities(
      data.orderProducts,
    );

    const amount = calcSubtotal(productsQuantity);

    const insertedOrder = await db.transaction(async (tx) => {
      const created = await tx
        .insert(orders)
        .values({
          user_id: !data.guest
            ? (await supabase.auth.getUser()).data.user?.id
            : null,
          name: data.shipping.fullName,
          email: data.shipping.email,
          addressId: data.shipping.addressId,
          currency: "inr",
          amount: `${amount}`,
          order_status: "pending",
          payment_status: "unpaid",
          payment_method: preferCashfree
            ? "cashfree"
            : preferPhonePe
              ? "phonepe"
              : "card",
          payment_provider: preferCashfree
            ? "cashfree"
            : preferPhonePe
              ? "phonepe"
              : "stripe",
          customer_mobile: data.shipping.mobile,
        })
        .returning();

      await tx.insert(orderLines).values(
        productsQuantity.map(({ id, quantity, price }) => ({
          productId: id,
          quantity,
          price: `${price}`,
          orderId: created[0].id,
        })),
      );

      return created;
    });

    if (preferCashfree) {
      const payment = await createCashfreePayment({
        orderId: insertedOrder[0].id,
        amountInRupees: amount,
        customerName: data.shipping.fullName,
        customerMobile: data.shipping.mobile,
        customerEmail: data.shipping.email,
        customerId: !data.guest
          ? (await supabase.auth.getUser()).data.user?.id
          : undefined,
      });

      if (!payment?.paymentSessionId) {
        throw new Error("Cashfree payment session could not be created");
      }

      await db
        .update(orders)
        .set({
          payment_reference: payment.cashfreeCfOrderId ?? payment.cashfreeOrderId,
          payment_meta: {
            cashfreeOrderId: payment.cashfreeOrderId,
            cashfreeCfOrderId: payment.cashfreeCfOrderId,
          },
        })
        .where(eq(orders.id, insertedOrder[0].id));

      return NextResponse.json({
        provider: "cashfree",
        paymentSessionId: payment.paymentSessionId,
        environment: payment.environment,
      });
    }

    if (preferPhonePe) {
      const payment = await createPhonePePayment({
        orderId: insertedOrder[0].id,
        amountInRupees: amount,
        customerMobile: data.shipping.mobile,
        customerEmail: data.shipping.email,
      });

      if (!payment?.redirectUrl || !payment.merchantTransactionId) {
        throw new Error("PhonePe payment URL could not be created");
      }

      await db
        .update(orders)
        .set({
          phonepe_merchant_transaction_id: payment.merchantTransactionId,
          payment_reference: payment.merchantTransactionId,
        })
        .where(eq(orders.id, insertedOrder[0].id));

      return NextResponse.json({
        provider: "phonepe",
        redirectUrl: payment.redirectUrl,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      billing_address_collection: "required",
      customer_email: data.shipping.email,
      phone_number_collection: { enabled: true },
      metadata: {
        customer_mobile: data.shipping.mobile,
        shipping_address_id: data.shipping.addressId,
      },
      client_reference_id: insertedOrder[0].id,
      line_items: productsQuantity.map(({ name, price, quantity }) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: name,
          },
          unit_amount: parseFloat(price) * 100,
        },
        quantity: quantity,
      })),
      mode: "payment",
      allow_promotion_codes: true,
      success_url: `${getURL()}/orders/${insertedOrder[0].id}`,
      cancel_url: `${getURL()}/cart`,
    });

    return NextResponse.json({ provider: "stripe", sessionId: session.id });
  } catch (err) {
    console.error("[checkout] create-checkout-session failed:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Checkout initiation failed. Please retry.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

const calcSubtotal = (
  productsQuantity: (SelectProducts & { quantity: number })[],
) =>
  productsQuantity.reduce((acc, cur) => {
    return acc + cur.quantity * parseFloat(cur.price);
  }, 0);

const mergeProductDetailsWithQuantities = async (
  orderProducts: OrderProducts,
): Promise<(SelectProducts & { quantity: number })[]> => {
  const productIds = Object.keys(orderProducts);
  const products = await getProductsByIds(productIds);

  const orderDetails = products.map((product) => {
    const quantity = orderProducts[product.id].quantity;
    return { ...product, quantity };
  });

  return orderDetails;
};
