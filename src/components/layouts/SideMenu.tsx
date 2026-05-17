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
import { Icons } from "./icons";
import Branding from "./Branding";
import SocialMedias from "./SocialMedias";

export function SideMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="shrink-0" aria-label="Open menu">
          <Icons.menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex w-[min(100vw,340px)] flex-col gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="border-b px-5 py-4 text-left space-y-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Branding className="text-lg font-semibold" />
        </SheetHeader>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-5">
          <Link
            href="/"
            className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
          >
            Home
          </Link>
          <Link
            href="/shop"
            className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
          >
            Shop
          </Link>
          {siteConfig.mainNav.map(({ title, href }, index) => (
            <Link
              key={index}
              href={href}
              className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
            >
              {title}
            </Link>
          ))}
          <Link
            href="/wish-list"
            className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
          >
            Wishlist
          </Link>
          <Link
            href="/cart"
            className="rounded-lg px-3 py-3 text-base font-medium hover:bg-muted"
          >
            Cart
          </Link>
        </nav>

        <div className="mt-auto border-t px-5 py-5 text-sm text-muted-foreground">
          <p className="leading-relaxed">{siteConfig.address}</p>
          <p className="mt-2">
            <a className="hover:text-foreground" href={`tel:${siteConfig.phone}`}>
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
          <div className="mt-4">
            <SocialMedias />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
