import CartDeepLinkAdd from "@/features/carts/components/CartDeepLinkAdd";
import CartSection from "@/features/carts/components/CartSection";
import CartSectionSkeleton from "@/features/carts/components/CartSectionSkeleton";
import { Shell } from "@/components/layouts/Shell";
import {
  RecommendationProducts,
  RecommendationProductsSkeleton,
} from "@/features/products";

import Link from "next/link";
import { Suspense } from "react";

async function CartPage() {
  return (
    <Shell>
      <section className="flex items-center justify-between gap-3 py-4 md:py-8">
        <h1 className="text-2xl font-bold md:text-3xl">Your Cart</h1>
        <Link
          href="/shop"
          className="shrink-0 text-sm font-medium text-primary md:text-base"
        >
          Continue shopping
        </Link>
      </section>

      <CartDeepLinkAdd />

      <Suspense fallback={<CartSectionSkeleton />}>
        <CartSection />
      </Suspense>

      <div className="mt-6 hidden md:block">
        <Suspense fallback={<RecommendationProductsSkeleton />}>
          <RecommendationProducts />
        </Suspense>
      </div>
    </Shell>
  );
}

export default CartPage;
