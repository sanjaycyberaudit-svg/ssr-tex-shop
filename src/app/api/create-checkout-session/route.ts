import { getProductsByIds } from "@/_actions/products";
import type { CartItems } from "@/features/carts";
import { stripe } from "@/lib/stripe";
import db from "@/lib/supabase/db";
import { SelectProducts, orders } from "@/lib/supabase/schema";
import { getURL } from "@/lib/utils";
import { orderLines } from "./../../../lib/supabase/schema";

import { User, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

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
  const data = (await request.json()) as {
    orderProducts: OrderProducts;
    guest: boolean;
    shipping: z.infer<typeof shippingSchema>;
  };

  let user: User | undefined;

  const validation = orderProductsSchema.safeParse(data);
  const supabase = createRouteHandlerClient({ cookies });

  if (!validation)
    return new NextResponse(JSON.stringify("Invalid data format."), {
      status: 400,
    });

  try {
    const productsQuantity = await mergeProductDetailsWithQuantities(
      data.orderProducts,
    );

    const amount = calcSubtotal(productsQuantity);

    const insertedOrder = await db
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
        payment_method: "card",
      })
      .returning();

    await db.insert(orderLines).values(
      productsQuantity.map(({ id, quantity, price }) => ({
        productId: id,
        quantity,
        price: `${price}`,
        orderId: insertedOrder[0].id,
      })),
    );

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

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    return new NextResponse("Internal Error", { status: 500 });
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
