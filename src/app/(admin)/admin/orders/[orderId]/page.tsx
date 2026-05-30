import AdminShell from "@/components/admin/AdminShell";
import AdminOrderDetailView from "@/features/orders/components/admin/AdminOrderDetailView";
import { keytoUrl } from "@/lib/utils";
import db from "@/lib/supabase/db";
import {
  address,
  medias,
  orderLines,
  orders,
  products,
} from "@/lib/supabase/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

type AdminOrderDetailPageProps = {
  params: {
    orderId: string;
  };
};

function buildAddressText(payload: {
  orderCreatedAt: string;
  customerName: string | null;
  customerMobile: string | null;
  shippingAddress: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  } | null;
}) {
  const shipping = payload.shippingAddress;
  const pincode = shipping?.postalCode?.trim() || "-";
  const cityState = [shipping?.city, shipping?.state].filter(Boolean).join(", ");
  const addressLines = [
    shipping?.line1?.trim(),
    shipping?.line2?.trim(),
    cityState || undefined,
    shipping?.country?.trim() || "India",
  ].filter(Boolean) as string[];

  const lines: string[] = [];
  lines.push(`Name: ${payload.customerName || "Customer"}`);
  lines.push(`Mobile: ${payload.customerMobile || "-"}`);
  lines.push(`Pincode: ${pincode}`);
  lines.push(`Date: ${new Date(payload.orderCreatedAt).toLocaleDateString("en-IN")}`);
  lines.push("");
  lines.push("Address:");

  if (shipping) {
    lines.push(...addressLines);
  } else {
    lines.push("Address not available.");
  }

  return lines.join("\n").trim();
}

function buildCourierCopyText(payload: {
  orderId: string;
  createdAt: string;
  customerName: string | null;
  customerMobile: string | null;
  amount: number;
  items: { productName: string; quantity: number }[];
  addressText: string;
}) {
  const itemLines = payload.items.map(
    (item, idx) => `${idx + 1}. ${item.productName} x ${item.quantity}`,
  );

  return [
    `ORDER DISPATCH NOTE`,
    `Order ID: ${payload.orderId}`,
    `Date: ${new Date(payload.createdAt).toLocaleString()}`,
    `Customer: ${payload.customerName || "Customer"}`,
    `Mobile: ${payload.customerMobile || "-"}`,
    `Amount: INR ${payload.amount}`,
    ``,
    `Items to Pack:`,
    ...itemLines,
    ``,
    `Shipping Address:`,
    payload.addressText,
  ].join("\n");
}

async function OrderDetailPage({ params }: AdminOrderDetailPageProps) {
  const { orderId } = params;

  const orderRows = await db
    .select({
      id: orders.id,
      createdAt: orders.createdAt,
      amount: orders.amount,
      currency: orders.currency,
      orderStatus: orders.order_status,
      paymentStatus: orders.payment_status,
      paymentProvider: orders.payment_provider,
      paymentMethod: orders.payment_method,
      paymentReference: orders.payment_reference,
      customerName: orders.name,
      customerEmail: orders.email,
      customerMobile: orders.customer_mobile,
      addressLine1: address.line1,
      addressLine2: address.line2,
      addressCity: address.city,
      addressState: address.state,
      addressPostalCode: address.postal_code,
      addressCountry: address.country,
    })
    .from(orders)
    .leftJoin(address, eq(orders.addressId, address.id))
    .where(eq(orders.id, orderId))
    .limit(1);

  const order = orderRows[0];
  if (!order) return notFound();

  const lineRows = await db
    .select({
      id: orderLines.id,
      productId: orderLines.productId,
      quantity: orderLines.quantity,
      unitPrice: orderLines.price,
      productName: products.name,
      productSlug: products.slug,
      imageKey: medias.key,
      imageAlt: medias.alt,
    })
    .from(orderLines)
    .leftJoin(products, eq(orderLines.productId, products.id))
    .leftJoin(medias, eq(products.featuredImageId, medias.id))
    .where(eq(orderLines.orderId, orderId));

  const itemViews = lineRows.map((row) => {
    const unitPrice = Number(row.unitPrice ?? 0);
    return {
      id: row.id,
      productId: row.productId,
      productName: row.productName || "Product",
      productSlug: row.productSlug ?? null,
      imageUrl: keytoUrl(row.imageKey ?? undefined),
      imageAlt: row.imageAlt || row.productName || "Product image",
      quantity: row.quantity,
      unitPrice,
      lineTotal: unitPrice * row.quantity,
    };
  });

  const shippingAddress = order.addressLine1
    ? {
        line1: order.addressLine1,
        line2: order.addressLine2,
        city: order.addressCity,
        state: order.addressState,
        postalCode: order.addressPostalCode,
        country: order.addressCountry,
      }
    : null;

  const orderView = {
    id: order.id,
    createdAt: new Date(order.createdAt).toISOString(),
    amount: Number(order.amount),
    currency: order.currency || "INR",
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentProvider: order.paymentProvider,
    paymentMethod: order.paymentMethod,
    paymentReference: order.paymentReference,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerMobile: order.customerMobile,
    shippingAddress,
  };

  const addressText = buildAddressText({
    orderCreatedAt: orderView.createdAt,
    customerName: orderView.customerName,
    customerMobile: orderView.customerMobile,
    shippingAddress: orderView.shippingAddress,
  });
  const courierCopyText = buildCourierCopyText({
    orderId: orderView.id,
    createdAt: orderView.createdAt,
    customerName: orderView.customerName,
    customerMobile: orderView.customerMobile,
    amount: orderView.amount,
    items: itemViews.map((item) => ({
      productName: item.productName,
      quantity: item.quantity,
    })),
    addressText,
  });

  return (
    <AdminShell
      heading={`Order #${orderView.id}`}
      description="Packing-ready order details with shipping address and quick copy for courier."
      showBackButton
    >
      <AdminOrderDetailView
        order={orderView}
        items={itemViews}
        copyAddressText={addressText}
        courierCopyText={courierCopyText}
      />
    </AdminShell>
  );
}

export default OrderDetailPage;
