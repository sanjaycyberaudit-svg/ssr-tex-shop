import db from "@/lib/supabase/db";
import { collections, medias } from "@/lib/supabase/schema";
import { eq, ilike, or } from "drizzle-orm";

export type StorefrontCollectionMatch = {
  id: string;
  label: string;
  slug: string;
  featuredImage: {
    key: string;
    alt: string | null;
  };
};

/** Placeholder ID so GraphQL `in` filters stay valid when no collections match. */
export const NO_COLLECTION_MATCH_ID = "__no_collection_match__";

export function normalizeStorefrontSearchTerm(
  search: string | null | undefined,
): string | null {
  if (!search) return null;
  const term = search.replace(/^%|%$/g, "").trim();
  return term.length > 0 ? term : null;
}

export function toStorefrontSearchPattern(term: string): string {
  return `%${term}%`;
}

export async function findMatchingCollections(
  searchTerm: string,
): Promise<StorefrontCollectionMatch[]> {
  const pattern = toStorefrontSearchPattern(searchTerm);

  const rows = await db
    .select({
      id: collections.id,
      label: collections.label,
      slug: collections.slug,
      imageKey: medias.key,
      imageAlt: medias.alt,
    })
    .from(collections)
    .innerJoin(medias, eq(collections.featuredImageId, medias.id))
    .where(
      or(
        ilike(collections.label, pattern),
        ilike(collections.title, pattern),
        ilike(collections.slug, pattern),
        ilike(collections.description, pattern),
      ),
    )
    .orderBy(collections.order);

  return rows.map((row) => ({
    id: row.id,
    label: row.label,
    slug: row.slug,
    featuredImage: {
      key: row.imageKey,
      alt: row.imageAlt,
    },
  }));
}
