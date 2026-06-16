import { cn } from "@/lib/utils";
import Link from "next/link";
import { Suspense } from "react";
import { CartLink, CartNav } from "../../features/carts";
import { UserNav } from "@/features/auth";
import { AnnouncementBar } from "./AnnouncementBar";
import { Icons } from "./icons";
import Branding from "./Branding";
import MobileNavbar from "./MobileNavbar";
import SearchInput from "./SearchInput";
import { SideMenu } from "./SideMenu";

interface MainNavbarProps {
  adminLayout?: boolean;
}

async function MainNavbar({ adminLayout = false }: MainNavbarProps) {
  return (
    <header
      className={cn("top-0 z-[100] w-full", adminLayout ? "relative" : "fixed")}
    >
      {!adminLayout ? <AnnouncementBar /> : null}
      <nav className="w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div
          className={cn(
            adminLayout
              ? "mx-auto flex h-[var(--admin-header-height-mobile)] max-w-[2500px] items-center px-6 md:h-[var(--admin-header-height-desktop)] md:px-12"
              : "container",
          )}
        >
          <div className="hidden w-full gap-x-8 items-center justify-between md:flex">
            <div className="flex gap-x-3 items-center">
              <SideMenu />
              <Branding size="md" />
            </div>

            {!adminLayout ? (
              <nav
                className="hidden lg:flex items-center gap-5 text-sm font-medium"
                aria-label="Primary"
              >
                {[
                  { title: "Shop", href: "/shop" },
                  { title: "Featured", href: "/featured" },
                  { title: "Collections", href: "/collections" },
                  { title: "Contact", href: "/contact" },
                ].map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-foreground/80 transition hover:text-[#00542E]"
                  >
                    {item.title}
                  </Link>
                ))}
              </nav>
            ) : null}

            {adminLayout ? (
              <></>
            ) : (
              <Suspense>
                <SearchInput />
              </Suspense>
            )}

            <div className="flex gap-x-5 relative items-center">
              <Suspense>
                <UserNav />
              </Suspense>

              <Link href={"/wish-list"}>
                <Icons.heart className="w-4 h-4" aria-label="wishlist" />
              </Link>

              <Suspense fallback={<CartLink productCount={0} />}>
                {!adminLayout && <CartNav />}
              </Suspense>
            </div>
          </div>

          <MobileNavbar adminLayout={adminLayout} />
        </div>
      </nav>
    </header>
  );
}

export default MainNavbar;
