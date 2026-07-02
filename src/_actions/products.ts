"use server";

import db from "@/lib/supabase/db";
import { InsertProducts, productMedias, products } from "@/lib/supabase/schema";
import { requireAdminActionUser } from "@/lib/auth/require-admin";
import { invalidateStorefrontCache } from "@/lib/cache/invalidate-storefront";
import { eq, inArray, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";

function revalidateProductCatalogPaths() {
  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/featured");
  revalidatePath("/shop");
  revalidatePath("/collections");
}

type SearchProductsActionProps = {
  query: string;
  limit?: number;
  collections?: string;
  sort?: string;
};

export const createProductAction = async (product: InsertProducts) => {
  await requireAdminActionUser();
  createInsertSchema(products).parse(product);
  const data = await db.insert(products).values(product).returning();
  revalidateProductCatalogPaths();
  await invalidateStorefrontCache();
  return data;
};

export const updateProductAction = async (
  productId: string,
  product: InsertProducts,
) => {
  await requireAdminActionUser();
  createInsertSchema(products).parse(product);
  const insertedProduct = await db
    .update(products)
    .set(product)
    .where(eq(products.id, productId))
    .returning();

  revalidateProductCatalogPaths();
  await invalidateStorefrontCache();
  return insertedProduct;
};

export const getProductsByIds = async (productIds: string[]) => {
  return await db
    .select()
    .from(products)
    .where(inArray(products.id, productIds));
};

type DraftSourceMedia = {
  mediaId: string;
  originalFileName: string;
};

export type BulkDraftSharedData = {
  baseName?: string;
  description?: string;
  isDraft?: boolean;
  collectionId?: string | null;
  badge?: InsertProducts["badge"] | null;
  rating?: string;
  price?: string;
  tags?: string[];
  stock?: number;
};

export type BulkDraftCreateResult = {
  id: string;
  productCode: string;
  name: string;
  slug: string;
};

const PRODUCT_CODE_LOCK_ID = 873214;

function getFileNameBase(fileName: string) {
  const cleaned = fileName.replace(/\.[^/.]+$/, "").trim();
  return cleaned || "Product";
}

export async function createDraftProductsFromMedia(
  mediaItems: DraftSourceMedia[],
  shared?: BulkDraftSharedData,
): Promise<BulkDraftCreateResult[]> {
  await requireAdminActionUser();
  if (mediaItems.length === 0) return [];

  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(${PRODUCT_CODE_LOCK_ID})`,
    );

    const lastCodeRows = await tx.execute<{ product_code: string | null }>(
      sql`select product_code
          from products
          where product_code like 'ST%'
          order by product_code desc
          limit 1`,
    );
    const lastCode = lastCodeRows[0]?.product_code ?? null;
    const lastNumber = Number.parseInt(lastCode?.replace(/^ST/, "") ?? "0", 10);
    const start = Number.isFinite(lastNumber) ? lastNumber : 0;

    const createdProducts: BulkDraftCreateResult[] = [];

    for (let index = 0; index < mediaItems.length; index += 1) {
      const currentNumber = start + index + 1;
      const productCode = `ST${String(currentNumber).padStart(6, "0")}`;
      const slug = slugify(`product-${productCode}`);
      const fileNameBase = getFileNameBase(mediaItems[index].originalFileName);
      const nameBase = (shared?.baseName || fileNameBase).trim();
      const productName = `${nameBase} ${productCode}`;

      const [created] = await tx
        .insert(products)
        .values({
          name: productName,
          slug,
          productCode,
          isDraft: shared?.isDraft ?? true,
          featuredImageId: mediaItems[index].mediaId,
          description: shared?.description ?? "",
          collectionId: shared?.collectionId ?? null,
          badge: shared?.badge ?? null,
          rating: shared?.rating ?? "4",
          price: shared?.price ?? "0",
          tags: shared?.tags ?? [],
          stock: Math.max(0, Math.round(shared?.stock ?? 0)),
        })
        .returning({
          id: products.id,
          name: products.name,
          slug: products.slug,
          productCode: products.productCode,
        });

      await tx.insert(productMedias).values({
        productId: created.id,
        mediaId: mediaItems[index].mediaId,
        priority: 1,
      });

      createdProducts.push({
        id: created.id,
        name: created.name,
        slug: created.slug,
        productCode: created.productCode ?? productCode,
      });
    }

    revalidateProductCatalogPaths();
    await invalidateStorefrontCache();
    return createdProducts;
  });
}
