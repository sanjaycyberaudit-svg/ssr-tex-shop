import { gql } from "@/gql";

export const SearchQueryDocument = gql(/* GraphQL */ `
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

export const FeaturedProductsQueryDocument = gql(/* GraphQL */ `
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

export const CollectionRouteQueryDocument = gql(/* GraphQL */ `
  query CollectionRouteQuery($collectionSlug: String) {
    collectionsCollection(
      filter: { slug: { eq: $collectionSlug } }
      orderBy: [{ order: DescNullsLast }]
      first: 1
    ) {
      edges {
        node {
          title
          label
          description
          ...CollectionBannerFragment
        }
      }
    }
  }
`);

export const ProductDetailPageQueryDocument = gql(/* GraphQL */ `
  query ProductDetailPageQuery($productSlug: String) {
    productsCollection(filter: { slug: { eq: $productSlug } }) {
      edges {
        node {
          id
          name
          description
          rating
          price
          stock
          tags
          totalComments
          ...ProductImageShowcaseFragment
          commentsCollection(first: 5) {
            edges {
              node {
                ...ProductCommentsSectionFragment
              }
            }
          }
          collections {
            id
            label
            slug
          }
        }
      }
    }
    recommendations: productsCollection(first: 4) {
      edges {
        node {
          id
          ...ProductCardFragment
        }
      }
    }
  }
`);
