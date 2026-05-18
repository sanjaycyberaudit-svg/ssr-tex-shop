import db from "@/lib/supabase/db";
import {
  collections,
  orderLines,
  orders,
  products,
  profiles,
} from "@/lib/supabase/schema";
import { and, count, desc, eq, gte, lt } from "drizzle-orm";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export type MonthlyRevenuePoint = {
  name: string;
  total: number;
  monthKey: string;
};

export type RecentOrderRow = {
  id: string;
  name: string | null;
  email: string | null;
  amount: number;
  currency: string;
  payment_status: string;
  order_status: string | null;
  createdAt: Date;
};

export type DashboardNotification = {
  id: string;
  type: "order" | "stock" | "payment";
  title: string;
  description: string;
  href: string;
  priority: "high" | "medium" | "low";
};

export type TopProductRow = {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
};

export type DashboardStats = {
  totalRevenue: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  revenueChangePct: number | null;
  totalOrders: number;
  ordersThisMonth: number;
  ordersLastMonth: number;
  ordersChangePct: number | null;
  totalProducts: number;
  featuredProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalCollections: number;
  totalCustomers: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  monthlyRevenue: MonthlyRevenuePoint[];
  recentOrders: RecentOrderRow[];
  notifications: DashboardNotification[];
  topProducts: TopProductRow[];
  ordersByPayment: { status: string; count: number }[];
};

function monthStart(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function pctChange(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildMonthlyRevenue(
  paidOrders: { amount: string; createdAt: Date }[],
): MonthlyRevenuePoint[] {
  const now = new Date();
  const points: MonthlyRevenuePoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    points.push({
      monthKey: key,
      name: MONTH_LABELS[d.getMonth()],
      total: 0,
    });
  }

  for (const order of paidOrders) {
    const d = toDate(order.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const point = points.find((p) => p.monthKey === key);
    if (point) point.total += Number(order.amount);
  }

  return points;
}

export function getEmptyDashboardStats(): DashboardStats {
  const now = new Date();
  const monthlyRevenue: MonthlyRevenuePoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyRevenue.push({
      monthKey: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      name: MONTH_LABELS[d.getMonth()],
      total: 0,
    });
  }
  return {
    totalRevenue: 0,
    revenueThisMonth: 0,
    revenueLastMonth: 0,
    revenueChangePct: null,
    totalOrders: 0,
    ordersThisMonth: 0,
    ordersLastMonth: 0,
    ordersChangePct: null,
    totalProducts: 0,
    featuredProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    totalCollections: 0,
    totalCustomers: 0,
    paidOrdersCount: 0,
    pendingOrdersCount: 0,
    monthlyRevenue,
    recentOrders: [],
    notifications: [],
    topProducts: [],
    ordersByPayment: [],
  };
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const now = new Date();
  const thisMonthStart = monthStart(now);
  const lastMonthStart = monthStart(
    new Date(now.getFullYear(), now.getMonth() - 1, 1),
  );
  const twelveMonthsAgo = monthStart(
    new Date(now.getFullYear(), now.getMonth() - 11, 1),
  );

  const [
    allOrders,
    productRows,
    collectionCount,
    customerCount,
    lowStockRows,
    outOfStockRows,
    topProductRows,
  ] = await Promise.all([
    db.select().from(orders).orderBy(desc(orders.createdAt)),
    db.select().from(products),
    db.select({ count: count() }).from(collections),
    db.select({ count: count() }).from(profiles),
    db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(and(lt(products.stock, 5), gte(products.stock, 1))),
    db
      .select({ id: products.id, name: products.name, stock: products.stock })
      .from(products)
      .where(eq(products.stock, 0)),
    db
      .select({
        productId: orderLines.productId,
        name: products.name,
        quantity: orderLines.quantity,
        price: orderLines.price,
      })
      .from(orderLines)
      .innerJoin(products, eq(orderLines.productId, products.id)),
  ]);

  const paidOrders = allOrders.filter((o) => o.payment_status === "paid");
  const paidInRange = paidOrders.filter(
    (o) => toDate(o.createdAt) >= twelveMonthsAgo,
  );

  const totalRevenue = paidOrders.reduce((s, o) => s + Number(o.amount), 0);

  const ordersThisMonth = allOrders.filter(
    (o) => toDate(o.createdAt) >= thisMonthStart,
  );
  const ordersLastMonth = allOrders.filter((o) => {
    const created = toDate(o.createdAt);
    return created >= lastMonthStart && created < thisMonthStart;
  });

  const revenueThisMonth = paidOrders
    .filter((o) => toDate(o.createdAt) >= thisMonthStart)
    .reduce((s, o) => s + Number(o.amount), 0);

  const revenueLastMonth = paidOrders
    .filter((o) => {
      const created = toDate(o.createdAt);
      return created >= lastMonthStart && created < thisMonthStart;
    })
    .reduce((s, o) => s + Number(o.amount), 0);

  const paymentGroups = allOrders.reduce<Record<string, number>>((acc, o) => {
    const key = o.payment_status ?? "unknown";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  const notifications: DashboardNotification[] = [];

  const pending = allOrders.filter(
    (o) =>
      o.order_status === "pending" ||
      (o.payment_status === "unpaid" && o.order_status !== "cancelled"),
  );

  for (const order of pending.slice(0, 5)) {
    notifications.push({
      id: `order-${order.id}`,
      type: "order",
      title: `Order needs attention`,
      description: `${order.name ?? order.email ?? order.id} — ${order.payment_status}`,
      href: "/admin/orders",
      priority: "high",
    });
  }

  for (const p of lowStockRows.slice(0, 5)) {
    notifications.push({
      id: `stock-${p.id}`,
      type: "stock",
      title: `Low stock: ${p.name}`,
      description: `Only ${p.stock} left in inventory`,
      href: `/admin/products/${p.id}`,
      priority: "medium",
    });
  }

  for (const p of outOfStockRows.slice(0, 3)) {
    notifications.push({
      id: `out-${p.id}`,
      type: "stock",
      title: `Out of stock: ${p.name}`,
      description: "Restock or hide from shop",
      href: `/admin/products/${p.id}`,
      priority: "high",
    });
  }

  const unpaidPaid = allOrders.filter((o) => o.payment_status === "unpaid");
  if (unpaidPaid.length > 0 && notifications.length < 8) {
    notifications.push({
      id: "payment-unpaid",
      type: "payment",
      title: `${unpaidPaid.length} unpaid order(s)`,
      description: "Follow up on pending payments",
      href: "/admin/orders",
      priority: "medium",
    });
  }

  const productAgg = new Map<
    string,
    { productId: string; name: string; quantity: number; revenue: number }
  >();
  for (const row of topProductRows) {
    const qty = row.quantity;
    const rev = Number(row.price) * qty;
    const existing = productAgg.get(row.productId);
    if (existing) {
      existing.quantity += qty;
      existing.revenue += rev;
    } else {
      productAgg.set(row.productId, {
        productId: row.productId,
        name: row.name,
        quantity: qty,
        revenue: rev,
      });
    }
  }
  const topProducts = [...productAgg.values()]
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return {
    totalRevenue,
    revenueThisMonth,
    revenueLastMonth,
    revenueChangePct: pctChange(revenueThisMonth, revenueLastMonth),
    totalOrders: allOrders.length,
    ordersThisMonth: ordersThisMonth.length,
    ordersLastMonth: ordersLastMonth.length,
    ordersChangePct: pctChange(ordersThisMonth.length, ordersLastMonth.length),
    totalProducts: productRows.length,
    featuredProducts: productRows.filter((p) => p.featured).length,
    lowStockCount: lowStockRows.length,
    outOfStockCount: outOfStockRows.length,
    totalCollections: collectionCount[0]?.count ?? 0,
    totalCustomers: customerCount[0]?.count ?? 0,
    paidOrdersCount: paidOrders.length,
    pendingOrdersCount: pending.length,
    monthlyRevenue: buildMonthlyRevenue(paidInRange),
    recentOrders: allOrders.slice(0, 6).map((o) => ({
      id: o.id,
      name: o.name,
      email: o.email,
      amount: Number(o.amount),
      currency: o.currency,
      payment_status: o.payment_status,
      order_status: o.order_status,
      createdAt: toDate(o.createdAt),
    })),
    notifications: notifications.slice(0, 12),
    topProducts,
    ordersByPayment: Object.entries(paymentGroups).map(([status, n]) => ({
      status,
      count: n,
    })),
  };
}
