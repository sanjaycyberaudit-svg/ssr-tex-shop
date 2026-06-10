"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type CartItemsListProps = {
  children: ReactNode;
  className?: string;
};

/** Cart lines: one page scroll on mobile; optional inner scroll on desktop only. */
export function CartItemsList({ children, className }: CartItemsListProps) {
  return (
    <div
      className={cn(
        "col-span-12 divide-y divide-border md:col-span-9 md:max-h-[min(640px,70vh)] md:overflow-y-auto md:pr-1",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Bottom space so last line + recommendations clear the mobile sticky checkout bar. */
export function cartPageBottomSpacerClass() {
  return "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0";
}
