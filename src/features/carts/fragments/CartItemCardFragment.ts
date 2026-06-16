import { gql } from "@/gql";

export const CartItemCardFragment = gql(/* GraphQL */ `
  fragment CartItemCardFragment on products {
    id
    slug
    name
    price
    stock
    featuredImage: medias {
      id
      key
      alt
    }
  }
`);
