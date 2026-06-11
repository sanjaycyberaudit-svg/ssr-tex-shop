"use client";
import { DocumentType, gql } from "@/gql";
import { useQuery } from "@urql/next";
import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyCart from "./EmptyCart";
import CartItemCard from "./CartItemCard";
import CheckoutButton from "./CheckoutButton";
import BulkOrderGuardDialog from "./BulkOrderGuardDialog";
import { CartCheckoutSummary } from "./CartCheckoutSummary";
import { CartItemsList, cartPageBottomSpacerClass } from "./CartItemsList";
import useCartStore, {
  CartItems,
  calcProductCountStorage,
} from "../useCartStore";
import { isBulkOrderQuantity } from "../constants/bulkOrder";
import { useToast } from "@/components/ui/use-toast";

function GuestCartSection() {
  const { toast } = useToast();
  const [bulkGuardOpen, setBulkGuardOpen] = useState(false);
  const cartItems = useCartStore((s) => s.cart);
  const addProductToCart = useCartStore((s) => s.addProductToCart);
  const removeProduct = useCartStore((s) => s.removeProduct);

  const cartProductIds = Object.keys(cartItems);

  const [{ data, fetching, error }, _] = useQuery({
    query: FetchGuestCartQuery,
    variables: {
      cartItems: cartProductIds,
      first: Math.max(cartProductIds.length, 1),
    },
    pause: cartProductIds.length === 0,
  });

  const subtotal = useMemo(
    () => calcSubtotal({ prdouctsDetails: data, quantity: cartItems }),
    [data, cartItems],
  );

  const productCount = useMemo(
    () => calcProductCountStorage(cartItems),
    [cartItems],
  );
  if (cartProductIds.length === 0) return <EmptyCart />;
  if (fetching) return LoadingCartSection();
  if (error) return <div>Error</div>;
  if (!data?.productsCollection?.edges?.length) return <EmptyCart />;

  const cartLines = data.productsCollection.edges.filter(
    ({ node }) => cartItems[node.id],
  );

  const addOneHandler = (productId: string, quantity: number) => {
    if (isBulkOrderQuantity(quantity + 1)) {
      setBulkGuardOpen(true);
      return;
    }
    addProductToCart(productId, 1);
  };
  const minusOneHandler = (productId: string, quantity: number) => {
    if (quantity > 1) {
      addProductToCart(productId, -1);
    } else {
      toast({ title: "Minimum is reached." });
    }
  };
  const removeHandler = (productId: string) => {
    removeProduct(productId);
    toast({ title: "Product Removed." });
  };

  return (
    <>
      {cartLines.length > 0 ? (
        <section
          aria-label="Cart Section"
          className={`grid grid-cols-12 gap-x-6 gap-y-3 ${cartPageBottomSpacerClass()}`}
        >
          <CartItemsList>
            {cartLines.map(({ node }) => (
              <CartItemCard
                key={node.id}
                id={node.id}
                product={node}
                quantity={cartItems[node.id]?.quantity ?? 0}
                addOneHandler={() =>
                  addOneHandler(node.id, cartItems[node.id].quantity)
                }
                minusOneHandler={() =>
                  minusOneHandler(node.id, cartItems[node.id].quantity)
                }
                removeHandler={() => removeHandler(node.id)}
              />
            ))}
          </CartItemsList>

          <CartCheckoutSummary
            productCount={productCount}
            subtotal={subtotal}
            checkout={<CheckoutButton guest={true} order={cartItems} />}
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

export default GuestCartSection;

export const LoadingCartSection = () => (
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

const calcSubtotal = ({
  prdouctsDetails,
  quantity,
}: {
  prdouctsDetails: DocumentType<typeof FetchGuestCartQuery>;
  quantity: CartItems;
}) => {
  const productPrices =
    prdouctsDetails && prdouctsDetails.productsCollection.edges
      ? prdouctsDetails.productsCollection.edges
      : [];

  if (!productPrices.length) return 0;

  return productPrices.reduce((acc, cur) => {
    const item = quantity[cur.node.id];
    if (!item) return acc;
    return acc + item.quantity * cur.node.price;
  }, 0);
};

const FetchGuestCartQuery = gql(/* GraphQL */ `
  query FetchGuestCartQuery(
    $cartItems: [String!]
    $first: Int
    $after: Cursor
  ) {
    productsCollection(
      first: $first
      after: $after
      filter: { id: { in: $cartItems } }
    ) {
      edges {
        node {
          id
          ...CartItemCardFragment
        }
      }
    }
  }
`);
