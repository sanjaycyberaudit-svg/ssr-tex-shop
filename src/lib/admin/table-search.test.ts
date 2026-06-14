import {
  buildAdminCollectionSearchText,
  buildAdminProductSearchText,
  matchesAdminTableSearch,
  normalizeAdminSearchText,
  parseAdminSearchQuery,
  tokenizeAdminSearchQuery,
} from "./table-search";

describe("admin table search", () => {
  it("normalizes separators and casing", () => {
    expect(normalizeAdminSearchText("Kanchi-Semi_Silk")).toBe(
      "kanchi semi silk",
    );
  });

  it("strips html from descriptions", () => {
    expect(normalizeAdminSearchText("<p>Soft <strong>Silk</strong></p>")).toBe(
      "soft silk",
    );
  });

  it("tokenizes queries", () => {
    expect(tokenizeAdminSearchQuery("  Silk   Saree ")).toEqual([
      "silk",
      "saree",
    ]);
  });

  it("parses quoted phrases and free tokens", () => {
    expect(parseAdminSearchQuery('"silk saree" kanchi')).toEqual({
      phrases: ["silk saree"],
      tokens: ["kanchi"],
    });
  });

  it("matches every query token anywhere in haystack", () => {
    const haystack = "kanchi semi silk kanchi sarees silk sarees";
    expect(matchesAdminTableSearch(haystack, "silk kanchi")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "silk cotton")).toBe(false);
  });

  it("requires quoted phrases to match contiguous text", () => {
    const haystack = "kanchi semi silk saree";
    expect(matchesAdminTableSearch(haystack, '"semi silk"')).toBe(true);
    expect(matchesAdminTableSearch(haystack, '"silk kanchi"')).toBe(false);
  });

  it("matches compact slug fragments without separators", () => {
    const haystack = buildAdminProductSearchText({
      node: {
        name: "Kanchi Semi Silk",
        slug: "kanchi-semi-silk-maroon",
      },
    });

    expect(matchesAdminTableSearch(haystack, "kanchisemisilk")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "maroon")).toBe(true);
  });

  it("matches badge values with underscores as words", () => {
    const haystack = buildAdminProductSearchText({
      node: {
        name: "Soft Silk",
        badge: "new_product",
        slug: "soft-silk-gold",
        collections: { label: "Silk Sarees", slug: "silk-sarees" },
      },
    });

    expect(matchesAdminTableSearch(haystack, "new product")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "silk sarees")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "soft gold")).toBe(true);
  });

  it("matches featured and price fields", () => {
    const haystack = buildAdminProductSearchText({
      node: {
        name: "Soft Silk",
        featured: true,
        price: "1299.00",
        stock: 12,
        rating: "4.8",
      },
    });

    expect(matchesAdminTableSearch(haystack, "featured")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "1299")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "12")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "4.8")).toBe(true);
  });

  it("searches collection label title slug and description", () => {
    const haystack = buildAdminCollectionSearchText({
      node: {
        label: "Kanchi Sarees",
        title: "Kanchipuram Collection",
        slug: "kanchi-sarees",
        description: "Traditional wedding sarees",
      },
    });

    expect(matchesAdminTableSearch(haystack, "kanchi wedding")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "kanchipuram")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "kanchisarees")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "cotton")).toBe(false);
  });
});
