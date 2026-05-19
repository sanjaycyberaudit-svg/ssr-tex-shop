/**
 * Supabase deprecated direct host db.<ref>.supabase.co (often ENOTFOUND on Vercel).
 * Use pooler URI from Dashboard → Settings → Database → Connection string (port 6543).
 */
export function resolveDatabaseUrl(raw?: string): string {
  const url = (raw ?? process.env.DATABASE_URL ?? "").trim();
  if (!url) return url;

  const legacy = url.match(/@db\.([a-z0-9]+)\.supabase\.co/i);
  if (legacy) {
    const poolerOverride = process.env.SUPABASE_DB_POOLER_URL?.trim();
    if (poolerOverride) return poolerOverride;

    console.warn(
      `[db] DATABASE_URL uses deprecated host db.${legacy[1]}.supabase.co. ` +
        "Set pooler URI (postgresql://postgres.<ref>:...@aws-0-<region>.pooler.supabase.com:6543/postgres) " +
        "in Vercel → Environment Variables, or set SUPABASE_DB_POOLER_URL.",
    );
  }

  return url;
}
