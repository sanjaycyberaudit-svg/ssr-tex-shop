/**
 * Configure Supabase Auth redirect URLs and Google OAuth via Management API.
 *
 * Required in .env.local (or environment):
 *   SUPABASE_ACCESS_TOKEN  — https://supabase.com/dashboard/account/tokens
 *   GOOGLE_CLIENT_ID       — Google Cloud OAuth Web client
 *   GOOGLE_CLIENT_SECRET   — Google Cloud OAuth secret
 *
 * Optional:
 *   SUPABASE_SITE_URL      — default https://ssr-tex-shop.vercel.app
 *
 * Run: node scripts/setup-auth-config.mjs
 */
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: join(root, ".env.local") });

const projectRef = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF;
const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const siteUrl =
  process.env.SUPABASE_SITE_URL?.trim() ||
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  "https://ssr-tex-shop.vercel.app";

const redirectAllowList = [
  "http://localhost:3000/auth/callback",
  "http://127.0.0.1:3000/auth/callback",
  "https://ssr-tex-shop.vercel.app/auth/callback",
  siteUrl.endsWith("/auth/callback") ? siteUrl : `${siteUrl.replace(/\/$/, "")}/auth/callback`,
]
  .filter(Boolean)
  .filter((url, i, arr) => arr.indexOf(url) === i)
  .join(",");

function missing(label) {
  console.error(`Missing ${label}. Add it to .env.local and run again.`);
  process.exit(1);
}

if (!projectRef) missing("NEXT_PUBLIC_SUPABASE_PROJECT_REF");
if (!accessToken) missing("SUPABASE_ACCESS_TOKEN");
if (!googleClientId) missing("GOOGLE_CLIENT_ID");
if (!googleClientSecret) missing("GOOGLE_CLIENT_SECRET");

const apiBase = "https://api.supabase.com/v1";

async function api(path, options = {}) {
  const res = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }
  if (!res.ok) {
    throw new Error(`${options.method ?? "GET"} ${path} → ${res.status}: ${text}`);
  }
  return body;
}

console.log("Configuring Supabase Auth for project:", projectRef);
console.log("Site URL:", siteUrl);
console.log("Redirect allow list:", redirectAllowList);

const payload = {
  site_url: siteUrl.replace(/\/$/, ""),
  uri_allow_list: redirectAllowList,
  external_google_enabled: true,
  external_google_client_id: googleClientId,
  external_google_secret: googleClientSecret,
  external_email_enabled: true,
  disable_signup: false,
};

const updated = await api(`/projects/${projectRef}/config/auth`, {
  method: "PATCH",
  body: JSON.stringify(payload),
});

console.log("\nAuth config updated.");
console.log("  Google enabled:", updated.external_google_enabled ?? true);
console.log("  Email enabled:", updated.external_email_enabled ?? true);
console.log("  Site URL:", updated.site_url ?? siteUrl);
console.log("\nGoogle Cloud Console — Authorized redirect URI (must match exactly):");
console.log(
  `  https://${projectRef}.supabase.co/auth/v1/callback`,
);
console.log("\nDone. Test at /sign-in → Continue with Google.");
