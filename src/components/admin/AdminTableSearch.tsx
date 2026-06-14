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
  totalCountLabel?: string;
};

export function AdminTableSearch<TData>({
  table,
  placeholder = "Search...",
  showTotalCount = false,
  totalCountLabel = "items",
}: AdminTableSearchProps<TData>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const appliedQuery =
    (table.getState().globalFilter as string | undefined) ?? "";
  const [draftQuery, setDraftQuery] = React.useState(appliedQuery);
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getPreFilteredRowModel().rows.length;
  const isFiltering = appliedQuery.trim().length > 0;
  const hasDraftChanges = draftQuery.trim() !== appliedQuery.trim();

  React.useEffect(() => {
    setDraftQuery(appliedQuery);
  }, [appliedQuery]);

  const applySearch = React.useCallback(
    (value: string = draftQuery) => {
      const next = value.trim();
      table.setGlobalFilter(next);
      table.setPageIndex(0);
      setDraftQuery(next);
    },
    [draftQuery, table],
  );

  const clearSearch = React.useCallback(() => {
    setDraftQuery("");
    table.setGlobalFilter("");
    table.setPageIndex(0);
    inputRef.current?.focus();
  }, [table]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && (appliedQuery || draftQuery)) {
        event.preventDefault();
        clearSearch();
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
  }, [appliedQuery, clearSearch, draftQuery]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full max-w-md">
          <Search
            className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            ref={inputRef}
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                applySearch(event.currentTarget.value);
              }
            }}
            placeholder={placeholder}
            className="h-9 pl-8"
            aria-label={placeholder}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            className="h-9"
            onClick={() => applySearch()}
          >
            <Search className="mr-1.5 h-3.5 w-3.5" aria-hidden />
            Search
          </Button>
          {appliedQuery || draftQuery ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 px-2"
              onClick={clearSearch}
            >
              Clear
              <X className="ml-1.5 h-3.5 w-3.5" aria-hidden />
            </Button>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {isFiltering ? (
          <p className="font-medium text-foreground" aria-live="polite">
            Showing {filteredCount} of {totalCount} for &quot;{appliedQuery}&quot;
          </p>
        ) : showTotalCount ? (
          <p className="text-muted-foreground" aria-live="polite">
            {totalCount} {totalCountLabel}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            Tip: press Enter or Search. Use quotes for exact phrases, e.g.
            &quot;silk saree&quot;
          </p>
        )}
        {hasDraftChanges ? (
          <p className="text-xs text-amber-700">
            Press Search or Enter to apply &quot;{draftQuery.trim()}&quot;
          </p>
        ) : null}
        {isFiltering && filteredCount === 0 ? (
          <p className="text-xs text-destructive">
            No matches — try ST000001, product name, or draft
          </p>
        ) : null}
      </div>
    </div>
  );
}
