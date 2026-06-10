"use client";
import { useEffect, useMemo, useState } from "react";
import { DocumentType, gql } from "@/gql";
import { expectedErrorsHandler } from "@/lib/urql";
import {
  calculateCourierCharge,
  calculateGstAmount,
} from "@/lib/courier/calculate";
import { fetchWithTimeout } from "@/lib/network/fetchWithTimeout";
import { cn, formatPrice } from "@/lib/utils";
import { User } from "@supabase/supabase-js";
import { useMutation, useQuery } from "@urql/next";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";
import { useBulkOrderGuardConfig } from "@/providers/BulkOrderGuardProvider";
import { useCourierChargesConfig } from "@/providers/CourierChargesProvider";
import { useOfferCodesConfig } from "@/providers/OfferCodesProvider";
import { useStockControlConfig } from "@/providers/StockControlProvider";
import CartItemCard from "@/features/carts/components/CartItemCard";
import { INDIAN_STATES } from "@/features/addresses/constants/indianStates";
import {
  loadCheckoutAddressDraft,
  saveCheckoutAddressDraft,
} from "@/features/addresses/lib/checkoutAddressDraft";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import CheckoutButton from "./CheckoutButton";
import BulkOrderGuardDialog from "./BulkOrderGuardDialog";
import EmptyCart from "@/features/carts/components/EmptyCart";
import { RemoveCartsMutation, updateCartsMutation } from "../query";
import useCartStore, { CartItems } from "../useCartStore";
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

type CartSizeConfigOption = {
  size: string;
  qty: number;
};

type CartSizeConfig = {
  enabled: boolean;
  options: CartSizeConfigOption[];
};

type CartEdge = NonNullable<
  NonNullable<DocumentType<typeof FetchCartQuery>["cartsCollection"]>["edges"]
>[number];

function UserCartSection({ user }: UserCartSectionProps) {
  const bulkOrder = useBulkOrderGuardConfig();
  const courierConfig = useCourierChargesConfig();
  const offerCodesConfig = useOfferCodesConfig();
  const stockControl = useStockControlConfig();
  const [{ data, fetching, error }, reexecuteQuery] = useQuery({
    query: FetchCartQuery,
    variables: {
      userId: user.id,
    },
  });

  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [bulkGuardOpen, setBulkGuardOpen] = useState(false);
  const [deliveryState, setDeliveryState] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [, updateCartProduct] = useMutation(updateCartsMutation);
  const [, removeCart] = useMutation(RemoveCartsMutation);
  const localCart = useCartStore((s) => s.cart);
  const setProductSize = useCartStore((s) => s.setProductSize);
  const [sizeConfigsByProductId, setSizeConfigsByProductId] = useState<
    Record<string, CartSizeConfig>
  >({});

  const cart: CartEdge[] =
    data?.cartsCollection?.edges?.filter((edge) => edge.node.product) ?? [];
  const subtotal = useMemo(() => calcSubtotal(cart), [cart]);
  const productCount = useMemo(() => calcProductCount(cart), [cart]);
  const courierBreakdown = useMemo(() => {
    if (!courierConfig.enabled || !deliveryState) return null;
    return calculateCourierCharge({
      state: deliveryState,
      quantity: productCount,
      config: courierConfig,
    });
  }, [courierConfig, deliveryState, productCount]);
  const courierCharge = courierBreakdown?.charge ?? 0;
  const activeOfferCodes = useMemo(() => {
    const map = new Map<string, number>();
    if (!offerCodesConfig.enabled) return map;
    offerCodesConfig.codes.forEach((item) => {
      if (!item.enabled) return;
      map.set(item.code, item.percentage);
    });
    return map;
  }, [offerCodesConfig.codes, offerCodesConfig.enabled]);
  const promoPercentage = appliedPromoCode
    ? activeOfferCodes.get(appliedPromoCode) ?? 0
    : 0;
  const discountAmount = Math.round(subtotal * promoPercentage * 100) / 10000;
  const discountedSubtotal = Math.max(0, subtotal - discountAmount);
  const hasDeliveryStateSelected = deliveryState.trim().length > 0;
  const gstAmount = calculateGstAmount({
    taxableAmount: discountedSubtotal + courierCharge,
    config: courierConfig,
  });
  const totalAmount = discountedSubtotal + courierCharge + gstAmount;

  useEffect(() => {
    const draft = loadCheckoutAddressDraft();
    if (draft?.state) setDeliveryState(draft.state);
  }, []);

  const onStateChange = (state: string) => {
    setDeliveryState(state);
    saveCheckoutAddressDraft({ state });
  };

  const onApplyPromo = () => {
    const normalized = promoInput.toUpperCase().replace(/\s+/g, "");
    if (!normalized) {
      toast({
        title: "Enter promo code",
        description: "Please type an offer code to apply.",
        variant: "destructive",
      });
      return;
    }
    const percentage = activeOfferCodes.get(normalized);
    if (!percentage) {
      toast({
        title: "Invalid code",
        description: "Offer code not found or disabled.",
        variant: "destructive",
      });
      return;
    }
    setAppliedPromoCode(normalized);
    toast({
      title: "Offer applied",
      description: `${normalized} gives ${percentage}% off before courier.`,
    });
  };

  const onRemovePromo = () => {
    setAppliedPromoCode(null);
    setPromoInput("");
  };

  useEffect(() => {
    let active = true;
    const productIds = cart.map(({ node }) => node.product_id);
    if (productIds.length === 0) {
      setSizeConfigsByProductId({});
      return;
    }

    const loadSizeConfigs = async () => {
      const entries = await Promise.all(
        productIds.map(async (productId) => {
          try {
            const res = await fetchWithTimeout(
              `/api/products/size-config?productId=${encodeURIComponent(productId)}`,
              { cache: "no-store" },
            );
            if (!res.ok)
              return [productId, { enabled: false, options: [] }] as const;
            const payload = (await res.json()) as CartSizeConfig;
            return [productId, payload] as const;
          } catch {
            return [productId, { enabled: false, options: [] }] as const;
          }
        }),
      );
      if (!active) return;
      setSizeConfigsByProductId(Object.fromEntries(entries));
    };

    void loadSizeConfigs();
    return () => {
      active = false;
    };
  }, [cart]);

  const missingSizeProductNames = useMemo(
    () =>
      cart
        .filter(({ node }) => {
          const config = sizeConfigsByProductId[node.product_id];
          const hasLabeledOptions = Boolean(
            config?.enabled &&
              config.options.some(
                (option) => String(option.size ?? "").trim().length > 0,
              ),
          );
          const selected = String(localCart[node.product_id]?.size ?? "")
            .trim()
            .toUpperCase();
          return hasLabeledOptions && !selected;
        })
        .map(({ node }) => node.product?.name)
        .filter((name): name is string => Boolean(name)),
    [cart, localCart, sizeConfigsByProductId],
  );

  if (fetching) {
    return <LoadingCartSection />;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data || !data.cartsCollection) return notFound();

  const addOneHandler = async (
    productId: string,
    quantity: number,
    stock: number | null,
  ) => {
    if (
      bulkOrder.enabled &&
      isBulkOrderQuantity(quantity + 1, bulkOrder.threshold)
    ) {
      setBulkGuardOpen(true);
      return;
    }
    if (
      stockControl.enabled &&
      typeof stock === "number" &&
      quantity + 1 > stock
    ) {
      toast({
        title: "Stock limit reached",
        description: `Only ${stock} left in stock for this product.`,
        variant: "destructive",
      });
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
        size: localCart[product.id]?.size,
      };
    });
    return cart;
  };

  return (
    <>
      {data.cartsCollection && cart.length > 0 ? (
        <section
          aria-label="Cart Section"
          className="grid grid-cols-12 gap-x-6 gap-y-5"
        >
          <div className="col-span-12 md:col-span-9 max-h-[420px] overflow-y-auto">
            {cart.map(({ node }) =>
              (() => {
                const config = sizeConfigsByProductId[node.product_id];
                const hasLabeledOptions = Boolean(
                  config?.enabled &&
                    config.options.some(
                      (option) => String(option.size ?? "").trim().length > 0,
                    ),
                );
                const sizeOptions = (config?.options ?? [])
                  .filter((option) => Number(option.qty ?? 0) > 0)
                  .map((option) => {
                    const normalized = String(option.size ?? "")
                      .trim()
                      .toUpperCase();
                    const label = normalized || `${option.qty}`;
                    return { value: normalized, label };
                  })
                  .filter((option) => option.value.length > 0);

                return (
                  <CartItemCard
                    key={node.product_id}
                    id={node.product_id}
                    product={node.product!}
                    quantity={node.quantity}
                    selectedSize={localCart[node.product_id]?.size}
                    sizeRequired={hasLabeledOptions}
                    sizeOptions={sizeOptions}
                    onSizeChange={(size) =>
                      setProductSize(node.product_id, size)
                    }
                    addOneHandler={() =>
                      addOneHandler(
                        node.product_id,
                        node.quantity,
                        node.product?.stock ?? null,
                      )
                    }
                    minusOneHandler={() =>
                      minusOneHandler(node.product_id, node.quantity)
                    }
                    removeHandler={() => removeHandler(node.product_id)}
                    disabled={isLoading}
                  />
                );
              })(),
            )}
          </div>

          <Card className="w-full px-3 col-span-12 md:col-span-3">
            <CardHeader className="px-3 pt-2 pb-0 text-md">
              <CardTitle className="text-lg mb-0">Summary</CardTitle>
              <CardDescription>{`${productCount} Items`}</CardDescription>
            </CardHeader>
            <CardContent className="relative overflow-hidden px-3 py-2">
              <label className="mb-3 block text-xs font-medium text-muted-foreground">
                Delivery state
              </label>
              <select
                className={cn(
                  "mb-1 w-full rounded-md border bg-background px-3 py-2 text-sm",
                  !hasDeliveryStateSelected &&
                    "border-destructive ring-1 ring-destructive/30",
                )}
                value={deliveryState}
                onChange={(event) => onStateChange(event.target.value)}
              >
                <option value="">Select state</option>
                {INDIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
              {!hasDeliveryStateSelected ? (
                <p className="mb-3 text-xs text-destructive">
                  Delivery state is required to continue checkout.
                </p>
              ) : (
                <div className="mb-3" />
              )}
              <label className="mb-2 block text-xs font-medium text-muted-foreground">
                Promo code
              </label>
              <div className="mb-4 flex items-center gap-2">
                <Input
                  value={promoInput}
                  onChange={(event) =>
                    setPromoInput(
                      event.target.value.toUpperCase().replace(/\s+/g, ""),
                    )
                  }
                  placeholder="ENTER CODE"
                  className="h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  className="h-9"
                  onClick={onApplyPromo}
                >
                  Apply
                </Button>
              </div>
              {appliedPromoCode ? (
                <div className="mb-3 flex items-center justify-between rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                  <span>
                    {appliedPromoCode} ({promoPercentage}%)
                  </span>
                  <button type="button" onClick={onRemovePromo}>
                    Remove
                  </button>
                </div>
              ) : null}

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Discount</span>
                  <span>
                    {promoPercentage > 0
                      ? `- ${formatPrice(discountAmount)}`
                      : formatPrice(0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Subtotal after discount</span>
                  <span>{formatPrice(discountedSubtotal)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Courier</span>
                  <span>
                    {courierBreakdown
                      ? formatPrice(courierBreakdown.charge)
                      : "Select state"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>GST</span>
                  <span>
                    {courierConfig.gstEnabled
                      ? formatPrice(gstAmount)
                      : "Not applied"}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t pt-2 font-semibold">
                  <span>Total</span>
                  <span>
                    {courierBreakdown
                      ? formatPrice(totalAmount)
                      : "Select state"}
                  </span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="gap-x-2 md:gap-x-5 px-3">
              <CheckoutButton
                guest={false}
                disabled={isLoading}
                order={createCartObject(data)}
                promoCode={appliedPromoCode}
                missingSizeProductNames={missingSizeProductNames}
                requireDeliveryStateSelection
                hasDeliveryStateSelected={hasDeliveryStateSelected}
              />
            </CardFooter>
          </Card>
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
    className="grid grid-cols-12 gap-x-6 gap-y-5"
    aria-label="Loading Skeleton"
  >
    <div className="col-span-12 md:col-span-9 space-y-8">
      {[...Array(4)].map((_, index) => (
        <div
          className="flex items-center justify-between gap-x-6 gap-y-8 border-b p-5"
          key={index}
        >
          <Skeleton className="h-[120px] w-[120px]" />
          <div className="space-y-3 w-full">
            <Skeleton className="h-6 max-w-xs" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4 w-full max-w-xl" />
            <Skeleton className="h-4 w-full max-w-lg" />
          </div>
        </div>
      ))}
    </div>
    <div className="w-full h-[180px] px-3 col-span-12 md:col-span-3 border p-5">
      <div className="space-y-3 w-full">
        <Skeleton className="h-6 max-w-xs" />
        <Skeleton className="h-4" />
        <Skeleton className="h-4 mb-6" />
        <Skeleton className="h-4 mb-6 max-w-[280px]" />
      </div>
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
