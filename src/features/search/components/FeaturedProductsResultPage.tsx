"use client";

import { gql } from "@/gql";
import { useQuery } from "@urql/next";
import { Button } from "@/components/ui/button";
import { ProductCard, ProductCardFragment } from "@/features/products";
import { DocumentType } from "@/gql";
import SearchProductsGridSkeleton from "./SearchProductsGridSkeleton";

const FeaturedProductsQuery = gql(/* GraphQL */ `
  query FeaturedProductsQuery($first: Int!, $after: Cursor) {
    productsCollection(
      filter: { featured: { eq: true } }
      first: $first
      after: $after
      orderBy: [{ created_at: DescNullsLast }]
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
  const [{ data, fetching, error }] = useQuery({
    query: FeaturedProductsQuery,
    variables,
  });

  const products = data?.productsCollection;

  if (error) {
    return <p className="py-8 text-center text-destructive">{error.message}</p>;
  }

  if (fetching && !products) {
    return <SearchProductsGridSkeleton />;
  }

  if (
    !variables.after &&
    products &&
    products.edges.length === 0
  ) {
    return (
      <p className="py-12 text-center text-muted-foreground">
        No featured products yet. Mark products as featured in Admin.
      </p>
    );
  }

  if (!products || products.edges.length === 0) {
    return null;
  }

  return (
    <div>
      <section className="grid w-full grid-cols-2 gap-x-3 gap-y-8 py-5 lg:grid-cols-4">
        {products.edges.map(({ node }) => (
          <ProductCard key={node.id} product={node as ProductNode} />
        ))}
      </section>
      {isLastPage && products.pageInfo.hasNextPage && (
        <div className="mt-3 flex w-full items-center justify-center">
          <Button onClick={() => onLoadMore(products.pageInfo.endCursor)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

export default FeaturedProductsResultPage;
