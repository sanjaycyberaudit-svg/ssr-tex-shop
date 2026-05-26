"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCartCount } from "@/features/carts/hooks/useCartCount";
import useWishlistStore from "@/features/wishlists/useWishlistStore";

function NavBadge({ count }: { count: number }) {
  return (
    <span
      className={cn(
        "absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white",
        count <= 0 && "opacity-0 scale-0",
      )}
      aria-hidden={count <= 0}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const cartCount = useCartCount();
  const wishlist = useWishlistStore((s) => s.wishlist);
  const wishCount = Object.keys(wishlist).length;

  const itemClass = (active: boolean) =>
    cn(
      "flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium leading-none",
      active ? "text-white" : "text-white/75",
    );

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-[200] border-t border-zinc-700 bg-zinc-900 text-white shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom, 0px))" }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto flex h-14 max-w-lg items-stretch justify-around">
        <Link href="/" className={itemClass(pathname === "/")}>
          <Home
            className="h-5 w-5 shrink-0"
            strokeWidth={pathname === "/" ? 2.25 : 1.75}
          />
          <span>Home</span>
        </Link>
        <Link
          href="/shop"
          className={itemClass(
            pathname === "/shop" || pathname.startsWith("/shop/"),
          )}
        >
          <Search className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span>Search</span>
        </Link>
        <Link
          href="/sign-in"
          className={itemClass(
            pathname.startsWith("/sign") || pathname.startsWith("/setting"),
          )}
        >
          <User className="h-5 w-5 shrink-0" strokeWidth={1.75} />
          <span>Account</span>
        </Link>
        <Link
          href="/wish-list"
          className={itemClass(pathname === "/wish-list")}
        >
          <span className="relative inline-flex">
            <Heart className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <NavBadge count={wishCount} />
          </span>
          <span>Wishlist</span>
        </Link>
        <Link href="/cart" className={itemClass(pathname === "/cart")}>
          <span className="relative inline-flex">
            <ShoppingCart className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            <NavBadge count={cartCount} />
          </span>
          <span>Cart</span>
        </Link>
      </div>
    </nav>
  );
}
