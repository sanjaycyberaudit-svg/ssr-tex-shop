import db from "@/lib/supabase/db";
import { address, orderLines, orders, products } from "@/lib/supabase/schema";
import {
  resolveVeloApiKey,
  touchVeloApiKeyUsage,
} from "@/lib/integrations/velo";
import { and, asc, eq, gt, inArray } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function extractApiKey(request: NextRequest) {
  const headerKey = request.headers.get("x-velo-key")?.trim();
  if (headerKey) return headerKey;

  const auth = request.headers.get("authorization")?.trim();
  if (auth?.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  return "";
}

export async function GET(request: NextRequest) {
  const apiKey = extractApiKey(request);
  const resolvedKey = await resolveVeloApiKey(apiKey);
  if (!resolvedKey) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  await touchVeloApiKeyUsage(resolvedKey.id);

  const searchParams = request.nextUrl.searchParams;
  const since = searchParams.get("since");
  const limitRaw = Number.parseInt(searchParams.get("limit") ?? "", 10);
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_LIMIT)
    : DEFAULT_LIMIT;

  let createdAfterDate: Date | null = null;
  if (since) {
    const parsed = new Date(since);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        { message: "Invalid `since` format. Use ISO datetime." },
        { status: 400 },
      );
    }
    createdAfterDate = parsed;
  }

  const whereClause = createdAfterDate
    ? and(
        eq(orders.payment_status, "paid"),
        gt(orders.createdAt, createdAfterDate),
      )
    : eq(orders.payment_status, "paid");

  const orderRows = await db
    .select({
      id: orders.id,
      amount: orders.amount,
      currency: orders.currency,
      email: orders.email,
      name: orders.name,
      createdAt: orders.createdAt,
      paymentStatus: orders.payment_status,
      paymentMethod: orders.payment_method,
      paymentProvider: orders.payment_provider,
      paymentReference: orders.payment_reference,
      customerMobile: orders.customer_mobile,
      orderStatus: orders.order_status,
      addressId: orders.addressId,
    })
    .from(orders)
    .where(whereClause)
    .orderBy(asc(orders.createdAt))
    .limit(limit);

  if (orderRows.length === 0) {
    return NextResponse.json({
      client: resolvedKey.clientName,
      count: 0,
      orders: [],
      nextSince: since ?? null,
    });
  }

  const orderIds = orderRows.map((row) => row.id);
  const addressIds = orderRows
    .map((row) => row.addressId)
    .filter((id): id is string => Boolean(id));

  const [lineRows, addressRows] = await Promise.all([
    db
      .select({
        orderId: orderLines.orderId,
        productId: orderLines.productId,
        quantity: orderLines.quantity,
        price: orderLines.price,
        productName: products.name,
      })
      .from(orderLines)
      .leftJoin(products, eq(orderLines.productId, products.id))
      .where(inArray(orderLines.orderId, orderIds)),
    addressIds.length
      ? db
          .select({
            id: address.id,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            postalCode: address.postal_code,
            country: address.country,
          })
          .from(address)
          .where(inArray(address.id, addressIds))
      : Promise.resolve([]),
  ]);

  const linesByOrder = new Map<string, typeof lineRows>();
  lineRows.forEach((line) => {
    const current = linesByOrder.get(line.orderId) ?? [];
    current.push(line);
    linesByOrder.set(line.orderId, current);
  });

  const addressById = new Map(addressRows.map((row) => [row.id, row]));

  const data = orderRows.map((row) => ({
    orderId: row.id,
    createdAt: row.createdAt,
    amount: Number(row.amount),
    currency: row.currency,
    orderStatus: row.orderStatus,
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    paymentProvider: row.paymentProvider,
    paymentReference: row.paymentReference,
    customer: {
      name: row.name,
      email: row.email,
      mobile: row.customerMobile,
    },
    address: row.addressId ? addressById.get(row.addressId) ?? null : null,
    items: (linesByOrder.get(row.id) ?? []).map((line) => ({
      productId: line.productId,
      productName: line.productName ?? null,
      quantity: line.quantity,
      unitPrice: Number(line.price),
    })),
  }));

  return NextResponse.json({
    client: resolvedKey.clientName,
    count: data.length,
    orders: data,
    nextSince: orderRows[orderRows.length - 1].createdAt,
  });
}
