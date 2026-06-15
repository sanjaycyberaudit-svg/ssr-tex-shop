export type HomeBannerSlideInput = {
  href?: string | null;
  productId?: string | null;
};

export function buildProductShopHref(slug: string): string {
  const normalized = slug.trim().replace(/^\/+/, "");
  if (!normalized) return "/shop";
  return `/shop/${normalized}`;
}

/** Prefer linked product slug; fall back to manual href. */
export function resolveHomeBannerSlideHref(
  slide: HomeBannerSlideInput,
  productSlugById: Map<string, string>,
): string {
  const productId = String(slide.productId ?? "").trim();
  if (productId) {
    const slug = productSlugById.get(productId);
    if (slug) return buildProductShopHref(slug);
  }

  const href = String(slide.href ?? "").trim();
  return href || "/shop";
}
