"use client";

import { useAuth } from "@/providers/AuthProvider";
import { Suspense, useState } from "react";

import { Icons } from "@/components/layouts/icons";
import { Button, ButtonProps } from "@/components/ui/button";
import BulkOrderGuardDialog from "./BulkOrderGuardDialog";
import { isBulkOrderQuantity } from "../constants/bulkOrder";
import useCartActions from "../hooks/useCartActions";

interface AddToCartButtonProps extends ButtonProps {
  productId: string;
  quantity?: number;
  cartId?: string;
}

function AddToCartButton({ productId, quantity = 1 }: AddToCartButtonProps) {
  const { user } = useAuth();
  const { addProductToCart } = useCartActions(user, productId);
  const [bulkGuardOpen, setBulkGuardOpen] = useState(false);

  return (
    <Suspense>
      <Button
        className="rounded-full p-0 h-8 w-8"
        onClick={async () => {
          if (isBulkOrderQuantity(quantity)) {
            setBulkGuardOpen(true);
            return;
          }
          const res = await addProductToCart(quantity);
          if (res?.blockedBulk) {
            setBulkGuardOpen(true);
          }
        }}
      >
        <Icons.basket className="h-5 w-5 md:h-4 md:w-4" />
      </Button>
      <BulkOrderGuardDialog
        open={bulkGuardOpen}
        onOpenChange={setBulkGuardOpen}
      />
    </Suspense>
  );
}

export default AddToCartButton;
