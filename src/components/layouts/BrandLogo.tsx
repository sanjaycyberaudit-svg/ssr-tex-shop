import Link from "next/link";
import { SakthiWordmark } from "@/components/layouts/SakthiWordmark";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  size?: "sm" | "md" | "lg" | "nav" | "sidebar" | "footer";
};

export function BrandLogo({ className, size = "nav" }: Props) {
  const visualSize: NonNullable<Props["size"]> =
    size === "sidebar" || size === "footer" ? "nav" : size;

  const detailTextClassBySize: Record<NonNullable<Props["size"]>, string> = {
    nav: "text-[7.5px] leading-[1.1] tracking-[0.04em]",
    md: "text-[8.5px] leading-[1.1] tracking-[0.04em]",
    sm: "text-[8.75px] leading-[1.12] tracking-[0.04em]",
    lg: "text-[11px] leading-[1.14] tracking-[0.045em]",
    sidebar: "text-[9.75px] leading-[1.12] tracking-[0.04em]",
    footer: "text-[9.75px] leading-[1.12] tracking-[0.04em]",
  };

  const detailPositionClassBySize: Record<
    NonNullable<Props["size"]>,
    string
  > = {
    nav: "left-[53px] top-[37px]",
    md: "left-[72px] top-[43px]",
    sm: "left-[76px] top-[47px]",
    lg: "left-[96px] top-[56px]",
    sidebar: "left-[53px] top-[33.5px]",
    footer: "left-[53px] top-[33.5px]",
  };

  const detailGapClassBySize: Record<NonNullable<Props["size"]>, string> = {
    nav: "gap-[1.5px]",
    md: "gap-[1.5px]",
    sm: "gap-[2px]",
    lg: "gap-[2px]",
    sidebar: "gap-[1.5px]",
    footer: "gap-[1.5px]",
  };

  const detailWidthClassBySize: Record<NonNullable<Props["size"]>, string> = {
    nav: "w-[184px]",
    md: "w-[266px]",
    sm: "w-[238px]",
    lg: "w-[332px]",
    sidebar: "w-[184px]",
    footer: "w-[184px]",
  };

  return (
    <div
      className={cn(
        "relative inline-flex w-fit shrink-0 items-start justify-start overflow-visible",
        className,
      )}
    >
      <Link
        href="/"
        className="inline-flex w-fit shrink-0 items-center justify-start"
      >
        <SakthiWordmark size={visualSize} />
      </Link>

      <div
        className={cn(
          "absolute z-[1] inline-flex flex-col items-center whitespace-nowrap text-center",
          detailPositionClassBySize[size],
          detailGapClassBySize[size],
          detailWidthClassBySize[size],
          detailTextClassBySize[size],
        )}
      >
        <p className="font-semibold uppercase text-[#111111]">
          THE QUALITY YOU CAN FEEL
        </p>
        <a
          href={siteConfig.phoneHref}
          className="font-medium text-[#222222] underline-offset-2 transition-colors hover:text-[#000000] hover:underline"
        >
          {siteConfig.phone}
        </a>
      </div>
    </div>
  );
}

export default BrandLogo;
