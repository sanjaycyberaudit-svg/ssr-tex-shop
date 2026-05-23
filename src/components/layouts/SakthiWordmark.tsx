import { cn } from "@/lib/utils";

const sizeMap = {
  sm: "text-[1.75rem] sm:text-[1.85rem]",
  md: "text-[2rem] sm:text-[2.15rem]",
  lg: "text-[2.35rem] sm:text-[2.6rem]",
  nav: "text-[1.9rem] leading-none sm:text-[2.05rem]",
} as const;

type Props = {
  className?: string;
  size?: keyof typeof sizeMap;
  /** Show small oval emblem before the wordmark (desktop) */
  showEmblem?: boolean;
};

/**
 * Nalli-inspired cursive wordmark: slanted script, Sakthi green, ® on "textile".
 */
export function SakthiWordmark({
  className,
  size = "md",
  showEmblem = false,
}: Props) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5",
        className,
      )}
      aria-label="Sakthi Textile registered trademark"
    >
      {showEmblem ? (
        <span
          className="hidden h-9 w-6 shrink-0 rounded-full border border-[#00542E]/20 bg-gradient-to-b from-[#FFD700]/30 to-[#00542E]/10 sm:block md:h-10 md:w-7"
          aria-hidden
        />
      ) : null}
      <span
        className={cn(
          "inline-block max-w-full -skew-x-[10deg] font-[family-name:var(--font-sakthi-script)]",
          "leading-[0.95] tracking-tight text-[#00542E]",
          sizeMap[size],
        )}
      >
        <span className="inline-block">Sakthi</span>{" "}
        <span className="relative inline-block whitespace-nowrap">
          textile
          <sup
            className="ml-0.5 align-super text-[0.38em] font-sans font-semibold not-italic text-[#B8860B] sm:text-[0.36em]"
            aria-label="Registered trademark"
          >
            ®
          </sup>
        </span>
      </span>
    </span>
  );
}
