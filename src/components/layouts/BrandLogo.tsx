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
        "inline-flex w-fit shrink-0 items-center justify-start touch-manipulation",
        className,
      )}
    >
      <BrandWordmark size={size} />
    </RobustNavLink>
  );
}

export default BrandLogo;
