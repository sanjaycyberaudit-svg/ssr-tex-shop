import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

/** Vertical oval logo — tight fit, minimal gap to wordmark */
const sizeMap = {
  sm: {
    logo: "h-9",
    text: "text-sm",
    imgW: 54,
    imgH: 76,
  },
  md: {
    logo: "h-11",
    text: "text-base",
    imgW: 66,
    imgH: 92,
  },
  lg: {
    logo: "h-14",
    text: "text-lg",
    imgW: 84,
    imgH: 118,
  },
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
        "inline-flex w-fit max-w-full shrink-0 items-center gap-0.5",
        className,
      )}
    >
      <span
        className={cn(
          "relative block shrink-0 aspect-[11/16] w-auto",
          s.logo,
          logoClassName,
        )}
      >
        <Image
          src="/images/sakthi-logo.png"
          alt={siteConfig.name}
          width={s.imgW}
          height={s.imgH}
          className="size-full object-contain object-center"
          priority
          sizes="(max-width: 768px) 28px, 40px"
        />
      </span>
      {showText ? (
        <span
          className={cn(
            s.text,
            "shrink-0 whitespace-nowrap font-bold leading-none tracking-tight -ml-0.5",
            "bg-gradient-to-b from-[#FFD700] via-[#E6B800] to-[#B8860B] bg-clip-text text-transparent",
            textClassName,
          )}
        >
          {siteConfig.name}
        </span>
      ) : null}
    </Link>
  );
}

export default BrandLogo;
