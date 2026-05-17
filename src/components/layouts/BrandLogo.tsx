import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { box: "h-9 w-7", text: "text-sm", img: 36 },
  md: { box: "h-11 w-8", text: "text-base", img: 44 },
  lg: { box: "h-14 w-10", text: "text-lg", img: 52 },
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
      className={cn("inline-flex min-w-0 max-w-full items-center gap-2", className)}
    >
      <span
        className={cn("relative shrink-0 overflow-hidden", s.box, logoClassName)}
      >
        <Image
          src="/images/sakthi-logo.png"
          alt="Sakthi Textile"
          width={s.img}
          height={Math.round(s.img * 1.28)}
          className="h-full w-full object-contain object-center"
          priority
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
          Sakthi Textile
        </span>
      ) : null}
    </Link>
  );
}
