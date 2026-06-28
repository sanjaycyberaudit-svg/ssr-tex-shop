import Header from "@/components/layouts/Header";
import { Shell } from "@/components/layouts/Shell";
import { SearchProductsGridSkeleton } from "@/features/products";
import {
  FilterSelections,
  SearchProductsInifiteScroll,
} from "@/features/search";
import { STOREFRONT_REVALIDATE_SECONDS } from "@/lib/cache/constants";
import { getDraftProductIdsCached } from "@/lib/storefront/draft-product-ids";
import { fetchProductSearchCached } from "@/lib/storefront/product-queries";
import { buildShopSearchVariables } from "@/lib/storefront/search-params";
import type { Metadata } from "next";
import { Suspense } from "react";

export const revalidate = STOREFRONT_REVALIDATE_SECONDS;

export const metadata: Metadata = {
  title: "Shop All Sarees",
  description:
    "Browse all silk, cotton, wedding and festive sarees at SRI SAI RAGHAVENDRA TEX. Shop online with secure checkout and delivery across India.",
  alternates: {
    canonical: "/shop",
  },
  openGraph: {
    title: "Shop All Sarees | SRI SAI RAGHAVENDRA TEX",
    description:
      "Browse all silk, cotton, wedding and festive sarees at SRI SAI RAGHAVENDRA TEX.",
    url: "/shop",
  },
};

interface ProductsPageProps {
  searchParams: {
    [key: string]: string | string[] | undefined;
  };
}

async function ProductsPage({ searchParams }: ProductsPageProps) {
  const variables = buildShopSearchVariables(searchParams);
  const [initialSearchResult, initialDraftIds] = await Promise.all([
    fetchProductSearchCached(variables),
    getDraftProductIdsCached(),
  ]);

  return (
    <Shell>
      <Header heading="Shop Now" />

      <Suspense fallback={<SearchProductsGridSkeleton />}>
        <SearchProductsInifiteScroll
          initialSearchResult={initialSearchResult}
          initialDraftIds={initialDraftIds}
        />
      </Suspense>
    </Shell>
  );
}

export default ProductsPage;
