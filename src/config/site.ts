import type { NavItemWithOptionalChildren } from "@/types";

import { slugify } from "@/lib/utils";

export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Sakthi Textile",
  description: "Authentic silk and cotton sarees — wholesale and retail",
  url: "https://hiyori.hugo-coding.com",
  address: "Salem, Tamil Nadu, India",
  phone: "+91 9952252964",
  email: "contact@sakthitextiles.com",
  mainNav: [
    {
      title: "Collections",
      href: "/shop",
      description: "Browse saree collections.",
      items: [],
    },
    {
      title: "Orders",
      href: "/orders",
      description: "Your orders.",
      items: [],
    },
  ] satisfies NavItemWithOptionalChildren[],
};
