"use client";

import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { PhoneCall } from "lucide-react";
import { Icons } from "@/components/layouts/icons";
import type { CartItems } from "@/features/carts";
import { AddAddressDialog } from "@/features/addresses";
import type { AddressFormValues } from "@/features/addresses";
import { createShippingAddress } from "@/_actions/address";
import { clearCheckoutAddressDraft } from "@/features/addresses/lib/checkoutAddressDraft";
import { startCheckout } from "@/features/checkout/startCheckout";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/providers/AuthProvider";
import { useStorefrontSocial } from "@/providers/SocialLinksProvider";

type CheckoutButtonProps = React.ComponentProps<typeof Button> & {
  order: CartItems;
  guest: boolean;
};

function CheckoutButton({ order, guest, ...props }: CheckoutButtonProps) {
  const { user } = useAuth();
  const social = useStorefrontSocial();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [bulkGuardOpen, setBulkGuardOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const hasBulkLineItem = useMemo(
    () => Object.values(order).some((item) => item.quantity >= 10),
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
        onClick={() => {
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
      />

      <Dialog open={bulkGuardOpen} onOpenChange={setBulkGuardOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk order verification required</DialogTitle>
            <DialogDescription className="space-y-2 pt-1 leading-relaxed text-left">
              <p>
                For 10+ quantity, manufacturing/availability confirmation is
                required. Please call or WhatsApp us and verify before placing
                order.
              </p>
              <p lang="ta">
                10 அல்லது அதற்கு மேற்பட்ட அளவு ஆர்டருக்கு, தயாரிப்பு /
                கிடைப்புத் தகவல் உறுதி அவசியம். ஆர்டர் வைக்கும் முன் தயவுசெய்து
                எங்களை அழைக்கவும் அல்லது WhatsApp மூலம் தொடர்பு கொண்டு
                உறுதிப்படுத்தவும்.
              </p>
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button asChild className="w-full bg-[#0EA5E9] hover:bg-[#0284C7]">
              <a href={siteConfig.phoneHref}>
                <PhoneCall className="mr-2 h-4 w-4" />
                Call now
              </a>
            </Button>
            <Button
              asChild
              className="w-full bg-[#25D366] text-white hover:bg-[#1ea857]"
            >
              <a
                href={social.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icons.whatsapp className="mr-2 h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setBulkGuardOpen(false)}
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CheckoutButton;
