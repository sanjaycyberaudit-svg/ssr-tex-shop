import postgres from "postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.local") });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL in .env.local");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

const statements = [
  `CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql`,
  `GRANT USAGE ON SCHEMA public TO anon, authenticated`,
  `GRANT USAGE ON SCHEMA graphql TO anon, authenticated, service_role`,
  `GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated`,
  `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated`,
];

const policySql = [
  `DROP POLICY IF EXISTS "public_read_products" ON products`,
  `DROP POLICY IF EXISTS "public_read_collections" ON collections`,
  `DROP POLICY IF EXISTS "public_read_medias" ON medias`,
  `CREATE POLICY "public_read_products" ON products FOR SELECT TO anon, authenticated USING (true)`,
  `CREATE POLICY "public_read_collections" ON collections FOR SELECT TO anon, authenticated USING (true)`,
  `CREATE POLICY "public_read_medias" ON medias FOR SELECT TO anon, authenticated USING (true)`,
  `DROP POLICY IF EXISTS "public_read_testimonials" ON testimonials`,
  `CREATE POLICY "public_read_testimonials" ON testimonials FOR SELECT TO anon, authenticated USING (is_published = true)`,
  `DROP POLICY IF EXISTS "carts_all_own" ON carts`,
  `CREATE POLICY "carts_all_own" ON carts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "wishlist_all_own" ON wishlist`,
  `CREATE POLICY "wishlist_all_own" ON wishlist FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`,
  `DROP POLICY IF EXISTS "address_select_own" ON address`,
  `CREATE POLICY "address_select_own" ON address FOR SELECT TO authenticated USING (auth.uid() = "userProfileId")`,
  `DROP POLICY IF EXISTS "address_insert_own" ON address`,
  `CREATE POLICY "address_insert_own" ON address FOR INSERT TO authenticated WITH CHECK (auth.uid() = "userProfileId")`,
  `DROP POLICY IF EXISTS "address_update_own" ON address`,
  `CREATE POLICY "address_update_own" ON address FOR UPDATE TO authenticated USING (auth.uid() = "userProfileId") WITH CHECK (auth.uid() = "userProfileId")`,
  `DROP POLICY IF EXISTS "address_delete_own" ON address`,
  `CREATE POLICY "address_delete_own" ON address FOR DELETE TO authenticated USING (auth.uid() = "userProfileId")`,
  `GRANT SELECT, INSERT, UPDATE, DELETE ON address TO authenticated`,
];

try {
  for (const q of statements) {
    await sql.unsafe(q);
    console.log("OK:", q.slice(0, 60) + "...");
  }
  for (const q of policySql) {
    await sql.unsafe(q);
    console.log("OK:", q.slice(0, 55) + "...");
  }
  const [{ count }] = await sql`SELECT count(*)::int as count FROM products`;
  console.log("Products in database:", count);
  console.log("GraphQL setup complete.");
} catch (e) {
  console.error("Setup failed:", e.message);
  process.exit(1);
} finally {
  await sql.end();
}
