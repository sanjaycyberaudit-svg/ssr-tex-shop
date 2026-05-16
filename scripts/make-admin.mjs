/**
 * Set app_metadata.isAdmin (required for /admin and the Admin menu link).
 * Usage: node scripts/make-admin.mjs admin@sakthitextiles.com
 * Also run supabase/02-make-admin.sql for profiles.is_admin if you use SQL-only setup.
 */
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env.local");
const env = Object.fromEntries(
  readFileSync(envPath, "utf8")
    .split("\n")
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/make-admin.mjs <email>");
  process.exit(1);
}

const serviceKey = env.DATABASE_SERVICE_ROLE;
const url = env.NEXT_PUBLIC_SUPABASE_URL;
if (!serviceKey || !url) {
  console.error("Missing DATABASE_SERVICE_ROLE or NEXT_PUBLIC_SUPABASE_URL in .env.local");
  process.exit(1);
}

const headers = {
  apikey: serviceKey,
  Authorization: `Bearer ${serviceKey}`,
  "Content-Type": "application/json",
};

const listRes = await fetch(`${url}/auth/v1/admin/users`, { headers });
const list = await listRes.json();
const user = list.users?.find((u) => u.email === email);
if (!user) {
  console.error(`No auth user found for: ${email}`);
  process.exit(1);
}

const updateRes = await fetch(`${url}/auth/v1/admin/users/${user.id}`, {
  method: "PUT",
  headers,
  body: JSON.stringify({ app_metadata: { isAdmin: true } }),
});
if (!updateRes.ok) {
  console.error("Failed to set app_metadata.isAdmin:", await updateRes.text());
  process.exit(1);
}

console.log(`app_metadata.isAdmin set for ${email}.`);
console.log("Sign out and sign in again, then open http://localhost:3000/admin");
