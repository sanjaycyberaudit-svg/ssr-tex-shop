/** Colours sampled from the physical SSR Tex shop board artwork */
export const shopBoardBrand = {
  imageSrc: "/images/ssr-shop-board-banner.png",
  imageAlt: "Sri Sai Raghavendra Tex — Elampillai",
  purpleDeep: "#3A0A38",
  purpleMid: "#5C1458",
  purpleLight: "#6E1A68",
  gold: "#D4AF37",
  goldLight: "#F5E6B8",
  textWhite: "#FFFFFF",
  textGlow:
    "0 0 10px rgba(255,255,255,0.45), 0 0 22px rgba(255,255,255,0.18), 0 2px 6px rgba(0,0,0,0.35)",
} as const;

export type ShopBoardBrandSize =
  | "sm"
  | "md"
  | "lg"
  | "nav"
  | "sidebar"
  | "footer";

/** Render height (px) for the shop-board banner image per placement */
export const shopBoardBannerHeight: Record<ShopBoardBrandSize, number> = {
  nav: 50,
  sidebar: 44,
  sm: 44,
  md: 56,
  footer: 64,
  lg: 80,
};

/** Approximate aspect ratio of the shop board artwork (width / height) */
export const SHOP_BOARD_ASPECT = 4.85;
