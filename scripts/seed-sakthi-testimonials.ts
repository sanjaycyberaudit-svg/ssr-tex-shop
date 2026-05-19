/**
 * Seed homepage testimonials (text + video). Safe to re-run.
 * Run: npm run db:seed-testimonials
 */
import postgres from "postgres";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.local") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

type Row = {
  id: string;
  kind: "text" | "video";
  customer_name: string;
  location: string;
  quote: string | null;
  video_url: string | null;
  rating: number;
  featured_image_id: string | null;
  order: number;
};

const rows: Row[] = [
  {
    id: "t-v1",
    kind: "video",
    customer_name: "Anitha R.",
    location: "Erode",
    quote: "Watch our in-store saree shopping experience at Sakthi Textile.",
    video_url: "https://www.youtube.com/watch?v=LXb3EKWsInQ",
    rating: 5,
    featured_image_id: null,
    order: 10,
  },
  {
    id: "t1",
    kind: "text",
    customer_name: "Priya S.",
    location: "Salem",
    quote:
      "Beautiful Kanchi sarees and honest pricing. The silk quality is excellent — my go-to shop for festivals.",
    video_url: null,
    rating: 5,
    featured_image_id: "m1",
    order: 8,
  },
  {
    id: "t2",
    kind: "text",
    customer_name: "Lakshmi R.",
    location: "Coimbatore",
    quote:
      "Ordered cotton sarees online — delivery was quick and the colours matched the photos. Very happy!",
    video_url: null,
    rating: 5,
    featured_image_id: "m2",
    order: 7,
  },
  {
    id: "t3",
    kind: "text",
    customer_name: "Meena K.",
    location: "Chennai",
    quote:
      "Staff helped me pick the right saree for a wedding. Wholesale rates are fair and the collection is huge.",
    video_url: null,
    rating: 5,
    featured_image_id: "m3",
    order: 6,
  },
  {
    id: "t4",
    kind: "text",
    customer_name: "Divya M.",
    location: "Bengaluru",
    quote:
      "Semi-silk and soft silk range is outstanding. They packed the saree carefully for courier — no damage at all.",
    video_url: null,
    rating: 5,
    featured_image_id: "m4",
    order: 5,
  },
  {
    id: "t-v2",
    kind: "video",
    customer_name: "Kavitha P.",
    location: "Salem",
    quote: "Customer shares her favourite festival saree pick from our store.",
    video_url: "https://www.youtube.com/watch?v=ScMzIvxBSi4",
    rating: 5,
    featured_image_id: null,
    order: 4,
  },
];

async function main() {
  try {
    const medias =
      await sql<{ id: string }[]>`SELECT id FROM medias WHERE id IN ('m1','m2','m3','m4')`;
    const mediaIds = new Set(medias.map((m) => m.id));
    console.log(
      "Medias found:",
      [...mediaIds].join(", ") || "(none — text cards use gradient)",
    );

    for (const row of rows) {
      const imageId =
        row.featured_image_id && mediaIds.has(row.featured_image_id)
          ? row.featured_image_id
          : null;

      await sql`
        INSERT INTO testimonials (
          id, kind, customer_name, location, quote, video_url,
          rating, featured_image_id, is_published, "order"
        ) VALUES (
          ${row.id},
          ${row.kind},
          ${row.customer_name},
          ${row.location},
          ${row.quote},
          ${row.video_url},
          ${row.rating},
          ${imageId},
          true,
          ${row.order}
        )
        ON CONFLICT (id) DO UPDATE SET
          kind = EXCLUDED.kind,
          customer_name = EXCLUDED.customer_name,
          location = EXCLUDED.location,
          quote = EXCLUDED.quote,
          video_url = EXCLUDED.video_url,
          rating = EXCLUDED.rating,
          featured_image_id = EXCLUDED.featured_image_id,
          is_published = EXCLUDED.is_published,
          "order" = EXCLUDED."order"
      `;
      console.log("OK:", row.kind, row.customer_name);
    }

    const [{ count }] =
      await sql`SELECT count(*)::int AS count FROM testimonials WHERE is_published = true`;
    console.log("Published testimonials:", count);
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();
