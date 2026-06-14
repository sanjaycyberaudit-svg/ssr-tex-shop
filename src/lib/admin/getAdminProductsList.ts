import db from "@/lib/supabase/db";
import { collections, medias, products } from "@/lib/supabase/schema";
import { desc, eq } from "drizzle-orm";
import { cache } from "react";

export const ADMIN_PRODUCTS_LIST_TAG = "admin-products-list";

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

/** Map joined DB rows into admin table shape. */
function mapAdminProductRows(
  rows: Array<{
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

  return mapAdminProductRows(rows);
}

/** Per-request dedupe only — avoids unstable_cache hangs on serverless DB. */
export const getAdminProductsList = cache(loadAdminProductsListFromDb);
