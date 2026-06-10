import AdminShell from "@/components/admin/AdminShell";
import { buttonVariants } from "@/components/ui/button";
import { DataTableSkeleton } from "@/features/cms";
import { StockControlForm } from "@/features/admin/settings/StockControlForm";
import { ProductsColumns, ProductsDataTable } from "@/features/products";
import { gql } from "@/gql";
import {
  resolveBulkOrderGuardConfig,
  resolveStockControlConfig,
} from "@/lib/integrations/settings";
import db from "@/lib/supabase/db";
import { carts, products } from "@/lib/supabase/schema";
import { getClient } from "@/lib/urql";
import { cn } from "@/lib/utils";
import { gte, lt, sql } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type AdminProjectsPageProps = {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
};

async function ProductsPage({ searchParams }: AdminProjectsPageProps) {
  const AdminProductsPageQuery = gql(/* GraphQL */ `
    query AdminProductsPageQuery {
      productsCollection(orderBy: [{ created_at: DescNullsLast }]) {
        edges {
          node {
            id
            ...ProductColumnFragment
          }
        }
      }
    }
  `);

  const [{ data }, bulkOrderGuard, stockControl] = await Promise.all([
    getClient().query(AdminProductsPageQuery, {}),
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

  if (!data) return notFound();
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
      description={"Edit products from the dashboard. "}
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
        <ProductsDataTable
          columns={ProductsColumns}
          data={data.productsCollection?.edges || []}
          bulkDeleteEndpoint="/api/admin/products/manage"
          bulkDeleteLabel="Delete selected products"
          enableDragSelect
        />
      </Suspense>
    </AdminShell>
  );
}

export default ProductsPage;
