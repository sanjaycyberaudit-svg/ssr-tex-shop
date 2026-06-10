"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { fetchWithTimeout } from "@/lib/network/fetchWithTimeout";
import type { CartItems } from "@/features/carts";
import { AddAddressDialog } from "@/features/addresses";
import type { AddressFormValues } from "@/features/addresses";
import { createShippingAddress } from "@/_actions/address";
import { clearCheckoutAddressDraft } from "@/features/addresses/lib/checkoutAddressDraft";
import { startCheckout } from "@/features/checkout/startCheckout";
import BulkOrderGuardDialog from "@/features/carts/components/BulkOrderGuardDialog";
import { isBulkOrderQuantity } from "@/features/carts/constants/bulkOrder";
import { useAuth } from "@/providers/AuthProvider";
import { useBulkOrderGuardConfig } from "@/providers/BulkOrderGuardProvider";

type CheckoutButtonProps = React.ComponentProps<typeof Button> & {
  order: CartItems;
  guest: boolean;
  promoCode?: string | null;
  missingSizeProductNames?: string[];
  requireDeliveryStateSelection?: boolean;
  hasDeliveryStateSelected?: boolean;
};

function CheckoutButton({
  order,
  guest,
  promoCode,
  missingSizeProductNames = [],
  requireDeliveryStateSelection = false,
  hasDeliveryStateSelected = true,
  ...props
}: CheckoutButtonProps) {
  const { user } = useAuth();
  const bulkOrder = useBulkOrderGuardConfig();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [bulkGuardOpen, setBulkGuardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasBulkLineItem = useMemo(
    () =>
      bulkOrder.enabled &&
      Object.values(order).some((item) =>
        isBulkOrderQuantity(item.quantity, bulkOrder.threshold),
      ),
    [bulkOrder.enabled, bulkOrder.threshold, order],
  );
  const checkoutQuantity = useMemo(
    () => Object.values(order).reduce((sum, item) => sum + item.quantity, 0),
    [order],
  );

  const accountDefaults = useMemo(
    () =>
      user?.email
        ? {
            email: user.email,
            fullName:
              (user.user_metadata?.full_name as string | undefined) ?? "",
          }
        : undefined,
    [user?.email, user?.user_metadata?.full_name],
  );

  const handleAddressSubmit = async (values: AddressFormValues) => {
    setIsLoading(true);
    try {
      const saved = await createShippingAddress(
        values,
        guest ? null : user?.id ?? null,
      );
      await startCheckout({
        order,
        guest,
        shipping: saved,
        promoCode: promoCode ?? null,
      });
      clearCheckoutAddressDraft();
    } catch (err) {
      toast({
        title: "Checkout failed",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        {...props}
        className={cn("w-full", props.className)}
        onClick={async () => {
          if (requireDeliveryStateSelection && !hasDeliveryStateSelected) {
            toast({
              title: "Select delivery state",
              description:
                "Please select your delivery state in cart summary before checkout.",
              variant: "destructive",
            });
            return;
          }
          if (missingSizeProductNames.length > 0) {
            toast({
              title: "Select size in cart",
              description: `${missingSizeProductNames[0]}: please select a size before checkout.`,
              variant: "destructive",
            });
            return;
          }
          const uncheckedIds = Object.entries(order)
            .filter(
              ([, item]) =>
                !String(item.size ?? "")
                  .trim()
                  .toUpperCase(),
            )
            .map(([productId]) => productId);
          if (uncheckedIds.length > 0) {
            const results = await Promise.all(
              uncheckedIds.map(async (productId) => {
                try {
                  const res = await fetchWithTimeout(
                    `/api/products/size-config?productId=${encodeURIComponent(productId)}`,
                    { cache: "no-store" },
                  );
                  if (!res.ok) return { productId, required: false };
                  const payload = (await res.json()) as { enabled?: boolean };
                  return { productId, required: Boolean(payload.enabled) };
                } catch {
                  return { productId, required: false };
                }
              }),
            );
            const requiredMissing = results.find((result) => result.required);
            if (requiredMissing) {
              toast({
                title: "Select size in cart",
                description:
                  "Please select size for all size-enabled products before checkout.",
                variant: "destructive",
              });
              return;
            }
          }
          if (hasBulkLineItem) {
            setBulkGuardOpen(true);
            return;
          }
          setOpen(true);
        }}
        disabled={isLoading || props.disabled}
      >
        {isLoading ? "Loading…" : "Check out"}
        {isLoading && (
          <Spinner className="ml-3 h-4 w-4 animate-spin" aria-hidden="true" />
        )}
      </Button>

      <AddAddressDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleAddressSubmit}
        persistDraft
        submitLabel="Continue to payment"
        defaultValues={accountDefaults}
        checkoutQuantity={checkoutQuantity}
      />

      <BulkOrderGuardDialog
        open={bulkGuardOpen}
        onOpenChange={setBulkGuardOpen}
      />
    </>
  );
}

export default CheckoutButton;
