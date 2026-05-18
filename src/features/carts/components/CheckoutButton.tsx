"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { CartItems } from "@/features/carts";
import { AddAddressDialog } from "@/features/addresses";
import type { AddressFormValues } from "@/features/addresses";
import { createShippingAddress } from "@/_actions/address";
import { startCheckout } from "@/features/checkout/startCheckout";
import { useAuth } from "@/providers/AuthProvider";

type CheckoutButtonProps = React.ComponentProps<typeof Button> & {
  order: CartItems;
  guest: boolean;
};

function CheckoutButton({ order, guest, ...props }: CheckoutButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      });
    } catch (err) {
      toast({
        title: "Checkout failed",
        description:
          err instanceof Error ? err.message : "Please try again.",
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
        onClick={() => setOpen(true)}
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

export default CheckoutButton;
