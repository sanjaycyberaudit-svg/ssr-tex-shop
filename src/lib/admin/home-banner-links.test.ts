import {
  buildProductShopHref,
  resolveHomeBannerSlideHref,
} from "./home-banner-links";

describe("home banner links", () => {
  it("builds shop href from slug", () => {
    expect(buildProductShopHref("silk-saree-st000239")).toBe(
      "/shop/silk-saree-st000239",
    );
  });

  it("prefers linked product slug over manual href", () => {
    const map = new Map([["p1", "featured-saree"]]);
    expect(
      resolveHomeBannerSlideHref(
        { productId: "p1", href: "/shop/old-slug" },
        map,
      ),
    ).toBe("/shop/featured-saree");
  });

  it("falls back to manual href when product is not linked", () => {
    expect(
      resolveHomeBannerSlideHref(
        { productId: "", href: "/collections/silk" },
        new Map(),
      ),
    ).toBe("/collections/silk");
  });
});
