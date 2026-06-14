"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AdminTableSearchProps<TData> = {
  table: Table<TData>;
  placeholder?: string;
  showTotalCount?: boolean;
};

export function AdminTableSearch<TData>({
  table,
  placeholder = "Search...",
  showTotalCount = false,
}: AdminTableSearchProps<TData>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const query = (table.getState().globalFilter as string | undefined) ?? "";
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getPreFilteredRowModel().rows.length;
  const isFiltering = query.trim().length > 0;

  const onQueryChange = (value: string) => {
    table.setGlobalFilter(value);
    table.setPageIndex(0);
  };

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && query) {
        event.preventDefault();
        onQueryChange("");
        inputRef.current?.blur();
      }

      if (
        event.key === "/" &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement)
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [query]);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative w-full max-w-md">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          ref={inputRef}
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={placeholder}
          className="h-9 pl-8"
          aria-label={placeholder}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
      <div className="flex items-center gap-2">
        {isFiltering ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {filteredCount} of {totalCount} shown
          </p>
        ) : showTotalCount ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {totalCount} products
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tip: use quotes for exact phrases, e.g. &quot;silk saree&quot;
          </p>
        )}
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
