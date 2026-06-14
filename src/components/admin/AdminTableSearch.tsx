"use client";

import { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminTableSearchProps<TData> = {
  table: Table<TData>;
  placeholder?: string;
};

export function AdminTableSearch<TData>({
  table,
  placeholder = "Search...",
}: AdminTableSearchProps<TData>) {
  const query = (table.getState().globalFilter as string | undefined) ?? "";
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getPreFilteredRowModel().rows.length;
  const isFiltering = query.trim().length > 0;

  const onQueryChange = (value: string) => {
    table.setGlobalFilter(value);
    table.setPageIndex(0);
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full max-w-sm">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          className="h-9 pl-8"
          aria-label={placeholder}
        />
      </div>
      <div className="flex items-center gap-2">
        {isFiltering ? (
          <p className="text-sm text-muted-foreground">
            {filteredCount} of {totalCount} shown
          </p>
        ) : null}
        {query ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-9 px-2"
            onClick={() => onQueryChange("")}
          >
            Clear
            <X className="ml-1.5 h-3.5 w-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>
    </div>
  );
}
