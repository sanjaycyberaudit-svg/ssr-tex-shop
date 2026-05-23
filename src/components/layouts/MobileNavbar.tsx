import { Suspense } from "react";
import Branding from "./Branding";
import { SideMenu } from "./SideMenu";
import Link from "next/link";
import { Icons } from "./icons";

type Props = { adminLayout: boolean };

function MobileNavbar({ adminLayout }: Props) {
  return (
    <div className="grid h-[3.75rem] min-h-[3.75rem] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-2 md:hidden">
      <SideMenu triggerClassName="justify-self-start" />

      <div className="flex min-w-0 justify-center overflow-hidden px-1">
        <Branding size="nav" className="mx-auto" />
      </div>

      <div className="flex justify-end">
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
