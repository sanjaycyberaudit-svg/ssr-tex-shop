import { siteConfig } from "@/config/site";
import { Icons } from "./icons";
import { cn } from "@/lib/utils";
import Link from "next/link";

type SocialKey = keyof typeof siteConfig.social;

const SOCIAL_ITEMS: {
  key: SocialKey;
  icon: keyof typeof Icons;
  label: string;
}[] = [
  { key: "instagram", icon: "instagram", label: "Instagram" },
  { key: "youtube", icon: "youtube", label: "YouTube" },
  { key: "facebook", icon: "facebook", label: "Facebook" },
  { key: "whatsapp", icon: "whatsapp", label: "WhatsApp" },
];

type Props = {
  containerClassName?: string;
  itemsClassName?: string;
  /** Tighter spacing for mobile menu / admin sidebar */
  variant?: "default" | "compact";
};

function SocialMedias({
  containerClassName,
  itemsClassName,
  variant = "default",
}: Props) {
  const iconClass = cn(
    "text-muted-foreground hover:text-[#00542E] transition-colors",
    variant === "compact" ? "w-5 h-5" : "w-4 h-4 md:w-5 md:h-5",
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
