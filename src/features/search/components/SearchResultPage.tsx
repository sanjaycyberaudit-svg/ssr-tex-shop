"use client";

import { gql } from "@/gql";
import { SearchQuery, SearchQueryVariables } from "@/gql/graphql";
import { useQuery } from "@urql/next";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/features/products";
import SearchProductsGridSkeleton from "./SearchProductsGridSkeleton";
import { useEffect, useMemo, useState } from "react";

const ProductSearch = gql(/* GraphQL */ `
  query Search(
    $search: String
    $lower: BigFloat
    $upper: BigFloat
    $collections: [String!]
    $first: Int!
    $after: Cursor
    $orderBy: [productsOrderBy!]
  ) {
    productsCollection(
      filter: {
        and: [
          { name: { ilike: $search } }
          { price: { gt: $lower, lt: $upper } }
          { collection_id: { in: $collections } }
        ]
      }
      first: $first
      after: $after
      orderBy: $orderBy
    ) {
      edges {
        node {
          id

          ...ProductCardFragment
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`);

const SearchResultPage = ({
  variables,
  onLoadMore,
  isLastPage,
}: {
  variables: SearchQueryVariables;
  onLoadMore: (cursor: string) => void;
  isLastPage: boolean;
}) => {
  const [result] = useQuery<SearchQuery, SearchQueryVariables>({
    query: ProductSearch,
    variables,
  });
  const [draftIds, setDraftIds] = useState<Set<string>>(new Set());
  const [draftLoaded, setDraftLoaded] = useState(false);

  const { data, fetching, error } = result;

  const products = data?.productsCollection;
  const visibleEdges = useMemo(
    () => products?.edges.filter(({ node }) => !draftIds.has(node.id)) ?? [],
    [draftIds, products?.edges],
  );

  useEffect(() => {
    let active = true;
    const loadDraftIds = async () => {
      try {
        const res = await fetch("/api/products/drafts", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const payload = (await res.json()) as { ids?: string[] };
        if (active) {
          setDraftIds(new Set(payload.ids ?? []));
        }
      } catch {
        if (active) {
          setDraftIds(new Set());
        }
      }
      if (active) {
        setDraftLoaded(true);
      }
    };
    void loadDraftIds();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {error && <p>Oh no... {error.message}</p>}

      {(fetching || !draftLoaded) && <SearchProductsGridSkeleton />}

      {products && draftLoaded && (
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
              <ProductCard key={node.id} product={node} />
            ))}
          </section>

          {isLastPage && products.pageInfo.hasNextPage && (
            <div className="w-full flex justify-center items-center mt-3">
              <Button onClick={() => onLoadMore(products.pageInfo.endCursor)}>
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
