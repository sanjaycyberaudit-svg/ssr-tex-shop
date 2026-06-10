"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AddAddressDialog } from "@/features/addresses";
import type { AddressFormValues } from "@/features/addresses";
import { createShippingAddress } from "@/_actions/address";
import { clearCheckoutAddressDraft } from "@/features/addresses/lib/checkoutAddressDraft";
import { startCheckout } from "@/features/checkout/startCheckout";
import { useAuth } from "@/providers/AuthProvider";
import { useStockControlConfig } from "@/providers/StockControlProvider";

type BuyNowButtonProps = {
  productId: string;
  quantity?: number;
  stock?: number | null;
};

function BuyNowButton({ productId, quantity = 1, stock }: BuyNowButtonProps) {
  const { user } = useAuth();
  const stockControl = useStockControlConfig();
  const { toast } = useToast();
  const isOutOfStock =
    stockControl.enabled && typeof stock === "number" && stock <= 0;

  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
    setIsProcessing(true);
    try {
      const saved = await createShippingAddress(values, user?.id ?? null);
      await startCheckout({
        order: { [productId]: { quantity } },
        guest: !user,
        shipping: saved,
      });
    } catch (err) {
      toast({
        title: "Could not complete purchase",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <Button
        type="button"
        disabled={isProcessing || isOutOfStock}
        onClick={() => setOpen(true)}
      >
        {isOutOfStock
          ? "Out of Stock"
          : isProcessing
            ? "Processing…"
            : "Buy Now"}
      </Button>

      <AddAddressDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleAddressSubmit}
        persistDraft
        submitLabel="Continue to payment"
        defaultValues={accountDefaults}
      />
    </>
  );
}

export default BuyNowButton;
