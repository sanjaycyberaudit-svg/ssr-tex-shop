"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import SocialMedias from "./SocialMedias";
import { cn } from "@/lib/utils";

const navLinkBase =
  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

type NavItem = { title: string; href: string };

const primaryNav: NavItem[] = [
  { title: "Home", href: "/" },
  { title: "Shop", href: "/shop" },
  ...siteConfig.mainNav.map(({ title, href }) => ({ title, href })),
  { title: "Wishlist", href: "/wish-list" },
  { title: "Cart", href: "/cart" },
];

function isNavActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

type SideMenuProps = {
  triggerClassName?: string;
};

function SideNavLink({
  item,
  pathname,
  onNavigate,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
}) {
  const active = isNavActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        navLinkBase,
        active
          ? "border-l-[3px] border-[#00542E] bg-[#00542E]/12 pl-[calc(0.75rem-3px)] font-semibold text-[#00542E]"
          : "border-l-[3px] border-transparent text-foreground hover:bg-[#00542E]/10",
      )}
    >
      <span className="flex-1">{item.title}</span>
      {active ? (
        <Check
          className="h-4 w-4 shrink-0 text-[#00542E]"
          strokeWidth={2.5}
          aria-hidden
        />
      ) : null}
    </Link>
  );
}

export function SideMenu({ triggerClassName }: SideMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 shrink-0 -ml-1 justify-center",
            triggerClassName,
          )}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" strokeWidth={1.75} />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        mobileNavSafe
        className="flex w-[min(100vw-3rem,320px)] flex-col gap-0 border-r border-[#00542E]/15 p-0 sm:max-w-xs"
      >
        <SheetHeader className="space-y-3 border-b border-[#00542E]/15 bg-[#00542E]/[0.06] px-4 py-4 text-left">
          <SheetTitle className="sr-only">Navigation menu</SheetTitle>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-[#00542E]/80">
            Menu
          </p>
          <BrandLogo size="lg" />
        </SheetHeader>

        <nav
          className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-4 py-4"
          aria-label="Main"
        >
          {primaryNav.map((item) => (
            <SideNavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={closeMenu}
            />
          ))}
        </nav>

        <div className="shrink-0 border-t border-[#00542E]/15 bg-muted/30 px-4 py-4 text-xs leading-relaxed text-muted-foreground">
          <address className="not-italic">
            {siteConfig.addressLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </address>
          <p className="mt-2">
            <a className="hover:text-foreground" href={siteConfig.phoneHref}>
              {siteConfig.phone}
            </a>
          </p>
          <p className="mt-1">
            <Link
              className="hover:text-foreground hover:underline"
              href={`mailto:${siteConfig.email}`}
            >
              {siteConfig.email}
            </Link>
          </p>
          <div className="mt-4 border-t border-[#00542E]/10 pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[#00542E]/70">
              Follow us
            </p>
            <SocialMedias variant="compact" />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
