"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import useCartActions from "../hooks/useCartActions";

function parseQuantity(raw: string | null): number {
  const n = parseInt(raw || "1", 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function CartDeepLinkAddInner({
  productId,
  quantity,
}: {
  productId: string;
  quantity: number;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { addProductToCart } = useCartActions(user, productId);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      await addProductToCart(quantity);
      router.replace("/cart");
    })();
  }, [addProductToCart, quantity, router]);

  return null;
}

function CartDeepLinkAddContent() {
  const searchParams = useSearchParams();
  const add = searchParams.get("add") ?? searchParams.get("productId");
  const productId = add?.trim() ?? "";
  if (!productId) return null;

  const quantity = parseQuantity(
    searchParams.get("quantity") ?? searchParams.get("qty"),
  );

  return <CartDeepLinkAddInner productId={productId} quantity={quantity} />;
}

/** Adds product from Velo share links: /cart?add={productId}&quantity=1 */
export default function CartDeepLinkAdd() {
  return (
    <Suspense fallback={null}>
      <CartDeepLinkAddContent />
    </Suspense>
  );
}
