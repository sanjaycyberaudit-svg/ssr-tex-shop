import type { FilterFn } from "@tanstack/react-table";

/** Normalize text for forgiving admin search (case, separators, spacing). */
export function normalizeAdminSearchText(value: unknown): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s.]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Split a query into lowercase tokens; ignores extra spaces. */
export function tokenizeAdminSearchQuery(filterValue: unknown): string[] {
  return normalizeAdminSearchText(filterValue).split(" ").filter(Boolean);
}

export function buildAdminSearchHaystack(
  values: Array<unknown>,
): string {
  return normalizeAdminSearchText(
    values
      .flatMap((value) => {
        if (value == null) return [];
        if (typeof value === "number" || typeof value === "boolean") {
          return [String(value)];
        }
        return [String(value)];
      })
      .join(" "),
  );
}

/**
 * Match admin table rows using AND token search.
 * Every word in the query must appear somewhere in the row haystack.
 */
export function matchesAdminTableSearch(
  haystack: string,
  filterValue: unknown,
): boolean {
  const normalizedHaystack = normalizeAdminSearchText(haystack);
  const tokens = tokenizeAdminSearchQuery(filterValue);

  if (tokens.length === 0) return true;

  return tokens.every((token) => normalizedHaystack.includes(token));
}

export function createAdminTableGlobalFilter<TData>(
  getSearchText: (row: TData) => string,
): FilterFn<TData> {
  return (row, _columnId, filterValue) =>
    matchesAdminTableSearch(getSearchText(row.original), filterValue);
}

export type AdminProductSearchNode = {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  slug?: string | null;
  badge?: string | null;
  price?: string | number | null;
  stock?: number | null;
  collections?: {
    label?: string | null;
    slug?: string | null;
    title?: string | null;
  } | null;
};

export function buildAdminProductSearchText(
  row: { node: AdminProductSearchNode },
): string {
  const product = row.node;
  const collection = product.collections;

  return buildAdminSearchHaystack([
    product.id,
    product.name,
    product.description,
    product.slug,
    product.badge,
    product.price,
    product.stock,
    collection?.label,
    collection?.slug,
    collection?.title,
  ]);
}

export type AdminCollectionSearchNode = {
  id?: string | null;
  label?: string | null;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
};

export function buildAdminCollectionSearchText(
  row: { node: AdminCollectionSearchNode },
): string {
  const collection = row.node;

  return buildAdminSearchHaystack([
    collection.id,
    collection.label,
    collection.title,
    collection.slug,
    collection.description,
  ]);
}
