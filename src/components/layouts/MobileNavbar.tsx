import { Suspense } from "react";
import { cn } from "@/lib/utils";
import Branding from "./Branding";
import { SideMenu } from "./SideMenu";
import Link from "next/link";
import { Icons } from "./icons";

type Props = { adminLayout: boolean };

function MobileNavbar({ adminLayout }: Props) {
  return (
    <div
      className={cn(
        "grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 pl-0 pr-1 md:hidden",
        adminLayout
          ? "h-[var(--admin-header-height-mobile)] min-h-[var(--admin-header-height-mobile)]"
          : "h-[var(--store-nav-height-mobile)] min-h-[var(--store-nav-height-mobile)]",
      )}
    >
      <SideMenu triggerClassName="justify-self-start -ml-0.5" />

      <div className="flex min-w-0 justify-center overflow-visible px-0.5">
        <Branding size="nav" className="mx-auto shrink-0" />
      </div>

      <div className="flex justify-end -mr-1">
        {!adminLayout ? (
          <Link
            href="/cart"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-muted"
            aria-label="Cart"
          >
            <Suspense fallback={null}>
              <Icons.cart className="h-5 w-5" />
            </Suspense>
          </Link>
        ) : (
          <span className="w-10" aria-hidden />
        )}
      </div>
    </div>
  );
}

export default MobileNavbar;
