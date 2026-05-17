import { Suspense } from "react";
import Branding from "./Branding";
import { SideMenu } from "./SideMenu";
import Link from "next/link";
import { Icons } from "./icons";

type Props = { adminLayout: boolean };

function MobileNavbar({ adminLayout }: Props) {
  return (
    <div className="flex h-14 min-h-14 w-full min-w-0 items-center justify-between gap-2 px-1 md:hidden">
      <div className="flex min-w-0 flex-1 items-center gap-1">
        <SideMenu />
        <Link
          href="/shop"
          className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted"
          aria-label="Search products"
        >
          <Icons.search className="h-4 w-4" />
        </Link>
      </div>

      <Branding className="shrink-0 text-center text-sm sm:text-base" />

      {/* Cart/wishlist live in bottom bar on mobile */}
      <div className="flex flex-1 justify-end">
        {!adminLayout ? (
          <Link
            href="/cart"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted md:hidden"
            aria-label="Cart"
          >
            <Suspense fallback={null}>
              <Icons.cart className="h-4 w-4" />
            </Suspense>
          </Link>
        ) : (
          <span className="w-9" aria-hidden />
        )}
      </div>
    </div>
  );
}

export default MobileNavbar;
