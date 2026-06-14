import {
  buildAdminCollectionSearchText,
  buildAdminProductSearchText,
  matchesAdminTableSearch,
  normalizeAdminSearchText,
  tokenizeAdminSearchQuery,
} from "./table-search";

describe("admin table search", () => {
  it("normalizes separators and casing", () => {
    expect(normalizeAdminSearchText("Kanchi-Semi_Silk")).toBe("kanchi semi silk");
  });

  it("tokenizes queries", () => {
    expect(tokenizeAdminSearchQuery("  Silk   Saree ")).toEqual([
      "silk",
      "saree",
    ]);
  });

  it("matches every query token anywhere in haystack", () => {
    const haystack = "kanchi semi silk kanchi sarees silk sarees";
    expect(matchesAdminTableSearch(haystack, "silk kanchi")).toBe(true);
    expect(matchesAdminTableSearch(haystack, "silk cotton")).toBe(false);
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
    expect(matchesAdminTableSearch(haystack, "cotton")).toBe(false);
  });
});
