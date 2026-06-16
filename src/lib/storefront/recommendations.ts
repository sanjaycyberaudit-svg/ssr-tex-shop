import { ProductCardFragment } from "@/features/products/components/ProductCard";
import type { RecomendationProductsQueryQuery } from "@/gql/graphql";
import { gql } from "@/gql";
import { CACHE_TAGS } from "@/lib/cache/constants";
import { withStorefrontCache } from "@/lib/cache/storefront-cache";
import { getClient } from "@/lib/urql";

const RecommendationProductsQuery = gql(/* GraphQL */ `
  query RecomendationProductsQuery($first: Int!) {
    recommendations: productsCollection(first: $first) {
      edges {
        node {
          id
          ...ProductCardFragment
        }
      }
    }
  }
`);

export async function getRecommendationProductsCached(first = 4) {
  return withStorefrontCache(
    `sf:recommendations:${first}`,
    async () => {
      const { data, error } = await getClient().query(
        RecommendationProductsQuery,
        { first },
      );
      if (error) {
        console.error("[recommendations] query failed:", error.message);
        return null;
      }
      return data as RecomendationProductsQueryQuery | null;
    },
    { tags: [CACHE_TAGS.products] },
  );
}
