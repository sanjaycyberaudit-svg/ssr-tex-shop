import {
  ProductDetailPageQueryDocument,
  type ProductDetailPageQueryQuery,
  type ProductDetailPageQueryQueryVariables,
} from "@/gql/graphql";
import { getClient } from "@/lib/urql";
import { CACHE_TAGS } from "@/lib/cache/constants";
import { withStorefrontCache } from "@/lib/cache/storefront-cache";

export async function getProductDetailCached(productSlug: string) {
  return withStorefrontCache(
    `sf:product:${productSlug}`,
    async () => {
      const { data, error } = await getClient().query<
        ProductDetailPageQueryQuery,
        ProductDetailPageQueryQueryVariables
      >(ProductDetailPageQueryDocument, { productSlug });
      if (error) throw error;
      return data;
    },
    { tags: [CACHE_TAGS.products] },
  );
}
