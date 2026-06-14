import type { FilterFn } from "@tanstack/react-table";

const BADGE_SEARCH_ALIASES: Record<string, string> = {
  new_product: "new product",
  best_sale: "best sale bestseller",
  featured: "featured highlight",
};

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, " ");
}

function stripDiacritics(value: string): string {
  return value.normalize("NFD").replace(/\p{M}/gu, "");
}

/** Normalize text for forgiving admin search (case, separators, spacing). */
export function normalizeAdminSearchText(value: unknown): string {
  return stripDiacritics(
    stripHtmlTags(String(value ?? ""))
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/[^\p{L}\p{N}\s.]/gu, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function compactAdminSearchText(value: string): string {
  return value.replace(/[\s._-]+/g, "");
}

/** Split a query into lowercase tokens; ignores extra spaces. */
export function tokenizeAdminSearchQuery(filterValue: unknown): string[] {
  return normalizeAdminSearchText(filterValue).split(" ").filter(Boolean);
}

export function parseAdminSearchQuery(filterValue: unknown): {
  phrases: string[];
  tokens: string[];
} {
  const raw = String(filterValue ?? "").trim();
  if (!raw) return { phrases: [], tokens: [] };

  const phrases: string[] = [];
  let remainder = raw;
  const phrasePattern = /"([^"]+)"/g;

  for (const match of raw.matchAll(phrasePattern)) {
    const phrase = normalizeAdminSearchText(match[1]);
    if (phrase) phrases.push(phrase);
    remainder = remainder.replace(match[0], " ");
  }

  return {
    phrases,
    tokens: tokenizeAdminSearchQuery(remainder),
  };
}

function expandBadgeSearchValues(badge: unknown): string[] {
  if (badge == null || badge === "") return [];
  const raw = String(badge);
  const normalized = normalizeAdminSearchText(raw.replace(/_/g, " "));
  const alias = BADGE_SEARCH_ALIASES[raw];
  return [raw, normalized, alias].filter(Boolean);
}

function expandFeaturedSearchValues(featured: unknown): string[] {
  if (featured == null) return [];
  if (featured === true) return ["featured", "yes", "true"];
  if (featured === false) return ["not featured", "no", "false"];
  return [String(featured)];
}

function expandPriceSearchValues(price: unknown): string[] {
  if (price == null || price === "") return [];
  const raw = String(price).trim();
  const numeric = raw.replace(/[^\d.]/g, "");
  const values = [raw, numeric];
  const [whole = "", fraction = ""] = numeric.split(".");
  if (whole) values.push(whole);
  if (fraction && fraction !== "00") values.push(`${whole}.${fraction}`);
  return [...new Set(values.filter(Boolean))];
}

function expandSlugSearchValues(slug: unknown): string[] {
  if (slug == null || slug === "") return [];
  const raw = String(slug);
  const normalized = normalizeAdminSearchText(raw);
  const compact = compactAdminSearchText(normalized);
  return [raw, normalized, compact].filter(Boolean);
}

/** Index ST000001 as ST_01, ST01, 01, etc. so shorthand code searches still match. */
export function expandProductCodeSearchValues(productCode: unknown): string[] {
  if (productCode == null || productCode === "") return [];

  const raw = String(productCode).trim();
  const upper = raw.toUpperCase();
  const values = new Set<string>([
    raw,
    upper,
    raw.toLowerCase(),
    normalizeAdminSearchText(raw),
    compactAdminSearchText(raw),
    ...expandSlugSearchValues(raw),
  ]);

  const match = upper.match(/^ST[_-]?0*(\d+)$/);
  if (match) {
    const num = Number.parseInt(match[1], 10);
    if (Number.isFinite(num) && num >= 0) {
      const padded6 = `ST${String(num).padStart(6, "0")}`;
      const short2 = String(num).padStart(2, "0");
      [
        padded6,
        padded6.toLowerCase(),
        `ST_${short2}`,
        `st_${short2}`,
        `ST-${short2}`,
        `ST${num}`,
        `st${num}`,
        String(num),
        short2,
      ].forEach((value) => {
        values.add(value);
        values.add(normalizeAdminSearchText(value));
        values.add(compactAdminSearchText(value));
      });
    }
  }

  return [...values].filter(Boolean);
}

/** When the whole query looks like a product code (ST…). */
export function isProductCodeSearchQuery(filterValue: unknown): boolean {
  const raw = String(filterValue ?? "").trim();
  return /^ST[_-]?0*\d+$/i.test(raw);
}

/** Safe aliases for code queries — never bare digits like "1" or "01". */
function buildProductCodeQueryAliases(filterValue: string): string[] {
  const raw = filterValue.trim();
  const upper = raw.toUpperCase();
  const match = upper.match(/^ST[_-]?0*(\d+)$/);
  if (!match) {
    return [raw, normalizeAdminSearchText(raw), compactAdminSearchText(raw)];
  }

  const num = Number.parseInt(match[1], 10);
  if (!Number.isFinite(num) || num < 0) {
    return [raw];
  }

  const padded6 = `ST${String(num).padStart(6, "0")}`;
  const short2 = String(num).padStart(2, "0");

  return [
    upper,
    upper.toLowerCase(),
    padded6,
    padded6.toLowerCase(),
    `ST_${short2}`,
    `st_${short2}`,
    `ST${num}`,
    `st${num}`,
    compactAdminSearchText(upper),
    compactAdminSearchText(padded6),
    normalizeAdminSearchText(upper),
    normalizeAdminSearchText(padded6),
  ];
}

/** Haystack built only from product-code fields (not price/stock). */
export function buildAdminProductCodeSearchText(row: {
  node: AdminProductSearchNode;
}): string {
  const product = row.node;
  const nameCode = product.name?.match(/\bST[_-]?0*\d+\b/i)?.[0] ?? null;

  return buildAdminSearchHaystack([
    ...expandProductCodeSearchValues(product.productCode),
    ...expandProductCodeSearchValues(nameCode),
    ...expandSlugSearchValues(product.slug),
  ]);
}

export function matchesAdminProductCodeSearch(
  codeHaystack: string,
  filterValue: unknown,
): boolean {
  const raw = String(filterValue ?? "").trim();
  if (!raw) return true;

  const normalizedHaystack = normalizeAdminSearchText(codeHaystack);
  const compactHaystack = compactAdminSearchText(normalizedHaystack);

  return buildProductCodeQueryAliases(raw).some((alias) => {
    const normalizedAlias = normalizeAdminSearchText(alias);
    const compactAlias = compactAdminSearchText(alias);

    if (
      normalizedAlias.length >= 3 &&
      normalizedHaystack.includes(normalizedAlias)
    ) {
      return true;
    }
    if (compactAlias.length >= 4 && compactHaystack.includes(compactAlias)) {
      return true;
    }
    return false;
  });
}

export function matchesAdminProductTableSearch(
  row: { node: AdminProductSearchNode },
  filterValue: unknown,
): boolean {
  const query = String(filterValue ?? "").trim();
  if (!query) return true;

  if (isProductCodeSearchQuery(query)) {
    return matchesAdminProductCodeSearch(
      buildAdminProductCodeSearchText(row),
      query,
    );
  }

  return matchesAdminTableSearch(buildAdminProductSearchText(row), query);
}

export function buildAdminSearchHaystack(values: Array<unknown>): string {
  return normalizeAdminSearchText(
    values
      .flatMap((value) => {
        if (value == null) return [];
        if (Array.isArray(value)) return value.map(String);
        if (typeof value === "number" || typeof value === "boolean") {
          return [String(value)];
        }
        return [String(value)];
      })
      .join(" "),
  );
}

function tokenMatchesHaystack(token: string, haystack: string): boolean {
  if (!token) return true;
  if (haystack.includes(token)) return true;

  if (token.length >= 3) {
    const compactHaystack = compactAdminSearchText(haystack);
    const compactToken = compactAdminSearchText(token);
    if (compactToken && compactHaystack.includes(compactToken)) return true;
  }

  return false;
}

/**
 * Match admin table rows using quoted phrases + AND token search.
 * - `"silk saree"` requires that exact phrase
 * - `silk kanchi` requires both words anywhere in the row
 */
export function matchesAdminTableSearch(
  haystack: string,
  filterValue: unknown,
): boolean {
  const normalizedHaystack = normalizeAdminSearchText(haystack);
  const { phrases, tokens } = parseAdminSearchQuery(filterValue);

  if (phrases.length === 0 && tokens.length === 0) return true;

  const phrasesMatch = phrases.every((phrase) =>
    normalizedHaystack.includes(phrase),
  );
  const tokensMatch = tokens.every((token) =>
    tokenMatchesHaystack(token, normalizedHaystack),
  );

  return phrasesMatch && tokensMatch;
}

export function createAdminTableGlobalFilter<TData>(
  getSearchText: (row: TData) => string,
): FilterFn<TData> {
  return (row, _columnId, filterValue) =>
    matchesAdminTableSearch(getSearchText(row.original), filterValue);
}

export function createAdminProductTableGlobalFilter<TData>(): FilterFn<TData> {
  return (row, _columnId, filterValue) =>
    matchesAdminProductTableSearch(
      row.original as { node: AdminProductSearchNode },
      filterValue,
    );
}

export type AdminProductSearchNode = {
  id?: string | null;
  name?: string | null;
  description?: string | null;
  slug?: string | null;
  productCode?: string | null;
  badge?: string | null;
  price?: string | number | null;
  stock?: number | null;
  rating?: string | number | null;
  featured?: boolean | null;
  isDraft?: boolean | null;
  collections?: {
    label?: string | null;
    slug?: string | null;
    title?: string | null;
  } | null;
};

function expandDraftSearchValues(isDraft: unknown): string[] {
  if (isDraft === true) return ["draft", "unpublished"];
  if (isDraft === false) return ["published", "live"];
  return [];
}

export function buildAdminProductSearchText(row: {
  node: AdminProductSearchNode;
}): string {
  const product = row.node;
  const collection = product.collections;

  return buildAdminSearchHaystack([
    product.id,
    product.productCode,
    product.name,
    product.description,
    ...expandSlugSearchValues(product.slug),
    ...expandBadgeSearchValues(product.badge),
    ...expandPriceSearchValues(product.price),
    product.stock,
    product.rating,
    ...expandFeaturedSearchValues(product.featured),
    ...expandDraftSearchValues(product.isDraft),
    collection?.label,
    ...expandSlugSearchValues(collection?.slug),
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

export function buildAdminCollectionSearchText(row: {
  node: AdminCollectionSearchNode;
}): string {
  const collection = row.node;

  return buildAdminSearchHaystack([
    collection.id,
    collection.label,
    collection.title,
    ...expandSlugSearchValues(collection.slug),
    collection.description,
  ]);
}

export function selectAllFilteredRows<TData>(
  table: {
    getFilteredRowModel: () => { rows: Array<{ id: string }> };
  },
  onChange: (selection: Record<string, boolean>) => void,
) {
  const selection: Record<string, boolean> = {};
  for (const row of table.getFilteredRowModel().rows) {
    selection[row.id] = true;
  }
  onChange(selection);
}
