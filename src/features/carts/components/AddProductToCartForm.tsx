"use client";
import { QuantityInput } from "@/components/layouts/QuantityInput";
import { Button } from "@/components/ui/button";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { useAuth } from "@/providers/AuthProvider";
import BulkOrderGuardDialog from "./BulkOrderGuardDialog";
import {
  BULK_ORDER_MIN_QTY,
  isBulkOrderQuantity,
} from "../constants/bulkOrder";
import useCartActions from "../hooks/useCartActions";
import { AddProductCartData, AddProductToCartSchema } from "../validations";

interface AddProductToCartFormProps {
  productId: string;
}

function AddProductToCartForm({ productId }: AddProductToCartFormProps) {
  const { user } = useAuth();
  const { addProductToCart } = useCartActions(user, productId);
  const [bulkGuardOpen, setBulkGuardOpen] = useState(false);

  const form = useForm<AddProductCartData>({
    resolver: zodResolver(AddProductToCartSchema),
    defaultValues: {
      quantity: 1,
    },
  });

  async function onSubmit(values: AddProductCartData) {
    if (isBulkOrderQuantity(values.quantity)) {
      setBulkGuardOpen(true);
      return;
    }
    const res = await addProductToCart(values.quantity);
    if (res?.blockedBulk) {
      setBulkGuardOpen(true);
    }
  }

  const addOne = () => {
    const currQuantity = form.getValues("quantity");
    const nextQuantity = currQuantity + 1;
    if (isBulkOrderQuantity(nextQuantity)) {
      setBulkGuardOpen(true);
      return;
    }
    form.setValue("quantity", nextQuantity);
  };
  const minusOne = () => {
    const currQuantity = form.getValues("quantity");
    if (currQuantity > 1) form.setValue("quantity", currQuantity - 1);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity</FormLabel>
              <FormControl>
                <QuantityInput
                  {...field}
                  addOneHandler={addOne}
                  minusOneHandler={minusOne}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Add to Cart</Button>
      </form>
      <BulkOrderGuardDialog
        open={bulkGuardOpen}
        onOpenChange={setBulkGuardOpen}
      />
    </Form>
  );
}

export default AddProductToCartForm;
