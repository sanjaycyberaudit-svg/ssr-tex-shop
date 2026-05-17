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
import { Menu } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import SocialMedias from "./SocialMedias";
import { cn } from "@/lib/utils";

const navLinkClass =
  "rounded-lg px-3 py-2.5 text-sm font-medium text-foreground hover:bg-[#00542E]/10 active:bg-[#00542E]/15";

type SideMenuProps = {
  triggerClassName?: string;
};

export function SideMenu({ triggerClassName }: SideMenuProps) {
  return (
    <Sheet>
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
          <BrandLogo size="lg" className="w-full max-w-full" />
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-4 py-4">
          <Link href="/" className={navLinkClass}>
            Home
          </Link>
          <Link href="/shop" className={navLinkClass}>
            Shop
          </Link>
          {siteConfig.mainNav.map(({ title, href }, index) => (
            <Link key={index} href={href} className={navLinkClass}>
              {title}
            </Link>
          ))}
          <Link href="/wish-list" className={navLinkClass}>
            Wishlist
          </Link>
          <Link href="/cart" className={navLinkClass}>
            Cart
          </Link>
        </nav>

        <div className="shrink-0 border-t border-[#00542E]/15 bg-muted/30 px-4 py-4 text-xs leading-relaxed text-muted-foreground">
          <p>{siteConfig.address}</p>
          <p className="mt-2">
            <a
              className="hover:text-foreground"
              href={`tel:${siteConfig.phone.replace(/\s/g, "")}`}
            >
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
          <div className="mt-3">
            <SocialMedias />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
