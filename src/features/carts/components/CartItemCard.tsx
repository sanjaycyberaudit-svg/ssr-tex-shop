"use client";
import { DocumentType, gql } from "@/gql";

import Image from "next/image";
import React from "react";

import QuantityInput from "../../../components/layouts/QuantityInput";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { formatPrice, keytoUrl } from "@/lib/utils";
import { UseQueryExecute } from "@urql/next";
import Link from "next/link";
import { Icons } from "../../../components/layouts/icons";
import { Button } from "../../../components/ui/button";

export const CartItemCardFragment = gql(/* GraphQL */ `
  fragment CartItemCardFragment on products {
    id
    slug
    name
    price
    featuredImage: medias {
      id
      key
      alt
    }
  }
`);

type CartItemCardProps = React.ComponentProps<typeof Card> & {
  product: DocumentType<typeof CartItemCardFragment>;
  disabled?: boolean;
  addOneHandler: () => void;
  minusOneHandler: () => void;
  removeHandler: () => void;
  quantity: number;
};

function CartItemCard({
  product,
  disabled,
  addOneHandler,
  minusOneHandler,
  removeHandler,
  quantity,
}: CartItemCardProps) {
  return (
    <Card className="flex items-start gap-3 border-0 bg-transparent px-3 py-3 shadow-none md:items-center md:gap-6 md:px-5">
      <CardContent className="relative shrink-0 overflow-hidden p-0">
        <Image
          src={keytoUrl(product.featuredImage.key)}
          alt={product.featuredImage.alt}
          width={150}
          height={150}
          className="aspect-square h-[72px] w-[72px] rounded-md object-cover md:h-[120px] md:w-[120px]"
        />
      </CardContent>

      <CardHeader className="min-w-0 flex-1 space-y-2 p-0">
        <CardTitle className="text-sm font-semibold leading-snug md:text-base">
          <Link href={`/shop/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </CardTitle>

        <QuantityInput
          value={quantity}
          addOneHandler={addOneHandler}
          minusOneHandler={minusOneHandler}
          disabled={disabled}
          className="h-9 max-w-[7.5rem] px-2 py-1 md:h-12 md:max-w-36 md:px-4"
        />
      </CardHeader>

      <CardFooter className="flex shrink-0 flex-col items-end gap-1 p-0 md:flex-row md:items-center md:gap-3">
        <p className="text-sm font-semibold md:text-base">
          {formatPrice(product.price)}
        </p>

        <Button
          aria-label="Remove Item Button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={removeHandler}
        >
          <Icons.close size={18} />
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CartItemCard;
