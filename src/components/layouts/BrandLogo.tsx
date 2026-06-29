import { RobustNavLink } from "@/components/layouts/RobustNavLink";
import { BrandWordmark } from "@/components/layouts/BrandWordmark";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "nav" | "sidebar" | "footer";
};

export function BrandLogo({ className, size = "nav" }: Props) {
  return (
    <RobustNavLink
      href="/"
      aria-label={siteConfig.name}
      className={cn(
        "inline-flex min-w-0 max-w-full items-center justify-start touch-manipulation",
        size === "sm" || size === "sidebar" ? "shrink" : "w-fit shrink-0",
        className,
      )}
    >
      <BrandWordmark size={size} />
    </RobustNavLink>
  );
}

export default BrandLogo;
