import type { FilterFn } from "@tanstack/react-table";

export function matchesAdminTableSearch(
  haystack: string,
  filterValue: unknown,
): boolean {
  const query = String(filterValue ?? "")
    .trim()
    .toLowerCase();
  if (!query) return true;
  return haystack.toLowerCase().includes(query);
}

export function createAdminTableGlobalFilter<TData>(
  getSearchText: (row: TData) => string,
): FilterFn<TData> {
  return (row, _columnId, filterValue) =>
    matchesAdminTableSearch(getSearchText(row.original), filterValue);
}
