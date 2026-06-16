import db from "@/lib/supabase/db";
import { collections, medias, products } from "@/lib/supabase/schema";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { cache } from "react";

export const ADMIN_PRODUCTS_LIST_TAG = "admin-products-list";

export type AdminProductTableNode = {
  id: string;
  name: string;
  slug: string;
  rating: string;
  badge: string | null;
  price: string;
  discountEnabled: boolean;
  discountPercent: number | null;
  stock: number | null;
  featured: boolean | null;
  productCode: string | null;
  isDraft: boolean;
  featuredImage: {
    id: string;
    key: string;
    alt: string | null;
  } | null;
  collections: {
    id: string;
    label: string;
    slug: string;
  } | null;
};

export type AdminProductTableRow = {
  node: AdminProductTableNode;
};

export type AdminProductsListParams = {
  page?: number;
  pageSize?: number;
  query?: string;
};

export type AdminProductsListResult = {
  rows: AdminProductTableRow[];
  totalCount: number;
  page: number;
  pageSize: number;
};

/** Map joined DB rows into admin table shape. */
function mapAdminProductRows(
  rows: Array<{
    id: string;
    name: string;
    slug: string;
    rating: string;
    badge: string | null;
    price: string;
    discountEnabled: boolean;
    discountPercent: number | null;
    stock: number | null;
    featured: boolean | null;
    productCode: string | null;
    isDraft: boolean;
    collectionId: string | null;
    collectionLabel: string | null;
    collectionSlug: string | null;
    mediaId: string | null;
    mediaKey: string | null;
    mediaAlt: string | null;
  }>,
): AdminProductTableRow[] {
  return rows.map((row) => ({
    node: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      rating: row.rating,
      badge: row.badge,
      price: row.price,
      discountEnabled: row.discountEnabled,
      discountPercent: row.discountPercent,
      stock: row.stock,
      featured: row.featured,
      productCode: row.productCode,
      isDraft: row.isDraft,
      featuredImage:
        row.mediaId && row.mediaKey
          ? {
              id: row.mediaId,
              key: row.mediaKey,
              alt: row.mediaAlt,
            }
          : null,
      collections:
        row.collectionId && row.collectionLabel && row.collectionSlug
          ? {
              id: row.collectionId,
              label: row.collectionLabel,
              slug: row.collectionSlug,
            }
          : null,
    },
  }));
}

/** Lean admin catalog query — no HTML description blobs. */
export async function loadAdminProductsListFromDb(
  params: AdminProductsListParams = {},
): Promise<AdminProductsListResult> {
  const pageSize = Math.min(100, Math.max(10, params.pageSize ?? 30));
  const page = Math.max(1, params.page ?? 1);
  const offset = (page - 1) * pageSize;
  const query = (params.query ?? "").trim();
  const normalizedQuery = query.replace(/[%_]/g, "\\$&");
  const whereClause = normalizedQuery
    ? or(
        ilike(products.name, `%${normalizedQuery}%`),
        ilike(products.slug, `%${normalizedQuery}%`),
        ilike(products.productCode, `%${normalizedQuery}%`),
        ilike(collections.label, `%${normalizedQuery}%`),
      )
    : undefined;

  const [rows, countRows] = await Promise.all([
    db
      .select({
        id: products.id,
        name: products.name,
        slug: products.slug,
        rating: products.rating,
        badge: products.badge,
        price: products.price,
        discountEnabled: products.discountEnabled,
        discountPercent: products.discountPercent,
        stock: products.stock,
        featured: products.featured,
        productCode: products.productCode,
        isDraft: products.isDraft,
        collectionId: collections.id,
        collectionLabel: collections.label,
        collectionSlug: collections.slug,
        mediaId: medias.id,
        mediaKey: medias.key,
        mediaAlt: medias.alt,
      })
      .from(products)
      .leftJoin(collections, eq(products.collectionId, collections.id))
      .leftJoin(medias, eq(products.featuredImageId, medias.id))
      .where(whereClause)
      .orderBy(desc(products.createdAt))
      .limit(pageSize)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(products)
      .leftJoin(collections, eq(products.collectionId, collections.id))
      .where(whereClause),
  ]);

  const totalCount = Number(countRows[0]?.count ?? 0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(page, totalPages);

  return {
    rows: mapAdminProductRows(rows),
    totalCount,
    page: safePage,
    pageSize,
  };
}

/** Per-request dedupe only — avoids unstable_cache hangs on serverless DB. */
export const getAdminProductsList = cache(loadAdminProductsListFromDb);
