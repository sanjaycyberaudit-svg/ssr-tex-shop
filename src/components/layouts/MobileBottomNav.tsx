"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Heart, Search, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import useCartStore from "@/features/carts/hooks/useCartStore";
import useWishlistStore from "@/features/wishlists/useWishlistStore";

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const cart = useCartStore((s) => s.cart);
  const wishlist = useWishlistStore((s) => s.wishlist);

  const cartCount = Object.values(cart).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );
  const wishCount = Object.keys(wishlist).length;

  const isHome = pathname === "/";

  const itemClass = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors",
      active ? "text-white" : "text-white/70 hover:text-white",
    );

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-zinc-900 text-white safe-area-pb"
      aria-label="Mobile navigation"
    >
      <div className="flex items-stretch justify-around max-w-lg mx-auto">
        <Link href="/shop" className={itemClass(false)}>
          <Search className="h-5 w-5" strokeWidth={1.75} />
          <span>Search</span>
        </Link>
        <Link href="/sign-in" className={itemClass(pathname.startsWith("/sign"))}>
          <User className="h-5 w-5" strokeWidth={1.75} />
          <span>Account</span>
        </Link>
        <Link href="/" className={itemClass(isHome)}>
          <Home className="h-5 w-5" strokeWidth={isHome ? 2.25 : 1.75} />
          <span>Home</span>
        </Link>
        <Link href="/wish-list" className={cn(itemClass(pathname === "/wish-list"), "relative")}>
          <span className="relative">
            <Heart className="h-5 w-5" strokeWidth={1.75} />
            <NavBadge count={wishCount} />
          </span>
          <span>Wishlist</span>
        </Link>
        <Link href="/cart" className={cn(itemClass(pathname === "/cart"), "relative")}>
          <span className="relative">
            <ShoppingCart className="h-5 w-5" strokeWidth={1.75} />
            <NavBadge count={cartCount} />
          </span>
          <span>Cart</span>
        </Link>
      </div>
    </nav>
  );
}
