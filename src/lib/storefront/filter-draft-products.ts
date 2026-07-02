import { getDraftProductIdsCached } from "@/lib/storefront/draft-product-ids";

type ProductEdge = {
  node: { id: string };
};

type ProductsCollection = {
  edges: ProductEdge[];
  pageInfo?: unknown;
} | null;

export async function filterDraftProductsFromCollection<
  T extends ProductsCollection,
>(collection: T): Promise<T> {
  if (!collection?.edges?.length) return collection;

  const draftIds = new Set(await getDraftProductIdsCached());
  if (draftIds.size === 0) return collection;

  return {
    ...collection,
    edges: collection.edges.filter((edge) => !draftIds.has(edge.node.id)),
  } as T;
}
