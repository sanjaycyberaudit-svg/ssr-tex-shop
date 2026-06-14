"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { CheckoutAddressDialog } from "@/features/addresses";
import type { SavedShippingAddress } from "@/features/addresses";
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

  const handleCheckoutComplete = async (shipping: SavedShippingAddress) => {
    setIsProcessing(true);
    try {
      await startCheckout({
        order: { [productId]: { quantity } },
        guest: !user,
        shipping,
      });
      clearCheckoutAddressDraft();
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

      <CheckoutAddressDialog
        open={open}
        onOpenChange={setOpen}
        onComplete={handleCheckoutComplete}
        guest={!user}
        userId={user?.id}
        accountDefaults={accountDefaults}
        submitLabel="Continue to payment"
        checkoutQuantity={quantity}
      />
    </>
  );
}

export default BuyNowButton;
