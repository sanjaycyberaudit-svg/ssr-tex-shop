import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Vertical oval logo — width : height ≈ 0.72 */
const sizeMap = {
  sm: { box: "h-10 w-[30px]", text: "text-sm", w: 60, h: 84 },
  md: { box: "h-12 w-9", text: "text-base", w: 72, h: 100 },
  lg: { box: "h-16 w-11", text: "text-lg", w: 96, h: 134 },
} as const;

type Props = {
  className?: string;
  logoClassName?: string;
  textClassName?: string;
  showText?: boolean;
  size?: keyof typeof sizeMap;
};

export function BrandLogo({
  className,
  logoClassName,
  textClassName,
  showText = true,
  size = "md",
}: Props) {
  const s = sizeMap[size];

  return (
    <Link
      href="/"
      className={cn(
        "inline-flex min-w-0 max-w-full items-center gap-2.5",
        className,
      )}
    >
      <span
        className={cn(
          "relative shrink-0",
          s.box,
          logoClassName,
        )}
      >
        <Image
          src="/images/sakthi-logo.png"
          alt="Sakthi Textiles"
          width={s.w}
          height={s.h}
          className="h-full w-full object-contain object-center"
          priority
          sizes="(max-width: 768px) 30px, 44px"
        />
      </span>
      {showText ? (
        <span
          className={cn(
            s.text,
            "truncate font-bold leading-tight tracking-tight",
            "bg-gradient-to-b from-[#FFD700] via-[#E6B800] to-[#B8860B] bg-clip-text text-transparent",
            textClassName,
          )}
        >
          Sakthi Textiles
        </span>
      ) : null}
    </Link>
  );
}
