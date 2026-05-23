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
import { Check, ChevronRight, Mail, MapPin, Menu, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandLogo } from "./BrandLogo";
import SocialMedias from "./SocialMedias";
import { cn } from "@/lib/utils";

const navLinkBase =
  "flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors";

const sectionLabelClass =
  "text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00542E]";

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

function ContactRow({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string;
  icon: typeof Phone;
  label: string;
  value: string;
}) {
  return (
    <a
      href={href}
      className="group flex min-h-[44px] items-center gap-3 rounded-xl border border-[#00542E]/12 bg-white px-3 py-2.5 text-left transition-colors hover:border-[#00542E]/25 hover:bg-[#00542E]/[0.04] active:scale-[0.99]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#00542E]/10 text-[#00542E]">
        <Icon className="h-4 w-4" strokeWidth={2} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wide text-[#00542E]/70">
          {label}
        </span>
        <span className="block truncate text-sm font-medium text-foreground">
          {value}
        </span>
      </span>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-[#00542E]/40 transition-transform group-hover:translate-x-0.5 group-hover:text-[#00542E]"
        aria-hidden
      />
    </a>
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
          <p className={sectionLabelClass}>Menu</p>
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

        <div className="shrink-0 border-t border-[#00542E]/15 bg-[#fafaf8] px-4 py-5">
          <div className="space-y-5">
            <section aria-labelledby="side-menu-address">
              <div className="mb-3 flex items-center gap-2">
                <MapPin
                  className="h-4 w-4 shrink-0 text-[#00542E]"
                  strokeWidth={2}
                  aria-hidden
                />
                <h2 id="side-menu-address" className={sectionLabelClass}>
                  Store address
                </h2>
              </div>
              <address className="space-y-1.5 not-italic pl-6 text-sm leading-relaxed text-neutral-600">
                {siteConfig.addressLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </address>
            </section>

            <section
              className="space-y-2 border-t border-[#00542E]/10 pt-5"
              aria-label="Contact"
            >
              <ContactRow
                href={siteConfig.phoneHref}
                icon={Phone}
                label="Call us"
                value={siteConfig.phone}
              />
              <ContactRow
                href={`mailto:${siteConfig.email}`}
                icon={Mail}
                label="Email us"
                value={siteConfig.email}
              />
            </section>

            <section
              className="border-t border-[#00542E]/10 pt-5"
              aria-labelledby="side-menu-social"
            >
              <h2 id="side-menu-social" className={cn(sectionLabelClass, "mb-1")}>
                Follow us
              </h2>
              <p className="mb-3 text-xs leading-relaxed text-neutral-500">
                Tap a button below — opens in a new tab
              </p>
              <SocialMedias variant="menu" />
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
