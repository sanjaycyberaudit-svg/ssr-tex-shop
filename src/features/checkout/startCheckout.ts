import type { CartItems } from "@/features/carts";
import type { SavedShippingAddress } from "@/features/addresses/validations/addressFormSchema";
import { getStripe } from "@/lib/stripe/stripeClient";

type StartCheckoutParams = {
  order: CartItems;
  guest: boolean;
  shipping: SavedShippingAddress;
};

export async function startCheckout({
  order,
  guest,
  shipping,
}: StartCheckoutParams) {
  const res = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderProducts: order,
      guest,
      shipping: {
        addressId: shipping.addressId,
        fullName: shipping.fullName,
        email: shipping.email,
        mobile: shipping.mobile,
      },
    }),
  });

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as
      | { message?: string }
      | null;
    const message = payload?.message || "Checkout failed";
    throw new Error(message);
  }

  const payload = (await res.json()) as
    | {
        provider: "cashfree";
        paymentSessionId: string;
        environment: "sandbox" | "production";
      }
    | { provider: "phonepe"; redirectUrl: string }
    | { provider: "stripe"; sessionId: string };

  if (payload.provider === "cashfree") {
    const sdk = await loadCashfreeSdk();
    const cashfree = sdk({
      mode: payload.environment === "production" ? "production" : "sandbox",
    });
    await cashfree.checkout({
      paymentSessionId: payload.paymentSessionId,
      redirectTarget: "_self",
    });
    return;
  }

  if (payload.provider === "phonepe") {
    window.location.assign(payload.redirectUrl);
    return;
  }

  const { sessionId } = payload;
  const stripe = await getStripe();
  const result = await stripe?.redirectToCheckout({ sessionId });

  if (result?.error) {
    throw new Error(result.error.message);
  }
}

type CashfreeCheckout = (params: {
  paymentSessionId: string;
  redirectTarget?: "_self" | "_blank" | "_modal" | string;
}) => Promise<unknown>;

type CashfreeInit = (params: {
  mode: "sandbox" | "production";
}) => { checkout: CashfreeCheckout };

let cashfreeLoaderPromise: Promise<CashfreeInit> | null = null;

async function loadCashfreeSdk(): Promise<CashfreeInit> {
  if (typeof window === "undefined") {
    throw new Error("Cashfree checkout is only available in browser");
  }

  if (window.Cashfree) {
    return window.Cashfree as CashfreeInit;
  }

  if (!cashfreeLoaderPromise) {
    cashfreeLoaderPromise = new Promise<CashfreeInit>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
      script.async = true;
      script.onload = () => {
        if (window.Cashfree) {
          resolve(window.Cashfree as CashfreeInit);
        } else {
          reject(new Error("Cashfree SDK loaded but was unavailable"));
        }
      };
      script.onerror = () =>
        reject(new Error("Failed to load Cashfree checkout SDK"));
      document.head.appendChild(script);
    });
  }

  return cashfreeLoaderPromise;
}

declare global {
  interface Window {
    Cashfree?: unknown;
  }
}
