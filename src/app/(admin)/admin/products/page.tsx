import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import { StockControlForm } from "@/features/admin/settings/StockControlForm";
import { ProductsColumns, ProductsDataTable } from "@/features/products";
import {
  resolveBulkOrderGuardConfig,
  resolveStockControlConfig,
} from "@/lib/integrations/settings";
import { getAdminProductsList } from "@/lib/admin/getAdminProductsList";
import db from "@/lib/supabase/db";
import { carts, products } from "@/lib/supabase/schema";
import { cn } from "@/lib/utils";
import { gte, lt, sql } from "drizzle-orm";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type AdminProjectsPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

async function ProductsPage({ searchParams }: AdminProjectsPageProps) {
  let productRows: Awaited<ReturnType<typeof getAdminProductsList>> = [];
  let loadError: string | null = null;

  try {
    const [rows, bulkOrderGuard, stockControl] = await Promise.all([
      getAdminProductsList(),
      resolveBulkOrderGuardConfig(),
      resolveStockControlConfig(),
    ]);
    productRows = rows;

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
    const totalProducts = productRows.length;

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

        <ProductsDataTable
          columns={ProductsColumns}
          data={productRows}
          bulkDeleteEndpoint="/api/admin/products/manage"
          bulkDeleteLabel="Delete selected products"
          enableDragSelect
        />
      </AdminShell>
    );
  } catch (error) {
    console.error("[admin/products] page load failed:", error);
    loadError =
      error instanceof Error
        ? error.message
        : "Could not load products from the database.";
  }

  return (
    <AdminShell
      heading="Products"
      description="Product catalog could not be loaded."
    >
      <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-6 text-sm">
        <p className="font-semibold text-destructive">Failed to load products</p>
        <p className="mt-2 text-muted-foreground">{loadError}</p>
        <p className="mt-2 text-muted-foreground">
          Refresh the page. If this continues, check the database connection in
          Vercel environment variables.
        </p>
      </div>
    </AdminShell>
  );
}

export default ProductsPage;
