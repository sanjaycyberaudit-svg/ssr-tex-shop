"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardFragment } from "@/features/products";
import { DocumentType } from "@/gql";
import {
  useDraftProductIds,
  useStorefrontFeaturedProducts,
} from "@/hooks/useStorefrontProducts";
import SearchProductsGridSkeleton from "./SearchProductsGridSkeleton";

type ProductNode = DocumentType<typeof ProductCardFragment>;

type Props = {
  variables: { first: number; after?: string | null };
  isLastPage: boolean;
  onLoadMore: (cursor: string) => void;
};

export function FeaturedProductsResultPage({
  variables,
  isLastPage,
  onLoadMore,
}: Props) {
  const { productsCollection, fetching, error } =
    useStorefrontFeaturedProducts(variables);
  const { draftIds, draftLoaded } = useDraftProductIds();

  const visibleEdges = useMemo(
    () =>
      productsCollection?.edges.filter(({ node }) => !draftIds.has(node.id)) ??
      [],
    [draftIds, productsCollection?.edges],
  );

  if ((fetching && !productsCollection) || !draftLoaded) {
    return <SearchProductsGridSkeleton />;
  }

  if (error) {
    return <p>Oh no... {error}</p>;
  }

  if (!productsCollection) {
    return null;
  }

  return (
    <div>
      {visibleEdges.length === 0 ? (
        <p>No featured products yet.</p>
      ) : (
        <section className="grid grid-cols-2 lg:grid-cols-4 w-full gap-y-8 gap-x-3 py-5">
          {visibleEdges.map(({ node }) => (
            <ProductCard key={node.id} product={node as ProductNode} />
          ))}
        </section>
      )}

      {isLastPage && productsCollection.pageInfo.hasNextPage && (
        <div className="w-full flex justify-center items-center mt-3">
          <Button
            onClick={() =>
              onLoadMore(productsCollection.pageInfo.endCursor ?? "")
            }
          >
            load more
          </Button>
        </div>
      )}
    </div>
  );
}

export default FeaturedProductsResultPage;
