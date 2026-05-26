import { cn } from "@/lib/utils";
import Image from "next/image";

const sizeMap = {
  nav: "text-[clamp(1.05rem,4vw,1.38rem)] leading-none",
  sidebar: "text-[1.12rem] leading-none sm:text-[1.18rem]",
  footer: "text-[1.3rem] leading-none sm:text-[1.4rem]",
  sm: "text-[1.75rem] sm:text-[1.85rem]",
  md: "text-[2rem] sm:text-[2.15rem]",
  lg: "text-[2.35rem] sm:text-[2.6rem]",
} as const;

const trackingMap = {
  nav: "tracking-[0.008em]",
  sidebar: "tracking-[0.025em]",
  footer: "tracking-[0.05em]",
  sm: "tracking-[0.05em]",
  md: "tracking-[0.06em]",
  lg: "tracking-[0.08em]",
} as const;

/** Peacock emblem box (px). nav/md are 1.5× prior header sizes; bar height includes clearance. */
const emblemSizeMap = {
  nav: "h-[102px] w-[81px]",
  sidebar: "h-[95px] w-[77px]",
  footer: "h-[90px] w-[72px]",
  sm: "h-[99px] w-[80px]",
  md: "h-[117px] w-[95px]",
  lg: "h-[126px] w-[102px]",
} as const;

const regMarkClassMap = {
  nav: "ml-[0.1em] align-super text-[12px] font-extrabold leading-none text-[#9A7209] [text-shadow:none]",
  sidebar:
    "ml-[0.08em] align-super text-[11px] font-extrabold leading-none text-[#9A7209] [text-shadow:none]",
  footer:
    "ml-[0.08em] align-super text-[11px] font-extrabold leading-none text-[#9A7209] [text-shadow:none]",
  sm: "ml-[0.08em] align-super text-[0.48em] font-extrabold leading-none text-[#9A7209] [text-shadow:none]",
  md: "ml-[0.08em] align-super text-[0.42em] font-extrabold leading-none text-[#9A7209] [text-shadow:none]",
  lg: "ml-[0.08em] align-super text-[0.42em] font-extrabold leading-none text-[#9A7209] [text-shadow:none]",
} as const;

const emblemGapMap = {
  nav: "gap-[0.09375rem]",
  sidebar: "gap-0.5",
  footer: "gap-[0.09375rem]",
  sm: "gap-[0.09375rem]",
  md: "gap-[0.09375rem]",
  lg: "gap-[0.09375rem]",
} as const;

type Props = {
  className?: string;
  size?: keyof typeof sizeMap;
};

/** Official wordmark: ST emblem + gold caps "SAKTHI TEXTILE®". */
export function SakthiWordmark({ className, size = "md" }: Props) {
  return (
    <span
      className={cn(
        "wordmark inline-flex shrink-0 items-center font-[family-name:var(--font-brand-sans)]",
        emblemGapMap[size],
        sizeMap[size],
        className,
      )}
      aria-label="Sakthi Textile registered trademark"
    >
      <span
        className={cn("relative shrink-0", emblemSizeMap[size])}
        aria-hidden
      >
        <Image
          src="/images/sakthi-st-emblem.png"
          alt=""
          fill
          sizes="(max-width: 768px) 102px, 117px"
          className="object-contain object-center"
          priority={size === "nav" || size === "sidebar" || size === "md"}
        />
      </span>
      <span
        className={cn(
          "shrink-0 whitespace-nowrap font-extrabold uppercase leading-none",
          "text-[#E5B820] [text-shadow:1px_1px_0_#8B6914,2px_2px_4px_rgba(0,0,0,0.12)]",
          trackingMap[size],
        )}
      >
        <span>Sakthi </span>
        <span>
          Textile
          <sup className={regMarkClassMap[size]} aria-hidden>
            ®
          </sup>
        </span>
      </span>
    </span>
  );
}
