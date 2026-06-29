/**
 * Fix collection + product images: replace broken Unsplash / old furniture placeholders.
 * Usage: node scripts/fix-category-images.mjs
 */
import { createId } from "@paralleldrive/cuid2";
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

const PLACEHOLDER_IDS = [
  13031587, 36114637, 29026115, 1926769, 8681840, 1192609, 3754682, 5868277,
  7319307, 8894332, 1036623, 3762802,
];

function pexelsUrl(id) {
  return `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=900`;
}

function loadEnv() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) throw new Error("Missing .env.local");
  const env = {};
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

async function main() {
  const env = loadEnv();
  const sb = createClient(
    `https://${env.NEXT_PUBLIC_SUPABASE_PROJECT_REF}.supabase.co`,
    env.DATABASE_SERVICE_ROLE,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const { data: collections, error: colErr } = await sb
    .from("collections")
    .select("id,label,featured_image_id")
    .order("order", { ascending: true });
  if (colErr) throw colErr;

  const sareeMedias = [];

  for (let i = 0; i < collections.length; i++) {
    const col = collections[i];
    const url = pexelsUrl(PLACEHOLDER_IDS[i % PLACEHOLDER_IDS.length]);
    const alt = `${col.label} — SRI SAI RAGHAVENDRA TEX`;

    let mediaId = col.featured_image_id;
    if (mediaId) {
      await sb.from("medias").update({ key: url, alt }).eq("id", mediaId);
    } else {
      const { data: media, error } = await sb
        .from("medias")
        .insert({ key: url, alt })
        .select("id,key")
        .single();
      if (error) throw error;
      mediaId = media.id;
      await sb
        .from("collections")
        .update({ featured_image_id: mediaId })
        .eq("id", col.id);
    }

    sareeMedias.push({ id: mediaId, key: url, alt });
    console.log(`Collection: ${col.label}`);
  }

  const { data: products, error: prodErr } = await sb
    .from("products")
    .select("id,name,featured_image_id")
    .order("name");
  if (prodErr) throw prodErr;

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const src = sareeMedias[i % sareeMedias.length] ?? sareeMedias[0];
    let mediaId = product.featured_image_id;

    const oldKeys = [
      "public/bathroom-planning.jpg",
      "public/kitchen-planning.jpg",
      "public/living-room-planning.jpg",
      "public/bedroom-planning.jpg",
    ];

    const { data: currentMedia } = mediaId
      ? await sb.from("medias").select("key").eq("id", mediaId).maybeSingle()
      : { data: null };

    const needsReplace =
      !mediaId ||
      oldKeys.includes(currentMedia?.key) ||
      currentMedia?.key?.includes("unsplash.com");

    if (needsReplace) {
      if (mediaId && currentMedia) {
        await sb
          .from("medias")
          .update({ key: src.key, alt: `${product.name} — saree model` })
          .eq("id", mediaId);
      } else {
        const newId = createId();
        const { error } = await sb.from("medias").insert({
          id: newId,
          key: src.key,
          alt: `${product.name} — saree model`,
        });
        if (error) throw error;
        mediaId = newId;
      }
    }

    await sb
      .from("products")
      .update({ featured_image_id: mediaId, images: [src.key] })
      .eq("id", product.id);

    await sb.from("product_medias").delete().eq("product_id", product.id);
    await sb.from("product_medias").insert({
      product_id: product.id,
      media_id: mediaId,
      priority: 0,
    });

    console.log(`Product: ${product.name}`);
  }

  const { data: stale } = await sb
    .from("medias")
    .select("id,key")
    .or(
      "key.like.public/bathroom-planning%,key.like.public/kitchen-planning%,key.like.public/living-room-planning%,key.like.public/bedroom-planning%,key.like.%unsplash.com%",
    );

  for (const row of stale ?? []) {
    const { count } = await sb
      .from("collections")
      .select("id", { count: "exact", head: true })
      .eq("featured_image_id", row.id);
    const { count: pCount } = await sb
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("featured_image_id", row.id);
    if ((count ?? 0) === 0 && (pCount ?? 0) === 0) {
      await sb.from("medias").delete().eq("id", row.id);
      console.log(`Removed stale media: ${row.key}`);
    }
  }

  console.log("\nDone. Refresh https://ssr-tex-shop.vercel.app (Ctrl+Shift+R).");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
