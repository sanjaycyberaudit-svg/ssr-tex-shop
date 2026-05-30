"use client";

import Link from "next/link";
import {
  IndianRupee,
  Package,
  ShoppingBag,
  Users,
  FolderOpen,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Bell,
  BarChart3,
  FileText,
} from "lucide-react";
import { CalendarDateRangePicker, Overview, RecentSales } from "@/features/cms";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { DashboardStats } from "@/lib/admin/getDashboardStats";
import { formatInr } from "@/lib/utils";
import { siteConfig } from "@/config/site";

type Props = {
  stats: DashboardStats;
  statsError?: string | null;
};

function ChangeLabel({ pct }: { pct: number | null }) {
  if (pct === null) {
    return (
      <span className="text-xs text-muted-foreground">No prior month data</span>
    );
  }
  const up = pct >= 0;
  return (
    <p
      className={`text-xs flex items-center gap-1 ${up ? "text-emerald-600" : "text-amber-600"}`}
    >
      {up ? (
        <TrendingUp className="h-3 w-3" />
      ) : (
        <TrendingDown className="h-3 w-3" />
      )}
      {up ? "+" : ""}
      {pct}% from last month
    </p>
  );
}

export function DashboardView({ stats, statsError }: Props) {
  return (
    <div className="flex-col md:flex">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-4 md:pt-6">
        {statsError ? (
          <div
            role="alert"
            className="rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          >
            <p className="font-medium">
              Some dashboard data could not be loaded
            </p>
            <p className="mt-1 text-xs opacity-90">{statsError}</p>
          </div>
        ) : null}

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
              Sakthi Textile Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Store overview — products, orders, collections & alerts
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CalendarDateRangePicker />
            <Button variant="outline" asChild>
              <Link href="/admin/orders">View orders</Link>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex flex-wrap h-auto gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="notifications" className="relative">
              Notifications
              {stats.notifications.length > 0 && (
                <Badge
                  variant="destructive"
                  className="ml-2 h-5 min-w-5 px-1 text-[10px]"
                >
                  {stats.notifications.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <IndianRupee className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatInr(stats.totalRevenue)}
                  </div>
                  <ChangeLabel pct={stats.revenueChangePct} />
                  <p className="text-xs text-muted-foreground mt-1">
                    This month: {formatInr(stats.revenueThisMonth)}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Orders</CardTitle>
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalOrders}</div>
                  <ChangeLabel pct={stats.ordersChangePct} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.paidOrdersCount} paid · {stats.pendingOrdersCount}{" "}
                    pending
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Products
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalProducts}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.featuredProducts} featured on homepage
                  </p>
                  {(stats.lowStockCount > 0 || stats.outOfStockCount > 0) && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      {stats.lowStockCount} low · {stats.outOfStockCount} out of
                      stock
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Collections
                  </CardTitle>
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalCollections}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saree categories live
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Users className="inline h-3 w-3 mr-1" />
                    {stats.totalCustomers} registered customers
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Revenue overview</CardTitle>
                  <CardDescription>
                    Paid orders — last 12 months (INR)
                  </CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview data={stats.monthlyRevenue} />
                </CardContent>
              </Card>
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Recent paid orders</CardTitle>
                  <CardDescription>
                    Latest {stats.recentPaidOrders.length} paid order
                    {stats.recentPaidOrders.length === 1 ? "" : "s"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales
                    orders={stats.recentPaidOrders}
                    emptyMessage="No paid orders yet."
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Pending payment orders</CardTitle>
                  <CardDescription>
                    Orders that need payment follow-up
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales
                    orders={stats.recentPendingOrders}
                    emptyMessage="No pending payment orders right now."
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>All recent orders</CardTitle>
                  <CardDescription>
                    Latest {stats.recentOrders.length} order
                    {stats.recentOrders.length === 1 ? "" : "s"} across all
                    statuses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales
                    orders={stats.recentOrders}
                    emptyMessage="No orders yet."
                  />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick links</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/admin/products/new">Add new saree</Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/admin/collections">Manage collections</Link>
                  </Button>
                  <Button variant="outline" className="justify-start" asChild>
                    <Link href="/admin/medias">Upload images</Link>
                  </Button>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Shop contact</CardTitle>
                  <CardDescription>
                    Shown on storefront footer & menu
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  {siteConfig.addressLines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                  <p className="pt-2 text-muted-foreground">
                    GSTIN: {siteConfig.gstin}
                  </p>
                  <p className="pt-2">
                    <a
                      href={siteConfig.phoneHref}
                      className="text-primary hover:underline"
                    >
                      {siteConfig.phone}
                    </a>
                    {" · "}
                    <a
                      href={`mailto:${siteConfig.email}`}
                      className="text-primary hover:underline"
                    >
                      {siteConfig.email}
                    </a>
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Payment breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.ordersByPayment.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No orders yet.
                    </p>
                  ) : (
                    stats.ordersByPayment.map(({ status, count }) => (
                      <div
                        key={status}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="capitalize">
                          {status.replace(/_/g, " ")}
                        </span>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Top products (units sold)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {stats.topProducts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No order lines yet.
                    </p>
                  ) : (
                    stats.topProducts.map((p) => (
                      <div
                        key={p.productId}
                        className="flex justify-between text-sm gap-2"
                      >
                        <Link
                          href={`/admin/products/${p.productId}`}
                          className="truncate hover:underline font-medium"
                        >
                          {p.name}
                        </Link>
                        <span className="text-muted-foreground shrink-0">
                          {p.quantity} sold · {formatInr(p.revenue)}
                        </span>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Inventory health</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total products</span>
                    <strong>{stats.totalProducts}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Featured on home</span>
                    <strong>{stats.featuredProducts}</strong>
                  </div>
                  <div className="flex justify-between text-amber-600">
                    <span>Low stock (&lt;5)</span>
                    <strong>{stats.lowStockCount}</strong>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Out of stock</span>
                    <strong>{stats.outOfStockCount}</strong>
                  </div>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Monthly revenue</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <Overview data={stats.monthlyRevenue} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Sales summary
                </CardTitle>
                <CardDescription>
                  Snapshot for {siteConfig.name} — use Orders page for full
                  detail
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4 font-medium">Metric</th>
                        <th className="pb-2 font-medium">Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      <tr>
                        <td className="py-3 pr-4">Total revenue (paid)</td>
                        <td className="py-3 font-semibold">
                          {formatInr(stats.totalRevenue)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">Revenue this month</td>
                        <td className="py-3">
                          {formatInr(stats.revenueThisMonth)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">Revenue last month</td>
                        <td className="py-3">
                          {formatInr(stats.revenueLastMonth)}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">Total orders</td>
                        <td className="py-3">{stats.totalOrders}</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">Orders this month</td>
                        <td className="py-3">{stats.ordersThisMonth}</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">Paid orders</td>
                        <td className="py-3">{stats.paidOrdersCount}</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">
                          Pending / unpaid attention
                        </td>
                        <td className="py-3">{stats.pendingOrdersCount}</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">Active collections</td>
                        <td className="py-3">{stats.totalCollections}</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">Catalog products</td>
                        <td className="py-3">{stats.totalProducts}</td>
                      </tr>
                      <tr>
                        <td className="py-3 pr-4">Registered customers</td>
                        <td className="py-3">{stats.totalCustomers}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Button asChild>
                    <Link href="/admin/orders">Open orders</Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/admin/products">Open products</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Store alerts
                </CardTitle>
                <CardDescription>
                  Orders and inventory that need your attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {stats.notifications.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-6 text-center">
                    All clear — no pending alerts right now.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {stats.notifications.map((n) => (
                      <li key={n.id}>
                        <Link
                          href={n.href}
                          className="flex gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <div
                            className={`mt-0.5 h-2 w-2 rounded-full shrink-0 ${
                              n.priority === "high"
                                ? "bg-red-500"
                                : n.priority === "medium"
                                  ? "bg-amber-500"
                                  : "bg-emerald-500"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium">{n.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {n.description}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className="capitalize shrink-0"
                          >
                            {n.type}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
