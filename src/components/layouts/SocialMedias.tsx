import { siteConfig } from "@/config/site";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

type SocialKey = keyof typeof siteConfig.social;

const SOCIAL_ITEMS: {
  key: SocialKey;
  icon: keyof typeof Icons;
  label: string;
  menuClass: string;
}[] = [
  {
    key: "instagram",
    icon: "instagram",
    label: "Instagram",
    menuClass:
      "bg-gradient-to-br from-[#833AB4] via-[#E1306C] to-[#F77737] text-white shadow-sm",
  },
  {
    key: "youtube",
    icon: "youtube",
    label: "YouTube",
    menuClass: "bg-[#FF0000] text-white shadow-sm",
  },
  {
    key: "facebook",
    icon: "facebook",
    label: "Facebook",
    menuClass: "bg-[#1877F2] text-white shadow-sm",
  },
  {
    key: "whatsapp",
    icon: "whatsapp",
    label: "WhatsApp",
    menuClass: "bg-[#25D366] text-white shadow-sm",
  },
];

type Props = {
  containerClassName?: string;
  itemsClassName?: string;
  variant?: "default" | "compact" | "menu";
};

function SocialMedias({
  containerClassName,
  itemsClassName,
  variant = "default",
}: Props) {
  if (variant === "menu") {
    return (
      <nav
        className={cn("grid grid-cols-2 gap-2.5", containerClassName)}
        aria-label="Social media"
      >
        {SOCIAL_ITEMS.map(({ key, icon, label, menuClass }) => {
          const href = siteConfig.social[key];
          const Icon = Icons[icon];

          return (
            <Link
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${label}`}
              className={cn(
                "group flex min-h-[44px] items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-transform active:scale-[0.97]",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00542E]/50 focus-visible:ring-offset-2",
                menuClass,
              )}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span>{label}</span>
              <ExternalLink
                className="h-3 w-3 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </Link>
          );
        })}
      </nav>
    );
  }

  const iconClass = cn(
    "text-muted-foreground transition-colors hover:text-[#00542E]",
    variant === "compact" ? "h-5 w-5" : "h-4 w-4 md:h-5 md:w-5",
    itemsClassName,
  );

  return (
    <nav
      className={cn(
        "flex items-center",
        variant === "compact" ? "gap-4" : "gap-x-5",
        containerClassName,
      )}
      aria-label="Social media"
    >
      {SOCIAL_ITEMS.map(({ key, icon, label }) => {
        const href = siteConfig.social[key];
        const Icon = Icons[icon];

        return (
          <Link
            key={key}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${label} — Sakthi Textiles`}
            title={label}
            className="rounded-md p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00542E]/40"
          >
            <Icon className={iconClass} />
          </Link>
        );
      })}
    </nav>
  );
}

export default SocialMedias;
