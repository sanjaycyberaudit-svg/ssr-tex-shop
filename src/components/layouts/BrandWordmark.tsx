import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { BrandEmblem, type BrandEmblemSize } from "./BrandEmblem";

type Size = BrandEmblemSize;

/** Full brand name — elegant serif like the shop board */
const NAME: Record<Size, string> = {
  nav: "text-[0.72rem] leading-[1.05] sm:text-[0.82rem]",
  sidebar: "text-[0.9rem] leading-snug",
  sm: "text-[0.875rem] leading-snug",
  md: "text-[1.05rem] lg:text-[1.15rem]",
  footer: "text-[1.08rem]",
  lg: "text-[1.65rem]",
};

/** ELAMPILLAI line — desktop header, footer, large hero blocks */
const SHOW_LOCATION: Partial<Record<Size, boolean>> = {
  md: true,
  footer: true,
  lg: true,
};

const GAP: Record<Size, string> = {
  nav: "gap-1.5",
  sidebar: "gap-2",
  sm: "gap-2",
  md: "gap-2.5",
  footer: "gap-2.5",
  lg: "gap-3",
};

type Props = {
  className?: string;
  size?: Size;
};

function BrandLocationLine({ className }: { className?: string }) {
  return (
    <span
      className={cn("flex items-center gap-1.5 text-[#6B2D6A]/85", className)}
    >
      <span className="h-px w-3 shrink-0 bg-current opacity-50 sm:w-4" />
      <span className="whitespace-nowrap font-[family-name:var(--font-brand-sans)] text-[0.48rem] font-bold uppercase tracking-[0.28em] sm:text-[0.52rem]">
        {siteConfig.location}
      </span>
      <span className="h-px w-3 shrink-0 bg-current opacity-50 sm:w-4" />
    </span>
  );
}

/** Brand lockup: gold SSR emblem + serif shop name (+ ELAMPILLAI on desktop). */
export function BrandWordmark({ className, size = "md" }: Props) {
  const showLocation = SHOW_LOCATION[size] ?? false;
  const wrapName = size === "sm" || size === "sidebar";

  return (
    <span
      className={cn(
        "inline-flex min-w-0 max-w-full",
        wrapName ? "items-start" : "items-center",
        GAP[size],
        className,
      )}
      aria-label={`${siteConfig.name}, ${siteConfig.location}`}
    >
      <BrandEmblem size={size} priority={size === "nav" || size === "md"} />

      <span className="flex min-w-0 flex-1 flex-col justify-center leading-none">
        <span
          className={cn(
            "font-[family-name:var(--font-hero-serif)] font-semibold tracking-[0.01em] text-[#4A1248]",
            "[text-shadow:0_1px_0_rgba(255,255,255,0.85),0_0_18px_rgba(193,16,90,0.12)]",
            wrapName ? "whitespace-normal" : "whitespace-nowrap",
            NAME[size],
          )}
        >
          Sri Sai Raghavendra Tex
          <sup className="ml-[0.1em] align-super font-[family-name:var(--font-brand-sans)] text-[0.38em] font-bold text-[#C9A227]">
            ®
          </sup>
        </span>

        {showLocation ? <BrandLocationLine className="mt-[3px]" /> : null}
      </span>
    </span>
  );
}

export default BrandWordmark;
