"use client";

import type { SearchQueryVariables } from "@/gql/graphql";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardFragment } from "@/features/products";
import { DocumentType } from "@/gql";
import {
  useDraftProductIds,
  useStorefrontProductSearch,
} from "@/hooks/useStorefrontProducts";
import { useMemo } from "react";
import SearchProductsGridSkeleton from "./SearchProductsGridSkeleton";

type ProductNode = DocumentType<typeof ProductCardFragment>;

const SearchResultPage = ({
  variables,
  onLoadMore,
  isLastPage,
  collectionId,
}: {
  variables: SearchQueryVariables;
  onLoadMore: (cursor: string) => void;
  isLastPage: boolean;
  collectionId?: string;
}) => {
  const { productsCollection, fetching, error } = useStorefrontProductSearch(
    variables,
    collectionId,
  );
  const { draftIds, draftLoaded } = useDraftProductIds();

  const visibleEdges = useMemo(
    () =>
      productsCollection?.edges.filter(({ node }) => !draftIds.has(node.id)) ??
      [],
    [draftIds, productsCollection?.edges],
  );

  return (
    <div>
      {error && <p>Oh no... {error}</p>}

      {(fetching || !draftLoaded) && <SearchProductsGridSkeleton />}

      {productsCollection && draftLoaded && (
        <>
          {visibleEdges.length === 0 && (
            <p>
              {`There is no Products with name `}
              <span className="font-bold">
                {(variables.search || []).slice(1, -2)}
              </span>
              {"."}
            </p>
          )}
          <section className="grid grid-cols-2 lg:grid-cols-4 w-full gap-y-8 gap-x-3 py-5">
            {visibleEdges.map(({ node }) => (
              <ProductCard key={node.id} product={node as ProductNode} />
            ))}
          </section>

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
        </>
      )}
    </div>
  );
};

export default SearchResultPage;
