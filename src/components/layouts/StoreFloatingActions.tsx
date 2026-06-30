"use client";

import { useState } from "react";
import Link from "next/link";
import { PhoneCall, ShoppingBag } from "lucide-react";
import { Icons } from "@/components/layouts/icons";
import { useCartCount } from "@/features/carts/hooks/useCartCount";
import { useMobileMenu } from "./MobileMenuContext";
import {
  FloatingContactPicker,
  type ContactPickerMode,
} from "./FloatingContactPicker";

function CartBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
      {count > 9 ? "9+" : count}
    </span>
  );
}

const floatingActionButtonClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95 touch-manipulation";

export function StoreFloatingActions() {
  const { isOpen: menuOpen } = useMobileMenu();
  const cartCount = useCartCount();
  const [openPicker, setOpenPicker] = useState<ContactPickerMode | null>(null);

  if (menuOpen) return null;

  const setPicker = (mode: ContactPickerMode) => (open: boolean) => {
    setOpenPicker(open ? mode : null);
  };

  return (
    <>
      {openPicker ? (
        <div
          className="fixed inset-0 z-[139] bg-black/10 backdrop-blur-[1px] md:bg-transparent md:backdrop-blur-none"
          aria-hidden
          onClick={() => setOpenPicker(null)}
        />
      ) : null}

      <div
        className="pointer-events-none fixed right-4 z-[140] flex flex-col items-end gap-3 bottom-[calc(var(--mobile-nav-height)+1rem)] md:bottom-6"
        aria-label="Quick actions"
      >
        <FloatingContactPicker
          mode="call"
          isOpen={openPicker === "call"}
          onOpenChange={setPicker("call")}
          triggerLabel="Call SRI SAI RAGHAVENDRA TEX — choose a number"
          triggerClassName={`animate-phone-glow ${floatingActionButtonClass} bg-[#C1105A] text-white ring-2 ring-[#C1105A]/40`}
          triggerIcon={<PhoneCall className="h-5 w-5" strokeWidth={2} />}
        />

        <div className="pointer-events-auto flex items-center justify-end gap-2">
          <Link
            href="/cart"
            className={`relative ${floatingActionButtonClass} border border-border bg-white text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.12)]`}
            aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
          >
            <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
            <CartBadge count={cartCount} />
          </Link>
        </div>

        <FloatingContactPicker
          mode="whatsapp"
          isOpen={openPicker === "whatsapp"}
          onOpenChange={setPicker("whatsapp")}
          triggerLabel="Chat on WhatsApp — choose a contact"
          triggerClassName={`animate-whatsapp-glow ${floatingActionButtonClass} bg-[#25D366] text-white ring-2 ring-[#25D366]/40`}
          triggerIcon={<Icons.whatsapp className="h-5 w-5" />}
        />
      </div>
    </>
  );
}
