"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import useCartStore from "../useCartStore";
import useCartActions from "../hooks/useCartActions";
import {
  claimDeepLink,
  linesFingerprint,
  parseDeepLinkLines,
  releaseDeepLinkInflight,
  type CartDeepLinkLine,
  wasDeepLinkProcessed,
} from "./cart-deeplink-utils";

export { parseCartItemsParam } from "./cart-deeplink-utils";

function AuthCartLineAdd({
  productId,
  quantity,
  onDone,
}: {
  productId: string;
  quantity: number;
  onDone: (ok: boolean) => void;
}) {
  const { user } = useAuth();
  const { addProductToCart } = useCartActions(user, productId);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void addProductToCart(quantity, { silent: true })
      .then((result) => onDone(result.added))
      .catch(() => onDone(false));
  }, [addProductToCart, onDone, quantity]);

  return null;
}

function CartDeepLinkAddRunner({
  lines,
  fingerprint,
}: {
  lines: CartDeepLinkLine[];
  fingerprint: string;
}) {
  const { user } = useAuth();
  const guestAdd = useCartStore((s) => s.addProductToCart);
  const guestRan = useRef(false);
  const [authIndex, setAuthIndex] = useState(0);
  const finishedRef = useRef(false);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    releaseDeepLinkInflight(fingerprint);
  }, [fingerprint]);

  useEffect(() => {
    if (user || lines.length === 0 || guestRan.current) return;
    guestRan.current = true;
    for (const line of lines) {
      guestAdd(line.productId, line.quantity);
    }
    finish();
  }, [finish, guestAdd, lines, user]);

  useEffect(() => {
    if (!user || authIndex < lines.length) return;
    finish();
  }, [authIndex, finish, lines.length, user]);

  if (!user || lines.length === 0) return null;
  if (authIndex >= lines.length) return null;

  const line = lines[authIndex]!;
  return (
    <AuthCartLineAdd
      key={`${line.productId}-${authIndex}`}
      productId={line.productId}
      quantity={line.quantity}
      onDone={(ok) => {
        if (!ok) finish();
        setAuthIndex((i) => i + 1);
      }}
    />
  );
}

function CartDeepLinkAddContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const consumedRef = useRef(false);
  const [pending, setPending] = useState<{
    lines: CartDeepLinkLine[];
    fingerprint: string;
  } | null>(null);

  const queryKey = searchParams.toString();

  const urlLines = useMemo(
    () => parseDeepLinkLines(searchParams),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- queryKey captures param changes
    [queryKey],
  );

  useEffect(() => {
    if (consumedRef.current || urlLines.length === 0) return;

    const fingerprint = linesFingerprint(urlLines);
    consumedRef.current = true;

    if (wasDeepLinkProcessed(fingerprint)) {
      if (queryKey) router.replace("/cart", { scroll: false });
      return;
    }

    if (!claimDeepLink(fingerprint)) {
      if (queryKey) router.replace("/cart", { scroll: false });
      return;
    }

    if (queryKey) router.replace("/cart", { scroll: false });

    setPending({ lines: urlLines, fingerprint });
  }, [queryKey, router, urlLines]);

  if (!pending?.lines.length) return null;
  return (
    <CartDeepLinkAddRunner
      lines={pending.lines}
      fingerprint={pending.fingerprint}
    />
  );
}

/** Velo share links: /cart?items=id:qty,id:qty or /cart?add=id&quantity=1 */
export default function CartDeepLinkAdd() {
  return (
    <Suspense fallback={null}>
      <CartDeepLinkAddContent />
    </Suspense>
  );
}
