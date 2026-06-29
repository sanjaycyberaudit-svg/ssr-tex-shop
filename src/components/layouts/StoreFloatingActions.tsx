"use client";

import Link from "next/link";
import { PhoneCall, ShoppingBag } from "lucide-react";
import { Icons } from "@/components/layouts/icons";
import { siteConfig } from "@/config/site";
import { useStorefrontSocial } from "@/providers/SocialLinksProvider";
import { useCartCount } from "@/features/carts/hooks/useCartCount";
import { useMobileMenu } from "./MobileMenuContext";

function CartBadge({ count }: { count: number }) {
  if (count <= 0) return null;

  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm">
      {count > 9 ? "9+" : count}
    </span>
  );
}

const floatingActionButtonClass =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition-transform hover:scale-105 active:scale-95";

export function StoreFloatingActions() {
  const social = useStorefrontSocial();
  const { isOpen: menuOpen } = useMobileMenu();
  const cartCount = useCartCount();

  if (menuOpen) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 z-[140] flex flex-col items-end gap-3 bottom-[calc(var(--mobile-nav-height)+1rem)] md:bottom-6"
      aria-label="Quick actions"
    >
      <div className="group/call pointer-events-auto flex items-center justify-end gap-2">
        <span
          className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap rounded-md bg-white px-0 py-1.5 text-sm font-semibold text-foreground opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300 group-hover/call:max-w-[8rem] group-hover/call:px-3 group-hover/call:opacity-100 group-focus-within/call:max-w-[8rem] group-focus-within/call:px-3 group-focus-within/call:opacity-100"
          aria-hidden
        >
          Call now
        </span>
        <a
          href={siteConfig.phoneHref}
          className={`animate-phone-glow ${floatingActionButtonClass} bg-[#C1105A] text-white ring-2 ring-[#C1105A]/40`}
          aria-label="Call SRI SAI RAGHAVENDRA TEX"
        >
          <PhoneCall className="h-5 w-5" strokeWidth={2} />
        </a>
      </div>

      <div className="group/cart pointer-events-auto flex items-center justify-end gap-2">
        <span
          className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap rounded-md bg-white px-0 py-1.5 text-sm font-semibold text-foreground opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300 group-hover/cart:max-w-[8rem] group-hover/cart:px-3 group-hover/cart:opacity-100 group-focus-within/cart:max-w-[8rem] group-focus-within/cart:px-3 group-focus-within/cart:opacity-100"
          aria-hidden
        >
          View cart
        </span>
        <Link
          href="/cart"
          className={`relative ${floatingActionButtonClass} border border-border bg-white text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.12)]`}
          aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
        >
          <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
          <CartBadge count={cartCount} />
        </Link>
      </div>

      <div className="group/wa pointer-events-auto flex items-center justify-end gap-2">
        <span
          className="pointer-events-none max-w-0 overflow-hidden whitespace-nowrap rounded-md bg-white px-0 py-1.5 text-sm font-semibold text-foreground opacity-0 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-300 group-hover/wa:max-w-[8rem] group-hover/wa:px-3 group-hover/wa:opacity-100 group-focus-within/wa:max-w-[8rem] group-focus-within/wa:px-3 group-focus-within/wa:opacity-100"
          aria-hidden
        >
          Need Help?
        </span>
        <a
          href={social.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          className={`animate-whatsapp-glow ${floatingActionButtonClass} bg-[#25D366] text-white ring-2 ring-[#25D366]/40`}
          aria-label="Chat on WhatsApp"
        >
          <Icons.whatsapp className="h-5 w-5" />
        </a>
      </div>
    </div>
  );
}
