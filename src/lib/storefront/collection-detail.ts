import type {
  CollectionRouteQueryQuery,
  CollectionRouteQueryQueryVariables,
} from "@/gql/graphql";
import { getClient } from "@/lib/urql";
import { CACHE_TAGS } from "@/lib/cache/constants";
import { withStorefrontCache } from "@/lib/cache/storefront-cache";
import { CollectionRouteQueryDocument } from "./documents";

export async function getCollectionPageCached(collectionSlug: string) {
  const normalizedSlug = collectionSlug.trim().toLowerCase();
  if (!normalizedSlug) return null;

  try {
    return await withStorefrontCache(
      `sf:collection:${normalizedSlug}`,
      async () => {
        const { data, error } = await getClient().query<
          CollectionRouteQueryQuery,
          CollectionRouteQueryQueryVariables
        >(CollectionRouteQueryDocument, { collectionSlug: normalizedSlug });
        if (error) throw error;
        return data;
      },
      { tags: [CACHE_TAGS.collections, CACHE_TAGS.products] },
    );
  } catch (error) {
    console.error(
      `[storefront] collection load failed (${normalizedSlug}):`,
      error,
    );
    return null;
  }
}
