import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  shopBoardBrand,
  shopBoardBannerHeight,
  SHOP_BOARD_ASPECT,
  type ShopBoardBrandSize,
} from "@/lib/brand/shop-board";

export type BrandWordmarkSize = ShopBoardBrandSize;

type Props = {
  className?: string;
  size?: BrandWordmarkSize;
  /** Crop anchor when the banner is wider than its container */
  align?: "left" | "center";
};

/**
 * Physical shop-board artwork — exact fonts, colours, ELAMPILLAI, and logo.
 */
export function BrandWordmark({
  className,
  size = "md",
  align = "left",
}: Props) {
  const height = shopBoardBannerHeight[size];
  const width = Math.round(height * SHOP_BOARD_ASPECT);

  return (
    <span
      className={cn("inline-flex max-w-full", className)}
      aria-label={shopBoardBrand.imageAlt}
    >
      <Image
        src={shopBoardBrand.imageSrc}
        alt={shopBoardBrand.imageAlt}
        width={width}
        height={height}
        priority={size === "nav" || size === "md"}
        className={cn(
          "w-auto max-w-full select-none",
          align === "center" ? "mx-auto object-center" : "object-left",
        )}
        style={{ height: `${height}px`, width: "auto" }}
      />
    </span>
  );
}

export default BrandWordmark;
