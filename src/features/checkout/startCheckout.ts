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
    const message = await res.text().catch(() => "Checkout failed");
    throw new Error(message || "Checkout failed");
  }

  const payload = (await res.json()) as
    | { provider: "phonepe"; redirectUrl: string }
    | { provider: "stripe"; sessionId: string };

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
