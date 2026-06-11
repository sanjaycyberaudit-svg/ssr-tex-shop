import {
  fetchFeaturedProductsCached,
  fetchProductSearchCached,
} from "@/lib/storefront/product-queries";
import { parseProductListRequest } from "@/lib/storefront/search-params";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import type { SearchQueryVariables } from "@/gql/graphql";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

const CACHE_HEADERS = {
  "Cache-Control": `public, s-maxage=${STOREFRONT_REVALIDATE_SECONDS}, stale-while-revalidate=300`,
};

export async function GET(request: NextRequest) {
  try {
    const { mode, variables } = parseProductListRequest(
      request.nextUrl.searchParams,
    );

    const productsCollection =
      mode === "featured"
        ? await fetchFeaturedProductsCached(
            variables as { first: number; after?: string | null },
          )
        : await fetchProductSearchCached(variables as SearchQueryVariables);

    return NextResponse.json(
      { productsCollection },
      { headers: CACHE_HEADERS },
    );
  } catch (error) {
    console.error("[storefront/products] GET failed:", error);
    return NextResponse.json(
      { message: "Could not load products." },
      { status: 500 },
    );
  }
}
