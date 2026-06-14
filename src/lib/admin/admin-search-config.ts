import type { AdminTableSearchConfig } from "@/components/admin/AdminTableSearch";

export const ADMIN_PRODUCTS_SEARCH: AdminTableSearchConfig = {
  entityLabel: "products",
  placeholder: "Search by code (ST000001), name, collection, draft...",
  emptyResultHint: "try ST000001, product name, or draft",
};

export const ADMIN_COLLECTIONS_SEARCH: AdminTableSearchConfig = {
  entityLabel: "collections",
  placeholder: 'Search by name, slug — try: kanchi, "wedding saree"...',
  emptyResultHint: "try collection label, title, or slug",
};
