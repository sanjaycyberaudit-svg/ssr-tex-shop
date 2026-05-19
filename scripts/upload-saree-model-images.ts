/**
 * Upload saree model photos from a local folder to Supabase Storage + DB,
 * assign to all collections and products, remove old placeholder media rows.
 *
 * Usage:
 *   npm run db:upload-saree-images
 *   npm run db:upload-saree-images -- "C:\path\to\Saree model"
 */
import { readdir, readFile } from "fs/promises";
import { join, basename } from "path";
import { asc, eq, like, or } from "drizzle-orm";
import { nanoid } from "nanoid";
import sharp from "sharp";
import db from "../src/lib/supabase/db";
import * as schema from "../src/lib/supabase/schema";
import { createServiceRoleClient } from "../src/lib/supabase/service";
import {
  MAX_IMAGE_WIDTH,
  WEBP_QUALITY,
} from "../src/lib/image/processUpload";
import { SUPABASE_MEDIA_BUCKET } from "../src/lib/utils";

const DEFAULT_DIR = "C:\\Users\\sanjay_arun2\\Downloads\\Saree model";

const PLACEHOLDER_KEY_PATTERNS = [
  "public/bathroom-planning%",
  "public/kitchen-planning%",
  "public/living-room-planning%",
  "public/bedroom-planning%",
];

const supabase = createServiceRoleClient();

async function ensureMediaBucket() {
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) throw listError;

  if (buckets?.some((b) => b.name === SUPABASE_MEDIA_BUCKET)) return;

  const { error } = await supabase.storage.createBucket(SUPABASE_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: 15 * 1024 * 1024,
  });
  if (error && !error.message.includes("already exists")) {
    throw error;
  }
  console.log(`Created public storage bucket: ${SUPABASE_MEDIA_BUCKET}`);
}

async function processFile(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
}

async function uploadToSupabase(buffer: Buffer, alt: string) {
  const storagePath = `sakthi/saree-${nanoid()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType: "image/webp",
      cacheControl: "31536000",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const [media] = await db
    .insert(schema.medias)
    .values({ key: storagePath, alt })
    .returning();

  if (!media) throw new Error(`Failed to insert media for ${alt}`);
  return media;
}

async function loadLocalImages(dir: string) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && /\.(jpe?g|png|webp)$/i.test(e.name))
    .map((e) => join(dir, e.name))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    throw new Error(`No images found in: ${dir}`);
  }

  await ensureMediaBucket();

  const uploaded: { id: string; key: string; alt: string }[] = [];

  for (const filePath of files) {
    const name = basename(filePath);
    const raw = await readFile(filePath);
    const buffer = await processFile(raw);
    const media = await uploadToSupabase(buffer, `Sakthi saree model — ${name}`);
    uploaded.push(media);
    console.log(`Uploaded: ${name} → ${media.key}`);
  }

  return uploaded;
}

async function main() {
  const dir = process.argv[2] || DEFAULT_DIR;
  console.log(`Reading images from:\n  ${dir}\n`);

  const newMedias = await loadLocalImages(dir);
  console.log(`\n${newMedias.length} images in Supabase Storage + medias table.\n`);

  const allCollections = await db
    .select()
    .from(schema.collections)
    .orderBy(asc(schema.collections.order), asc(schema.collections.label));

  if (allCollections.length === 0) {
    console.log("No collections — run: npm run db:seed-collections");
  } else {
    for (let i = 0; i < allCollections.length; i++) {
      const col = allCollections[i];
      const media = newMedias[i % newMedias.length];
      await db
        .update(schema.collections)
        .set({ featuredImageId: media.id })
        .where(eq(schema.collections.id, col.id));
      console.log(`Collection: ${col.label} → ${media.key}`);
    }
  }

  const allProducts = await db
    .select()
    .from(schema.products)
    .orderBy(asc(schema.products.name));

  if (allProducts.length === 0) {
    console.log("\nNo products in database — add products in admin first.");
  } else {
    for (let i = 0; i < allProducts.length; i++) {
      const product = allProducts[i];
      const media = newMedias[i % newMedias.length];

      await db
        .delete(schema.productMedias)
        .where(eq(schema.productMedias.productId, product.id));

      await db.insert(schema.productMedias).values({
        productId: product.id,
        mediaId: media.id,
        priority: 0,
      });

      await db
        .update(schema.products)
        .set({
          featuredImageId: media.id,
          images: [media.key],
        })
        .where(eq(schema.products.id, product.id));

      console.log(`Product: ${product.name} → ${media.key}`);
    }
  }

  const placeholderMedias = await db
    .select()
    .from(schema.medias)
    .where(
      or(
        ...PLACEHOLDER_KEY_PATTERNS.map((pattern) =>
          like(schema.medias.key, pattern),
        ),
      ),
    );

  const newIds = new Set(newMedias.map((m) => m.id));
  let deleted = 0;

  for (const old of placeholderMedias) {
    if (newIds.has(old.id)) continue;
    try {
      await db.delete(schema.medias).where(eq(schema.medias.id, old.id));
      console.log(`Removed placeholder media: ${old.key}`);
      deleted++;
    } catch {
      console.log(`Skipped delete (still referenced): ${old.key}`);
    }
  }

  console.log(
    `\nDone. ${newMedias.length} images assigned to ${allCollections.length} collections and ${allProducts.length} products.`,
  );
  if (deleted) console.log(`Removed ${deleted} old placeholder media row(s).`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
