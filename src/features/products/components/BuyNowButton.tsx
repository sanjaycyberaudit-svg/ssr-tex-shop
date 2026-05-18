"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { AddAddressDialog } from "@/features/addresses";
import type { AddressFormValues } from "@/features/addresses";
import { createShippingAddress } from "@/_actions/address";
import { startCheckout } from "@/features/checkout/startCheckout";
import { useAuth } from "@/providers/AuthProvider";

type BuyNowButtonProps = {
  productId: string;
  quantity?: number;
};

function BuyNowButton({ productId, quantity = 1 }: BuyNowButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

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
        description:
          err instanceof Error ? err.message : "Please try again.",
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
        disabled={isProcessing}
        onClick={() => setOpen(true)}
      >
        {isProcessing ? "Processing…" : "Buy Now"}
      </Button>

      <AddAddressDialog
        open={open}
        onOpenChange={setOpen}
        onSubmit={handleAddressSubmit}
        submitLabel="Continue to payment"
        defaultValues={
          user?.email
            ? {
                email: user.email,
                fullName: user.user_metadata?.full_name ?? "",
              }
            : undefined
        }
      />
    </>
  );
}

export default BuyNowButton;
