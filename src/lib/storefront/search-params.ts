import { OrderByDirection, type SearchQueryVariables } from "@/gql/graphql";

export type ProductListMode = "search" | "featured";

export function pageSearchParamsToUrlSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
    } else {
      params.set(key, value);
    }
  }

  return params;
}

export function buildShopSearchVariables(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  collectionId?: string,
): SearchQueryVariables {
  const params =
    searchParams instanceof URLSearchParams
      ? new URLSearchParams(searchParams)
      : pageSearchParamsToUrlSearchParams(searchParams);

  if (collectionId) {
    params.set("collectionId", collectionId);
  }

  const { mode, variables } = parseProductListRequest(params);
  if (mode !== "search") {
    throw new Error("Expected search mode");
  }

  return variables as SearchQueryVariables;
}

export function parseProductListRequest(searchParams: URLSearchParams): {
  mode: ProductListMode;
  variables: SearchQueryVariables | { first: number; after?: string | null };
} {
  const mode = searchParams.get("mode") === "featured" ? "featured" : "search";

  const first = Math.min(
    24,
    Math.max(1, Number(searchParams.get("first") ?? "4") || 4),
  );
  const after = searchParams.get("after")?.trim() || undefined;

  if (mode === "featured") {
    return { mode, variables: { first, after } };
  }

  const priceRange = searchParams.get("price_range");
  const range = priceRange ? priceRange.split("-") : undefined;

  let collections: string[] | undefined;
  const collectionsRaw = searchParams.get("collections");
  if (collectionsRaw) {
    try {
      const parsed = JSON.parse(collectionsRaw) as string[];
      collections = parsed.length > 0 ? parsed : undefined;
    } catch {
      collections = undefined;
    }
  }

  const collectionId = searchParams.get("collectionId")?.trim();
  if (collectionId) {
    collections = [collectionId];
  }

  const sort = searchParams.get("sort") ?? undefined;
  const search = searchParams.get("search") ?? undefined;

  let orderBy: SearchQueryVariables["orderBy"];

  switch (sort) {
    case "BEST_MATCH":
      orderBy = [
        { featured: OrderByDirection.DescNullsFirst },
        { created_at: OrderByDirection.DescNullsLast },
      ];
      break;
    case "PRICE_LOW_TO_HIGH":
      orderBy = [{ price: OrderByDirection.AscNullsLast }];
      break;
    case "PRICE_HIGH_TO_LOW":
      orderBy = [{ price: OrderByDirection.DescNullsLast }];
      break;
    case "NEWEST":
      orderBy = [{ created_at: OrderByDirection.DescNullsLast }];
      break;
    case "NAME_ASCE":
      orderBy = [{ name: OrderByDirection.AscNullsLast }];
      break;
    default:
      orderBy = undefined;
  }

  const variables: SearchQueryVariables = {
    search: search ? `%${search.trim()}%` : "%%",
    lower: range?.[0] ? `${range[0]}` : undefined,
    upper: range?.[1] ? `${range[1]}` : undefined,
    collections,
    orderBy,
    first,
    after,
  };

  return { mode, variables };
}

export function searchVariablesToQueryString(
  variables: SearchQueryVariables,
  collectionId?: string,
): string {
  const params = new URLSearchParams();
  params.set("mode", "search");
  params.set("first", String(variables.first));

  if (variables.after) params.set("after", String(variables.after));
  if (collectionId) params.set("collectionId", collectionId);

  if (variables.search && variables.search !== "%%") {
    const term = String(variables.search).replace(/^%|%$/g, "");
    if (term) params.set("search", term);
  }

  if (variables.lower && variables.upper) {
    params.set("price_range", `${variables.lower}-${variables.upper}`);
  }

  if (variables.collections?.length) {
    params.set("collections", JSON.stringify(variables.collections));
  }

  if (variables.orderBy) {
    const orderBy = Array.isArray(variables.orderBy)
      ? variables.orderBy
      : [variables.orderBy];
    if (
      orderBy.some((o) => "featured" in o) &&
      orderBy.some((o) => "created_at" in o)
    ) {
      params.set("sort", "BEST_MATCH");
    } else if (orderBy.some((o) => "price" in o && o.price?.includes("Asc"))) {
      params.set("sort", "PRICE_LOW_TO_HIGH");
    } else if (orderBy.some((o) => "price" in o && o.price?.includes("Desc"))) {
      params.set("sort", "PRICE_HIGH_TO_LOW");
    } else if (orderBy.some((o) => "created_at" in o)) {
      params.set("sort", "NEWEST");
    } else if (orderBy.some((o) => "name" in o)) {
      params.set("sort", "NAME_ASCE");
    }
  }

  return params.toString();
}

export function featuredVariablesToQueryString(variables: {
  first: number;
  after?: string | null;
}): string {
  const params = new URLSearchParams();
  params.set("mode", "featured");
  params.set("first", String(variables.first));
  if (variables.after) params.set("after", String(variables.after));
  return params.toString();
}
