import { Suspense } from "react";
import Branding from "./Branding";
import { SideMenu } from "./SideMenu";
import Link from "next/link";
import { Icons } from "./icons";
import { UserNav } from "@/features/auth";

type Props = { adminLayout: boolean };

const edgeInset = "max(0.75rem, env(safe-area-inset-left, 0px))" as const;
const edgeInsetRight = "max(0.75rem, env(safe-area-inset-right, 0px))" as const;

function MobileNavbar({ adminLayout }: Props) {
  return (
    <div className="relative h-[3.75rem] min-h-[3.75rem] w-full md:hidden">
      <div
        className="absolute inset-y-0 left-0 flex items-center"
        style={{ paddingLeft: edgeInset }}
      >
        <SideMenu triggerClassName="ml-0" />
      </div>

      <div className="flex h-full items-center justify-center px-14">
        <Branding size="nav" className="shrink-0" />
      </div>

      <div
        className="absolute inset-y-0 right-0 flex items-center"
        style={{ paddingRight: edgeInsetRight }}
      >
        {!adminLayout ? (
          <Link
            href="/cart"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-muted touch-manipulation"
            aria-label="Cart"
          >
            <Suspense fallback={null}>
              <Icons.cart className="h-5 w-5" />
            </Suspense>
          </Link>
        ) : (
          <Suspense>
            <UserNav />
          </Suspense>
        )}
      </div>
    </div>
  );
}

export default MobileNavbar;
