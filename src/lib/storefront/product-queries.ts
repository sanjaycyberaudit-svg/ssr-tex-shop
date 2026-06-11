import type {
  FeaturedProductsQueryQuery,
  FeaturedProductsQueryQueryVariables,
  SearchQuery,
  SearchQueryVariables,
} from "@/gql/graphql";
import { getClient } from "@/lib/urql";
import { CACHE_TAGS } from "@/lib/cache/constants";
import { withStorefrontCache } from "@/lib/cache/storefront-cache";
import {
  FeaturedProductsQueryDocument,
  SearchQueryDocument,
} from "./documents";

function stableKey(parts: Record<string, unknown>) {
  return JSON.stringify(parts);
}

export async function fetchProductSearchCached(variables: SearchQueryVariables) {
  const cacheKey = `sf:products:search:${stableKey(variables)}`;

  return withStorefrontCache(
    cacheKey,
    async () => {
      const { data, error } = await getClient().query<
        SearchQuery,
        SearchQueryVariables
      >(SearchQueryDocument, variables);
      if (error) throw error;
      return data?.productsCollection ?? null;
    },
    { tags: [CACHE_TAGS.products] },
  );
}

export async function fetchFeaturedProductsCached(variables: {
  first: number;
  after?: string | null;
}) {
  const cacheKey = `sf:products:featured:${stableKey(variables)}`;

  return withStorefrontCache(
    cacheKey,
    async () => {
      const { data, error } = await getClient().query<
        FeaturedProductsQueryQuery,
        FeaturedProductsQueryQueryVariables
      >(FeaturedProductsQueryDocument, variables);
      if (error) throw error;
      return data?.productsCollection ?? null;
    },
    { tags: [CACHE_TAGS.products] },
  );
}
