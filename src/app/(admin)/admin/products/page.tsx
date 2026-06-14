import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import { DataTableSkeleton } from "@/features/cms";
import { StockControlForm } from "@/features/admin/settings/StockControlForm";
import { AdminProductsTableSection } from "@/features/products/components/admin/AdminProductsTableSection";
import {
  resolveBulkOrderGuardConfig,
  resolveStockControlConfig,
} from "@/lib/integrations/settings";
import db from "@/lib/supabase/db";
import { carts, products } from "@/lib/supabase/schema";
import { getAdminProductsCount } from "@/lib/admin/getAdminProductsList";
import { cn } from "@/lib/utils";
import { gte, lt, sql } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";

type AdminProjectsPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

async function ProductsPage({ searchParams }: AdminProjectsPageProps) {
  const [totalProducts, bulkOrderGuard, stockControl] = await Promise.all([
    getAdminProductsCount(),
    resolveBulkOrderGuardConfig(),
    resolveStockControlConfig(),
  ]);
  const bulkHitCountRows = bulkOrderGuard.enabled
    ? await db
        .select({
          count: sql<number>`count(distinct ${carts.productId})::int`,
        })
        .from(carts)
        .where(gte(carts.quantity, bulkOrderGuard.threshold))
    : [{ count: 0 }];
  const lowStockCountRows = stockControl.enabled
    ? await db
        .select({
          count: sql<number>`count(*)::int`,
        })
        .from(products)
        .where(lt(products.stock, stockControl.lowStockThreshold))
    : [{ count: 0 }];

  const threshold = bulkOrderGuard.threshold;
  const bulkHitCount = bulkOrderGuard.enabled
    ? Number(bulkHitCountRows[0]?.count ?? 0)
    : 0;
  const lowStockCount = stockControl.enabled
    ? Number(lowStockCountRows[0]?.count ?? 0)
    : 0;

  return (
    <AdminShell
      heading="Products"
      description={`Manage all ${totalProducts} products in your catalog.`}
    >
      <section className="flex justify-end items-center pb-5 w-full">
        <Link href="/admin/products/new" className={cn(buttonVariants())}>
          New Product
        </Link>
      </section>
      <section className="pb-5">
        <StockControlForm />
      </section>
      <section className="grid gap-4 pb-5 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Stock visibility threshold
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {stockControl.enabled
              ? `< ${stockControl.lowStockThreshold}`
              : "Disabled"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Products below threshold
          </p>
          <p className="mt-1 text-2xl font-semibold">{lowStockCount}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Bulk guard threshold
          </p>
          <p className="mt-1 text-2xl font-semibold">
            {bulkOrderGuard.enabled ? `${threshold}+` : "Disabled"}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Products at/above threshold in carts
          </p>
          <p className="mt-1 text-2xl font-semibold">{bulkHitCount}</p>
        </div>
      </section>

      <Suspense fallback={<DataTableSkeleton />}>
        <AdminProductsTableSection />
      </Suspense>
    </AdminShell>
  );
}

export default ProductsPage;
