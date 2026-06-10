"use client";

import type { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";

type CartCheckoutSummaryProps = {
  productCount: number;
  subtotal: number;
  checkout: ReactNode;
};

/** Desktop sidebar + mobile sticky checkout bar (single page scroll). */
export function CartCheckoutSummary({
  productCount,
  subtotal,
  checkout,
}: CartCheckoutSummaryProps) {
  const itemLabel = productCount === 1 ? "1 item" : `${productCount} items`;

  return (
    <>
      <Card className="hidden w-full md:col-span-3 md:flex md:h-fit md:flex-col md:px-3">
        <CardHeader className="px-3 pt-3 pb-0">
          <CardTitle className="mb-0 text-lg">Subtotal</CardTitle>
          <CardDescription>{itemLabel}</CardDescription>
        </CardHeader>
        <CardContent className="px-3 py-2">
          <p className="text-2xl font-bold">{formatPrice(subtotal)}</p>
        </CardContent>
        <CardFooter className="px-3 pb-3">{checkout}</CardFooter>
      </Card>

      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">{itemLabel}</p>
            <p className="text-lg font-bold leading-tight">
              {formatPrice(subtotal)}
            </p>
          </div>
          <div className="shrink-0 [&_button]:h-10 [&_button]:min-w-[6.5rem] [&_button]:w-auto [&_button]:px-4 [&_button]:text-sm">
            {checkout}
          </div>
        </div>
      </div>
    </>
  );
}
