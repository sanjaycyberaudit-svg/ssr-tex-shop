import type {
  CollectionRouteQueryQuery,
  CollectionRouteQueryQueryVariables,
} from "@/gql/graphql";
import { getClient } from "@/lib/urql";
import { CACHE_TAGS } from "@/lib/cache/constants";
import { withStorefrontCache } from "@/lib/cache/storefront-cache";
import { CollectionRouteQueryDocument } from "./documents";

export async function getCollectionPageCached(collectionSlug: string) {
  return withStorefrontCache(
    `sf:collection:${collectionSlug}`,
    async () => {
      const { data, error } = await getClient().query<
        CollectionRouteQueryQuery,
        CollectionRouteQueryQueryVariables
      >(CollectionRouteQueryDocument, { collectionSlug });
      if (error) throw error;
      return data;
    },
    { tags: [CACHE_TAGS.collections, CACHE_TAGS.products] },
  );
}
