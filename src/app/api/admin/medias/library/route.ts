import { getSessionUser, isAdminUser } from "@/lib/auth/admin";
import db from "@/lib/supabase/db";
import {
  apiSettings,
  collections,
  medias,
  orderLines,
  productMedias,
  products,
  testimonials,
} from "@/lib/supabase/schema";
import { and, eq, inArray, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const DELETE_SCHEMA = z.object({
  section: z.enum(["banner", "product"]),
  mediaIds: z.array(z.string().trim().min(1)).min(1),
});

type Section = "banner" | "product";

type MediaUsage = {
  bannerSlideCount: number;
  productCount: number;
  collectionCount: number;
  testimonialCount: number;
  productIds: string[];
  section: Section;
};

function parseBannerMediaIds(settingValue: unknown): Set<string> {
  const value = (settingValue ?? {}) as Record<string, unknown>;
  const slides = Array.isArray(value.slides) ? value.slides : [];
  const ids = slides
    .map((slide) =>
      String((slide as Record<string, unknown>).imageMediaId ?? "").trim(),
    )
    .filter(Boolean);
  return new Set(ids);
}

async function ensureAdmin() {
  const user = await getSessionUser();
  const admin = await isAdminUser(user);
  if (!user || !admin) return null;
  return user;
}

async function loadUsageForMediaIds(mediaIds: string[]) {
  const [
    bannerSetting,
    productRows,
    productMediaRows,
    collectionRows,
    testimonialRows,
  ] = await Promise.all([
    db.query.apiSettings.findFirst({
      where: eq(apiSettings.key, "home_banner_slides"),
    }),
    db
      .select({ productId: products.id, mediaId: products.featuredImageId })
      .from(products)
      .where(inArray(products.featuredImageId, mediaIds)),
    db
      .select({
        productId: productMedias.productId,
        mediaId: productMedias.mediaId,
      })
      .from(productMedias)
      .where(inArray(productMedias.mediaId, mediaIds)),
    db
      .select({ mediaId: collections.featuredImageId })
      .from(collections)
      .where(inArray(collections.featuredImageId, mediaIds)),
    db
      .select({ mediaId: testimonials.featuredImageId })
      .from(testimonials)
      .where(
        and(
          isNotNull(testimonials.featuredImageId),
          inArray(testimonials.featuredImageId, mediaIds),
        ),
      ),
  ]);

  const bannerMediaIds = parseBannerMediaIds(bannerSetting?.value);
  const bannerSlideCountMap = new Map<string, number>();
  const slides = Array.isArray(
    (bannerSetting?.value as Record<string, unknown>)?.slides,
  )
    ? ((bannerSetting?.value as Record<string, unknown>).slides as unknown[]) ??
      []
    : [];
  for (const slide of slides) {
    const id = String(
      (slide as Record<string, unknown>).imageMediaId ?? "",
    ).trim();
    if (!id) continue;
    bannerSlideCountMap.set(id, (bannerSlideCountMap.get(id) ?? 0) + 1);
  }

  const productIdsByMedia = new Map<string, Set<string>>();
  for (const row of productRows) {
    const set = productIdsByMedia.get(row.mediaId) ?? new Set<string>();
    set.add(row.productId);
    productIdsByMedia.set(row.mediaId, set);
  }
  for (const row of productMediaRows) {
    const set = productIdsByMedia.get(row.mediaId) ?? new Set<string>();
    set.add(row.productId);
    productIdsByMedia.set(row.mediaId, set);
  }

  const collectionCountMap = new Map<string, number>();
  for (const row of collectionRows) {
    collectionCountMap.set(
      row.mediaId,
      (collectionCountMap.get(row.mediaId) ?? 0) + 1,
    );
  }

  const testimonialCountMap = new Map<string, number>();
  for (const row of testimonialRows) {
    if (!row.mediaId) continue;
    testimonialCountMap.set(
      row.mediaId,
      (testimonialCountMap.get(row.mediaId) ?? 0) + 1,
    );
  }

  const usageByMedia = new Map<string, MediaUsage>();
  for (const mediaId of mediaIds) {
    const productIds = [
      ...(productIdsByMedia.get(mediaId) ?? new Set<string>()),
    ];
    usageByMedia.set(mediaId, {
      bannerSlideCount: bannerSlideCountMap.get(mediaId) ?? 0,
      productCount: productIds.length,
      collectionCount: collectionCountMap.get(mediaId) ?? 0,
      testimonialCount: testimonialCountMap.get(mediaId) ?? 0,
      productIds,
      section: bannerMediaIds.has(mediaId) ? "banner" : "product",
    });
  }

  return { usageByMedia, bannerSetting };
}

export async function GET() {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const mediaRows = await db
    .select({
      id: medias.id,
      key: medias.key,
      alt: medias.alt,
      createdAt: medias.createdAt,
    })
    .from(medias)
    .orderBy(medias.createdAt);

  const mediaIds = mediaRows.map((row) => row.id);
  const { usageByMedia } = await loadUsageForMediaIds(mediaIds);

  return NextResponse.json({
    medias: mediaRows.reverse().map((row) => {
      const usage = usageByMedia.get(row.id);
      return {
        ...row,
        section: usage?.section ?? "product",
        usage: {
          bannerSlideCount: usage?.bannerSlideCount ?? 0,
          productCount: usage?.productCount ?? 0,
          collectionCount: usage?.collectionCount ?? 0,
          testimonialCount: usage?.testimonialCount ?? 0,
        },
      };
    }),
  });
}

export async function DELETE(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = DELETE_SCHEMA.safeParse(payload);
  if (!parsed.success) {
    const parseError = parsed as z.SafeParseError<
      z.infer<typeof DELETE_SCHEMA>
    >;
    return NextResponse.json(
      { message: "Invalid delete request", error: parseError.error.flatten() },
      { status: 400 },
    );
  }

  const mediaIds = [...new Set(parsed.data.mediaIds)];
  const section = parsed.data.section;
  const { usageByMedia, bannerSetting } = await loadUsageForMediaIds(mediaIds);

  const productIdsForOrderCheck = new Set<string>();
  for (const mediaId of mediaIds) {
    const usage = usageByMedia.get(mediaId);
    if (!usage) continue;
    if (section === "product" && usage.productIds.length === 1) {
      productIdsForOrderCheck.add(usage.productIds[0]);
    }
  }

  const orderLineRows =
    productIdsForOrderCheck.size > 0
      ? await db
          .select({ productId: orderLines.productId })
          .from(orderLines)
          .where(inArray(orderLines.productId, [...productIdsForOrderCheck]))
      : [];
  const hasOrderLinesByProduct = new Set(
    orderLineRows.map((row) => row.productId),
  );

  const deletedMediaIds: string[] = [];
  const deletedProductIds: string[] = [];
  const blocked: { mediaId: string; reason: string }[] = [];

  for (const mediaId of mediaIds) {
    const usage = usageByMedia.get(mediaId);
    if (!usage) {
      blocked.push({ mediaId, reason: "Media not found." });
      continue;
    }

    if (usage.section !== section) {
      blocked.push({
        mediaId,
        reason: `Media belongs to ${usage.section} section.`,
      });
      continue;
    }

    if (usage.collectionCount > 0 || usage.testimonialCount > 0) {
      blocked.push({
        mediaId,
        reason:
          "Media is used by collections/testimonials. Remove those references first.",
      });
      continue;
    }

    if (section === "banner") {
      if (usage.productCount > 0) {
        blocked.push({
          mediaId,
          reason: "Media is linked to product(s), cannot treat as banner-only.",
        });
        continue;
      }

      await db.delete(medias).where(eq(medias.id, mediaId));
      deletedMediaIds.push(mediaId);
      continue;
    }

    // Product section rules
    if (usage.bannerSlideCount > 0) {
      blocked.push({
        mediaId,
        reason: "Media is linked to home banner slides.",
      });
      continue;
    }

    if (usage.productCount === 0) {
      await db.delete(medias).where(eq(medias.id, mediaId));
      deletedMediaIds.push(mediaId);
      continue;
    }

    if (usage.productCount > 1) {
      blocked.push({
        mediaId,
        reason:
          "Media is used by multiple products; cannot auto-delete safely.",
      });
      continue;
    }

    const productId = usage.productIds[0];
    if (hasOrderLinesByProduct.has(productId)) {
      blocked.push({
        mediaId,
        reason:
          "Product has order history; auto-delete is blocked for data integrity.",
      });
      continue;
    }

    await db.delete(products).where(eq(products.id, productId));
    await db.delete(medias).where(eq(medias.id, mediaId));
    deletedProductIds.push(productId);
    deletedMediaIds.push(mediaId);
  }

  if (section === "banner" && deletedMediaIds.length > 0 && bannerSetting) {
    const value = (bannerSetting.value ?? {}) as Record<string, unknown>;
    const slides = Array.isArray(value.slides) ? value.slides : [];
    const filteredSlides = slides.filter((slide) => {
      const imageMediaId = String(
        (slide as Record<string, unknown>).imageMediaId ?? "",
      ).trim();
      return !deletedMediaIds.includes(imageMediaId);
    });

    await db
      .update(apiSettings)
      .set({
        value: { ...value, slides: filteredSlides },
        updatedAt: new Date().toISOString(),
        updatedBy: user.id,
      })
      .where(eq(apiSettings.key, "home_banner_slides"));
  }

  revalidatePath("/admin/medias");
  revalidatePath("/", "layout");

  return NextResponse.json({
    deletedMediaIds,
    deletedProductIds,
    blocked,
  });
}
