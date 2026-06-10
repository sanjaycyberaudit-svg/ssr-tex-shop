"use client";
import { DocumentType, gql } from "@/gql";
import {
  calculateCourierCharge,
  calculateGstAmount,
} from "@/lib/courier/calculate";
import { fetchWithTimeout } from "@/lib/network/fetchWithTimeout";
import { useQuery } from "@urql/next";
import { cn, formatPrice } from "@/lib/utils";
import { useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import EmptyCart from "./EmptyCart";
import CartItemCard from "./CartItemCard";
import CheckoutButton from "./CheckoutButton";
import BulkOrderGuardDialog from "./BulkOrderGuardDialog";
import useCartStore, {
  CartItems,
  calcProductCountStorage,
} from "../useCartStore";
import { useBulkOrderGuardConfig } from "@/providers/BulkOrderGuardProvider";
import { useCourierChargesConfig } from "@/providers/CourierChargesProvider";
import { useOfferCodesConfig } from "@/providers/OfferCodesProvider";
import { useStockControlConfig } from "@/providers/StockControlProvider";
import { INDIAN_STATES } from "@/features/addresses/constants/indianStates";
import {
  loadCheckoutAddressDraft,
  saveCheckoutAddressDraft,
} from "@/features/addresses/lib/checkoutAddressDraft";
import { isBulkOrderQuantity } from "../constants/bulkOrder";
import { useToast } from "@/components/ui/use-toast";

type CartSizeConfigOption = {
  size: string;
  qty: number;
};

type CartSizeConfig = {
  enabled: boolean;
  options: CartSizeConfigOption[];
};

function GuestCartSection() {
  const { toast } = useToast();
  const bulkOrder = useBulkOrderGuardConfig();
  const courierConfig = useCourierChargesConfig();
  const offerCodesConfig = useOfferCodesConfig();
  const stockControl = useStockControlConfig();
  const [bulkGuardOpen, setBulkGuardOpen] = useState(false);
  const [deliveryState, setDeliveryState] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const cartItems = useCartStore((s) => s.cart);
  const addProductToCart = useCartStore((s) => s.addProductToCart);
  const removeProduct = useCartStore((s) => s.removeProduct);
  const setProductSize = useCartStore((s) => s.setProductSize);
  const [sizeConfigsByProductId, setSizeConfigsByProductId] = useState<
    Record<string, CartSizeConfig>
  >({});

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

  const cartLines = useMemo(
    () =>
      data?.productsCollection?.edges?.filter(
        ({ node }) => cartItems[node.id],
      ) ?? [],
    [cartItems, data?.productsCollection?.edges],
  );

  useEffect(() => {
    let active = true;
    if (cartProductIds.length === 0) {
      setSizeConfigsByProductId({});
      return;
    }

    const loadSizeConfigs = async () => {
      const entries = await Promise.all(
        cartProductIds.map(async (productId) => {
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
  }, [cartProductIds]);

  const missingSizeProductNames = useMemo(
    () =>
      cartLines
        .filter(({ node }) => {
          const config = sizeConfigsByProductId[node.id];
          const hasLabeledOptions = Boolean(
            config?.enabled &&
              config.options.some(
                (option) => String(option.size ?? "").trim().length > 0,
              ),
          );
          const selected = String(cartItems[node.id]?.size ?? "")
            .trim()
            .toUpperCase();
          return hasLabeledOptions && !selected;
        })
        .map(({ node }) => node.name)
        .filter((name): name is string => Boolean(name)),
    [cartItems, cartLines, sizeConfigsByProductId],
  );
  if (cartProductIds.length === 0) return <EmptyCart />;
  if (fetching) return LoadingCartSection();
  if (error) return <div>Error</div>;
  if (!data?.productsCollection?.edges?.length) return <EmptyCart />;

  const addOneHandler = (
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
          className="grid grid-cols-12 gap-x-6 gap-y-5"
        >
          <div className="col-span-12 md:col-span-9 max-h-[420px] md:max-h-[640px] overflow-y-auto">
            {cartLines.map(({ node }) =>
              (() => {
                const config = sizeConfigsByProductId[node.id];
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
                    key={node.id}
                    id={node.id}
                    product={node}
                    quantity={cartItems[node.id]?.quantity ?? 0}
                    selectedSize={cartItems[node.id]?.size}
                    sizeRequired={hasLabeledOptions}
                    sizeOptions={sizeOptions}
                    onSizeChange={(size) => setProductSize(node.id, size)}
                    addOneHandler={() =>
                      addOneHandler(
                        node.id,
                        cartItems[node.id].quantity,
                        node.stock ?? null,
                      )
                    }
                    minusOneHandler={() =>
                      minusOneHandler(node.id, cartItems[node.id].quantity)
                    }
                    removeHandler={() => removeHandler(node.id)}
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
                guest={true}
                order={cartItems}
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

export default GuestCartSection;

export const LoadingCartSection = () => (
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
