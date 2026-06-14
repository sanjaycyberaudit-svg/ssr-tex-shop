import db from "@/lib/supabase/db";
import { collections, medias, products } from "@/lib/supabase/schema";
import { desc, eq, sql } from "drizzle-orm";
import { unstable_cache } from "next/cache";

export const ADMIN_PRODUCTS_LIST_TAG = "admin-products-list";
export const ADMIN_PRODUCTS_CACHE_SECONDS = 60;

export type AdminProductTableNode = {
  id: string;
  name: string;
  slug: string;
  rating: string;
  badge: string | null;
  price: string;
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

/** Uncached DB read — lean columns only (no HTML description blobs). */
export async function loadAdminProductsListFromDb(): Promise<
  AdminProductTableRow[]
> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      rating: products.rating,
      badge: products.badge,
      price: products.price,
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
    .orderBy(desc(products.createdAt));

  return rows.map((row) => ({
    node: {
      id: row.id,
      name: row.name,
      slug: row.slug,
      rating: row.rating,
      badge: row.badge,
      price: row.price,
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

const getAdminProductsListCachedInternal = unstable_cache(
  async () => loadAdminProductsListFromDb(),
  ["admin-products-list-v1"],
  {
    revalidate: ADMIN_PRODUCTS_CACHE_SECONDS,
    tags: [ADMIN_PRODUCTS_LIST_TAG],
  },
);

/** Cached full admin catalog — invalidated on every product write. */
export async function getAdminProductsList(): Promise<AdminProductTableRow[]> {
  return getAdminProductsListCachedInternal();
}

export async function getAdminProductsCount(): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(products);
  return Number(rows[0]?.count ?? 0);
}
