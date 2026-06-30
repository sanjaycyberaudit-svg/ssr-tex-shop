import { RobustNavLink } from "@/components/layouts/RobustNavLink";
import { BrandWordmark } from "@/components/layouts/BrandWordmark";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "nav" | "sidebar" | "footer";
  align?: "left" | "center";
};

export function BrandLogo({ className, size = "nav", align = "left" }: Props) {
  return (
    <RobustNavLink
      href="/"
      aria-label={siteConfig.name}
      className={cn(
        "inline-flex min-w-0 max-w-full items-center touch-manipulation",
        align === "center" ? "justify-center" : "justify-start",
        size === "sm" || size === "sidebar" ? "shrink" : "w-fit shrink-0",
        className,
      )}
    >
      <BrandWordmark size={size} align={align} />
    </RobustNavLink>
  );
}

export default BrandLogo;
