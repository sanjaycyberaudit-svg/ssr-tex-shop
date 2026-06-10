"use client";
import { useMemo, useState } from "react";
import { DocumentType, gql } from "@/gql";
import { expectedErrorsHandler } from "@/lib/urql";
import { User } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@urql/next";
import { notFound } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import CartItemCard from "@/features/carts/components/CartItemCard";
import CheckoutButton from "./CheckoutButton";
import BulkOrderGuardDialog from "./BulkOrderGuardDialog";
import { CartCheckoutSummary } from "./CartCheckoutSummary";
import { CartItemsList, cartPageBottomSpacerClass } from "./CartItemsList";
import EmptyCart from "@/features/carts/components/EmptyCart";
import { RemoveCartsMutation, updateCartsMutation } from "../query";
import { CartItems } from "../useCartStore";
import { isBulkOrderQuantity } from "../constants/bulkOrder";

export const FetchCartQuery = gql(/* GraphQL */ `
  query FetchCartQuery($userId: UUID, $first: Int, $after: Cursor) {
    cartsCollection(
      first: $first
      filter: { user_id: { eq: $userId } }
      after: $after
    ) {
      __typename
      edges {
        __typename
        node {
          __typename
          product_id
          user_id
          quantity
          product: products {
            ...CartItemCardFragment
          }
        }
      }
    }
  }
`);

type UserCartSectionProps = { user: User };

type CartEdge = NonNullable<
  NonNullable<DocumentType<typeof FetchCartQuery>["cartsCollection"]>["edges"]
>[number];

function UserCartSection({ user }: UserCartSectionProps) {
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: FetchCartQuery,
    variables: {
      userId: user.id,
    },
  });

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [bulkGuardOpen, setBulkGuardOpen] = useState(false);
  const [, updateCartProduct] = useMutation(updateCartsMutation);
  const [, removeCart] = useMutation(RemoveCartsMutation);

  const cart: CartEdge[] =
    data?.cartsCollection?.edges?.filter((edge) => edge.node.product) ?? [];
  const subtotal = useMemo(() => calcSubtotal(cart), [cart]);
  const productCount = useMemo(() => calcProductCount(cart), [cart]);

  if (fetching) {
    return <LoadingCartSection />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data || !data.cartsCollection) return notFound();

  const addOneHandler = async (productId: string, quantity: number) => {
    if (isBulkOrderQuantity(quantity + 1)) {
      setBulkGuardOpen(true);
      return;
    }
    setIsLoading(true);

    const res = await updateCartProduct({
      productId: productId,
      userId: user.id,
      newQuantity: quantity + 1,
    });

    if (res.error)
      toast({
        title: "Error",
        description: expectedErrorsHandler({ error: res.error }),
      });

    setIsLoading(false);
  };

  const minusOneHandler = async (productId: string, quantity: number) => {
    if (quantity > 1) {
      setIsLoading(true);

      const res = await updateCartProduct({
        productId: productId,
        userId: user.id,
        newQuantity: quantity - 1,
      });

      if (res.error)
        toast({
          title: "Error",
          description: expectedErrorsHandler({ error: res.error }),
        });

      setIsLoading(false);
    } else {
      toast({ title: "Minimum is reached." });
    }
  };

  const removeHandler = async (productId: string) => {
    setIsLoading(true);

    const res = await removeCart({ productId, userId: user.id });

    if (res.error) {
      toast({
        title: "Error",
        description: expectedErrorsHandler({ error: res.error }),
      });
    } else {
      toast({ title: "Removed a Product." });
      reexecuteQuery({ requestPolicy: "network-only" });
    }

    setIsLoading(false);
  };

  const createCartObject = (
    data: DocumentType<typeof FetchCartQuery>,
  ): CartItems => {
    const cart: CartItems = {};
    data.cartsCollection.edges.forEach((item) => {
      const product = item.node.product;
      if (!product) return;
      cart[product.id] = {
        quantity: item.node.quantity,
      };
    });
    return cart;
  };

  return (
    <>
      {data.cartsCollection && cart.length > 0 ? (
        <section
          aria-label="Cart Section"
          className={`grid grid-cols-12 gap-x-6 gap-y-3 ${cartPageBottomSpacerClass()}`}
        >
          <CartItemsList>
            {cart.map(({ node }) => (
              <CartItemCard
                key={node.product_id}
                id={node.product_id}
                product={node.product!}
                quantity={node.quantity}
                addOneHandler={() =>
                  addOneHandler(node.product_id, node.quantity)
                }
                minusOneHandler={() =>
                  minusOneHandler(node.product_id, node.quantity)
                }
                removeHandler={() => removeHandler(node.product_id)}
                disabled={isLoading}
              />
            ))}
          </CartItemsList>

          <CartCheckoutSummary
            productCount={productCount}
            subtotal={subtotal}
            checkout={
              <CheckoutButton
                guest={false}
                disabled={isLoading}
                order={createCartObject(data)}
              />
            }
          />
        </section>
      ) : (
        <EmptyCart />
      )}
      <BulkOrderGuardDialog
        open={bulkGuardOpen}
        onOpenChange={setBulkGuardOpen}
      />
    </>
  );
}

export default UserCartSection;

const LoadingCartSection = () => (
  <section
    className="grid grid-cols-12 gap-x-6 gap-y-3"
    aria-label="Loading Skeleton"
  >
    <div className="col-span-12 divide-y md:col-span-9">
      {[...Array(3)].map((_, index) => (
        <div className="flex items-start gap-3 px-3 py-3" key={index}>
          <Skeleton className="h-[72px] w-[72px] shrink-0 rounded-md" />
          <div className="w-full space-y-2">
            <Skeleton className="h-5 max-w-xs" />
            <Skeleton className="h-9 max-w-[7.5rem] rounded-full" />
          </div>
        </div>
      ))}
    </div>
    <div className="col-span-12 hidden border p-4 md:col-span-3 md:block">
      <Skeleton className="mb-2 h-5 w-24" />
      <Skeleton className="h-8 w-32" />
    </div>
  </section>
);

export const calcProductCount = (data: CartEdge[]) => {
  return data.reduce((acc, cur) => acc + cur.node.quantity, 0);
};

const calcSubtotal = (data: CartEdge[]) => {
  return data.reduce((acc, cur) => {
    const price = Number(cur.node.product?.price ?? 0);
    return acc + cur.node.quantity * price;
  }, 0);
};
