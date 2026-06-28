import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "nav" | "sidebar" | "footer";

/** SSR monogram badge (kept on the left across the whole site) */
const BADGE: Record<Size, string> = {
  nav: "h-8 w-8 rounded-lg text-[10px]",
  sidebar: "h-8 w-8 rounded-lg text-[10px]",
  sm: "h-8 w-8 rounded-lg text-[10px]",
  md: "h-9 w-9 rounded-xl text-[11px]",
  footer: "h-9 w-9 rounded-xl text-[11px]",
  lg: "h-12 w-12 rounded-2xl text-[14px]",
};

/** Full brand name typography */
const NAME: Record<Size, string> = {
  nav: "text-[0.9rem] sm:text-[1rem]",
  sidebar: "text-[0.95rem]",
  sm: "text-[0.95rem]",
  md: "text-[1.18rem]",
  footer: "text-[1.12rem]",
  lg: "text-[1.7rem]",
};

/** Tagline only shows where there's room (desktop header / footer / large) */
const TAGLINE: Partial<Record<Size, string>> = {
  md: "text-[7.5px]",
  footer: "text-[7.5px]",
  lg: "text-[10px]",
};

const GAP: Record<Size, string> = {
  nav: "gap-2",
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

/** Brand lockup: rani-rose "SSR" monogram + "Sri Sai Raghavendra Tex" wordmark. */
export function BrandWordmark({ className, size = "md" }: Props) {
  const tagline = TAGLINE[size];

  return (
    <span
      className={cn("inline-flex items-center", GAP[size], className)}
      aria-label="Sri Sai Raghavendra Tex"
    >
      <span
        className={cn(
          "grid shrink-0 place-items-center bg-gradient-to-br from-[#C1105A] to-[#7A0E43] font-[family-name:var(--font-brand-sans)] font-extrabold uppercase leading-none tracking-tight text-white shadow-[0_4px_12px_rgba(193,16,90,0.35)] ring-1 ring-[#C9A227]/50",
          BADGE[size],
        )}
        aria-hidden
      >
        SSR
      </span>

      <span className="flex min-w-0 flex-col justify-center leading-none">
        <span
          className={cn(
            "whitespace-nowrap font-[family-name:var(--font-brand-sans)] font-extrabold leading-none tracking-tight text-[#C1105A]",
            NAME[size],
          )}
        >
          Sri Sai Raghavendra Tex
          <sup className="ml-[0.12em] align-super text-[0.4em] font-bold text-[#C9A227]">
            ®
          </sup>
        </span>
        {tagline ? (
          <span
            className={cn(
              "mt-[3px] whitespace-nowrap font-semibold uppercase tracking-[0.18em] text-[#8A0E48]/80",
              tagline,
            )}
          >
            {siteConfig.tagline}
          </span>
        ) : null}
      </span>
    </span>
  );
}

export default BrandWordmark;
