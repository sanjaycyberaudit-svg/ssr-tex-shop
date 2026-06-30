import Image from "next/image";
import { cn } from "@/lib/utils";

export type BrandEmblemSize = "sm" | "md" | "lg" | "nav" | "sidebar" | "footer";

const EMBLEM_PX: Record<BrandEmblemSize, number> = {
  nav: 36,
  sidebar: 34,
  sm: 34,
  md: 46,
  footer: 44,
  lg: 58,
};

type Props = {
  size?: BrandEmblemSize;
  className?: string;
  priority?: boolean;
};

/** Gold circular SSR emblem — matches physical shop board branding */
export function BrandEmblem({
  size = "md",
  className,
  priority = false,
}: Props) {
  const px = EMBLEM_PX[size];

  return (
    <Image
      src="/images/ssr-shop-emblem.svg"
      alt=""
      width={px}
      height={px}
      priority={priority}
      className={cn("shrink-0 select-none", className)}
      aria-hidden
    />
  );
}

export default BrandEmblem;
