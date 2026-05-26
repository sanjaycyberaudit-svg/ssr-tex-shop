"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { Icons } from "@/components/layouts/icons";
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
      <Link
        href="/cart"
        className="pointer-events-auto relative flex h-12 w-12 items-center justify-center rounded-full border border-border bg-white text-foreground shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-transform hover:scale-105 active:scale-95"
        aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
      >
        <ShoppingBag className="h-5 w-5" strokeWidth={1.75} />
        <CartBadge count={cartCount} />
      </Link>

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
          className="animate-whatsapp-glow flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white ring-2 ring-[#25D366]/40 transition-transform hover:scale-105 active:scale-95"
          aria-label="Chat on WhatsApp"
        >
          <Icons.whatsapp className="h-7 w-7" />
        </a>
      </div>
    </div>
  );
}
