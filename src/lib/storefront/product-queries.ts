import {
  FeaturedProductsQueryDocument,
  SearchDocument,
  type FeaturedProductsQueryQuery,
  type FeaturedProductsQueryQueryVariables,
  type SearchQuery,
  type SearchQueryVariables,
} from "@/gql/graphql";
import { getClient } from "@/lib/urql";
import { CACHE_TAGS } from "@/lib/cache/constants";
import { withStorefrontCache } from "@/lib/cache/storefront-cache";

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
      >(SearchDocument, variables);
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
