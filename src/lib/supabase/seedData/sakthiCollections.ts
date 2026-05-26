import { eq, inArray } from "drizzle-orm";
import db from "../db";
import * as schema from "../schema";
import { slugify } from "@/lib/utils";

/** Sakthi Textile saree categories (homepage carousel + /collections/[slug]) */
export const SAKTHI_COLLECTION_LABELS = [
  "Softie Sarees",
  "Kanjivaram Wedding Sarees",
  "Soft Silk Sarees",
  "Banaras Tissue Silk Sarees",
  "Traditional Silk Sarees",
  "Kubera Pattu Sarees",
  "Wedding Collections",
  "Cotton Sarees",
  "Silk Cotton Sarees",
  "Fancy Silk Sarees",
  "Mysore silk",
  "Space silk saree",
  "Fancy sarees",
  "celebrity inspired saree",
] as const;

const PLACEHOLDER_IMAGE_KEYS = [
  "public/bathroom-planning.jpg",
  "public/kitchen-planning.jpg",
  "public/living-room-planning.jpg",
  "public/bedroom-planning.jpg",
];

const DEMO_COLLECTION_SLUGS = [
  "bathroom",
  "kitchen-planning",
  "living-room-planning",
  "Bedroom-planning",
];

function collectionCopy(label: string) {
  return {
    title: label,
    description: `Explore our ${label} at Sakthi Textile — premium sarees for every occasion.`,
  };
}

export type SeedSakthiCollectionsOptions = {
  /** Remove old demo furniture collections (Bathroom, Kitchen, etc.) */
  removeDemo?: boolean;
};

export default async function seedSakthiCollections(
  options: SeedSakthiCollectionsOptions = {},
) {
  const { removeDemo = false } = options;

  if (removeDemo) {
    const deleted = await db
      .delete(schema.collections)
      .where(inArray(schema.collections.slug, DEMO_COLLECTION_SLUGS))
      .returning({ slug: schema.collections.slug });
    if (deleted.length) {
      console.log(
        `Removed ${deleted.length} demo collection(s): ${deleted.map((c) => c.slug).join(", ")}`,
      );
    }
  }

  let created = 0;
  let updated = 0;

  for (let i = 0; i < SAKTHI_COLLECTION_LABELS.length; i++) {
    const label = SAKTHI_COLLECTION_LABELS[i];
    const slug = slugify(label);
    const { title, description } = collectionCopy(label);
    const order = i + 1;
    const imageKey =
      PLACEHOLDER_IMAGE_KEYS[i % PLACEHOLDER_IMAGE_KEYS.length] ??
      PLACEHOLDER_IMAGE_KEYS[0];

    const existing = await db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.slug, slug))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(schema.collections)
        .set({ label, title, description, order })
        .where(eq(schema.collections.id, existing[0].id));
      updated++;
      console.log(`Updated: ${label} → /collections/${slug}`);
      continue;
    }

    const [media] = await db
      .insert(schema.medias)
      .values({
        key: imageKey,
        alt: `${slug}-category`,
      })
      .returning();

    if (!media) {
      throw new Error(`Failed to create media for ${label}`);
    }

    await db.insert(schema.collections).values({
      label,
      slug,
      title,
      description,
      order,
      featuredImageId: media.id,
    });

    created++;
    console.log(`Created: ${label} → /collections/${slug}`);
  }

  console.log(
    `\nDone. ${created} created, ${updated} updated (${SAKTHI_COLLECTION_LABELS.length} categories total).`,
  );
  console.log(
    "Replace placeholder images in Admin → Collections, or re-run after uploading to S3.",
  );
}
