"use server";

import db from "@/lib/supabase/db";
import { address } from "@/lib/supabase/schema";
import type { AddressFormValues } from "@/features/addresses/validations/addressFormSchema";

export async function createShippingAddress(
  data: AddressFormValues,
  userId?: string | null,
) {
  const [inserted] = await db
    .insert(address)
    .values({
      line1: data.line1.trim(),
      line2: data.line2?.trim() || null,
      city: data.city.trim(),
      state: data.state,
      postal_code: data.postal_code.trim(),
      country: "IN",
      userProfileId: userId ?? null,
    })
    .returning({ id: address.id });

  if (!inserted?.id) {
    throw new Error("Could not save address. Please try again.");
  }

  return {
    addressId: inserted.id,
    ...data,
  };
}
