/** Canonical storefront origin(s) used for auth redirects and SEO. */
const DEFAULT_PRODUCTION_ORIGIN = "https://sairaghavendratex.com";

function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  return trimmed.includes("://") ? trimmed : `https://${trimmed}`;
}

/** Primary site origin from env (production custom domain). */
export function getCanonicalSiteOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv && !fromEnv.includes("localhost")) {
    return normalizeOrigin(fromEnv);
  }
  return DEFAULT_PRODUCTION_ORIGIN;
}

/** All origins allowed to receive /auth/callback after OAuth (must match Supabase dashboard). */
export function getAuthCallbackUrls(): string[] {
  const canonical = getCanonicalSiteOrigin();
  const urls = new Set<string>([
    `${canonical}/auth/callback`,
    "http://localhost:3000/auth/callback",
    "http://127.0.0.1:3000/auth/callback",
    "https://ssr-tex-shop.vercel.app/auth/callback",
  ]);

  try {
    const host = new URL(canonical).host;
    if (host.startsWith("www.")) {
      urls.add(`https://${host.replace(/^www\./, "")}/auth/callback`);
    } else {
      urls.add(`https://www.${host}/auth/callback`);
    }
  } catch {
    /* ignore invalid canonical URL */
  }

  return [...urls];
}
