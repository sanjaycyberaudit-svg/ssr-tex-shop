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
        {adminLayout ? (
          <div className="flex min-h-[var(--admin-header-height-mobile)] w-full md:min-h-[var(--admin-header-height-desktop)]">
            <div className="hidden w-full md:flex">
              <div className="w-[var(--admin-sidebar-width)] shrink-0 border-r" />
              <div className="flex min-w-0 flex-1 items-center justify-end gap-x-5 px-6 lg:px-8">
                <Suspense>
                  <UserNav />
                </Suspense>
                <Link href="/">
                  <span className="text-sm font-medium text-muted-foreground transition hover:text-foreground">
                    View store
                  </span>
                </Link>
              </div>
            </div>
            <MobileNavbar adminLayout={adminLayout} />
          </div>
        ) : (
          <>
            <div className="container hidden py-2 md:block">
              <div className="flex w-full items-center justify-between gap-x-6">
                <div className="flex min-w-0 shrink-0 items-center gap-x-2">
                  <SideMenu />
                  <Branding size="md" className="min-w-0" />
                </div>

                <nav
                  className="hidden items-center gap-5 text-sm font-medium lg:flex"
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
                      className="text-foreground/80 transition hover:text-primary"
                    >
                      {item.title}
                    </Link>
                  ))}
                </nav>

                <Suspense>
                  <SearchInput />
                </Suspense>

                <div className="relative flex items-center gap-x-5">
                  <Suspense>
                    <UserNav />
                  </Suspense>

                  <Link href={"/wish-list"}>
                    <Icons.heart className="h-4 w-4" aria-label="wishlist" />
                  </Link>

                  <Suspense fallback={<CartLink productCount={0} />}>
                    <CartNav />
                  </Suspense>
                </div>
              </div>
            </div>
            <MobileNavbar adminLayout={adminLayout} />
          </>
        )}
      </nav>
    </header>
  );
}

export default MainNavbar;
