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
  findMatchingCollections,
  NO_COLLECTION_MATCH_ID,
  normalizeStorefrontSearchTerm,
  type StorefrontCollectionMatch,
} from "./collection-search";
import {
  FeaturedProductsQueryDocument,
  SearchQueryDocument,
} from "./documents";

function stableKey(parts: Record<string, unknown>) {
  return JSON.stringify(parts);
}

export type StorefrontProductSearchResult = {
  productsCollection: SearchQuery["productsCollection"] | null;
  matchingCollections: StorefrontCollectionMatch[];
};

export async function fetchProductSearchCached(
  variables: SearchQueryVariables,
): Promise<StorefrontProductSearchResult> {
  const searchTerm = normalizeStorefrontSearchTerm(variables.search);
  const matchingCollections = searchTerm
    ? await findMatchingCollections(searchTerm)
    : [];

  const matchedCollectionIds =
    matchingCollections.length > 0
      ? matchingCollections.map((collection) => collection.id)
      : [NO_COLLECTION_MATCH_ID];

  const queryVariables: SearchQueryVariables = {
    ...variables,
    matchedCollectionIds,
  };

  const cacheKey = `sf:products:search:${stableKey({
    ...queryVariables,
    matchingCollectionIds: matchingCollections.map(
      (collection) => collection.id,
    ),
  })}`;

  const productsCollection = await withStorefrontCache(
    cacheKey,
    async () => {
      const { data, error } = await getClient().query<
        SearchQuery,
        SearchQueryVariables
      >(SearchQueryDocument, queryVariables);
      if (error) throw error;
      return data?.productsCollection ?? null;
    },
    { tags: [CACHE_TAGS.products] },
  );

  return {
    productsCollection,
    matchingCollections: searchTerm ? matchingCollections : [],
  };
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
