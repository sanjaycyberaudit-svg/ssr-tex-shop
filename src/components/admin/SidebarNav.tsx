"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { SidebarNavItem } from "@/types";

import { cn } from "@/lib/utils";
import { Icons } from "../layouts/icons";

export interface SidebarNavProps {
  items: SidebarNavItem[];
}

export function SidebarNav({ items }: SidebarNavProps) {
  const pathname = usePathname();
  const iconColorByName: Record<string, string> = {
    layoutDashboard: "text-violet-500",
    cart: "text-emerald-600",
    folder: "text-amber-500",
    messageSquare: "text-sky-500",
    image: "text-fuchsia-500",
    user: "text-cyan-600",
    receipt: "text-indigo-500",
    globe: "text-blue-600",
    instagram: "text-pink-500",
    tag: "text-orange-500",
  };

  if (!items?.length) return null;

  return (
    <div className="flex w-full flex-col gap-2">
      {items.map((item, index) => {
        const Icon = Icons[item.icon ?? "chevronLeft"];

        return item.href ? (
          <Link
            key={index}
            href={item.href}
            target={item.external ? "_blank" : ""}
            rel={item.external ? "noreferrer" : ""}
          >
            <span
              className={cn(
                "group flex w-full items-center rounded-md border border-transparent px-2 py-1 hover:bg-muted hover:text-foreground",
                pathname === item.href
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground",
                item.disabled && "pointer-events-none opacity-60",
              )}
            >
              <Icon
                className={cn(
                  "mr-2 h-4 w-4 transition-colors",
                  pathname === item.href
                    ? "text-foreground"
                    : iconColorByName[item.icon ?? ""] ||
                        "text-muted-foreground",
                )}
                aria-hidden="true"
              />
              <span>{item.title}</span>
            </span>
          </Link>
        ) : (
          <span
            key={index}
            className="flex w-full cursor-not-allowed items-center rounded-md p-2 text-muted-foreground hover:underline"
          >
            {item.title}
          </span>
        );
      })}
    </div>
  );
}
