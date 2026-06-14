"use client";

import * as React from "react";
import { Table } from "@tanstack/react-table";
import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type AdminTableSearchConfig = {
  /** e.g. "products" or "collections" */
  entityLabel: string;
  placeholder: string;
  /** Shown when search returns zero rows */
  emptyResultHint?: string;
};

type AdminTableSearchProps<TData> = {
  table: Table<TData>;
} & AdminTableSearchConfig;

export function AdminTableSearch<TData>({
  table,
  entityLabel,
  placeholder,
  emptyResultHint,
}: AdminTableSearchProps<TData>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const appliedQuery =
    (table.getState().globalFilter as string | undefined) ?? "";
  const [draftQuery, setDraftQuery] = React.useState(appliedQuery);
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getPreFilteredRowModel().rows.length;
  const isFiltering = appliedQuery.trim().length > 0;
  const hasDraftChanges = draftQuery.trim() !== appliedQuery.trim();
  const isPending = hasDraftChanges && draftQuery.trim().length > 0;

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

  const statusBadge = isPending ? (
    <Badge variant="outline" className="border-amber-300 text-amber-800">
      Ready to search
    </Badge>
  ) : isFiltering ? (
    <Badge className="bg-primary text-primary-foreground">Search active</Badge>
  ) : (
    <Badge variant="secondary">Showing all {entityLabel}</Badge>
  );

  return (
    <section
      className="rounded-lg border bg-muted/20 p-4"
      aria-label={`Search ${entityLabel}`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold capitalize">Search {entityLabel}</h3>
        {statusBadge}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative w-full max-w-xl">
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
            className={`h-10 pl-8 ${isPending ? "border-amber-400 ring-1 ring-amber-200" : ""}`}
            aria-label={placeholder}
            spellCheck={false}
            autoComplete="off"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            className="h-10 min-w-[110px]"
            onClick={() => applySearch()}
          >
            <Search className="mr-2 h-4 w-4" aria-hidden />
            Search
          </Button>
          {(appliedQuery || draftQuery) && (
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={clearSearch}
            >
              Clear
              <X className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          )}
        </div>
      </div>

      <div className="mt-3 space-y-1 text-sm" aria-live="polite">
        {isFiltering ? (
          <p className="font-medium">
            Results: {filteredCount} of {totalCount} {entityLabel} match &quot;
            {appliedQuery}&quot;
          </p>
        ) : (
          <p className="text-muted-foreground">
            {totalCount} {entityLabel} loaded. Type a keyword and click Search or
            press Enter.
          </p>
        )}

        {isPending ? (
          <p className="text-amber-700">
            Click Search or press Enter to find &quot;{draftQuery.trim()}&quot;
          </p>
        ) : null}

        {isFiltering && filteredCount === 0 ? (
          <p className="text-destructive">
            No {entityLabel} found for &quot;{appliedQuery}&quot;
            {emptyResultHint ? ` — ${emptyResultHint}` : ""}
          </p>
        ) : null}
      </div>
    </section>
  );
}
