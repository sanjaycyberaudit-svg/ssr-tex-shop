"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  RowSelectionState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { AdminTableSearch } from "@/components/admin/AdminTableSearch";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "@/components/ui/data-table-pagination";
import { useToast } from "@/components/ui/use-toast";
import {
  buildAdminProductSearchText,
  createAdminTableGlobalFilter,
  selectAllFilteredRows,
} from "@/lib/admin/table-search";
import { useRouter } from "next/navigation";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  enableDragSelect?: boolean;
  bulkDeleteEndpoint?: string;
  bulkDeleteLabel?: string;
}

function DataTable<TData, TValue>({
  columns,
  data,
  enableDragSelect = false,
  bulkDeleteEndpoint,
  bulkDeleteLabel = "Delete selected",
}: DataTableProps<TData, TValue>) {
  const { toast } = useToast();
  const router = useRouter();
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({});
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [drag, setDrag] = React.useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    additive: boolean;
    startSelection: RowSelectionState;
  } | null>(null);

  const tableWrapRef = React.useRef<HTMLDivElement | null>(null);
  const rowRefs = React.useRef<Record<string, HTMLTableRowElement | null>>({});

  const globalFilterFn = React.useMemo(
    () =>
      createAdminTableGlobalFilter((row) =>
        buildAdminProductSearchText(
          row as Parameters<typeof buildAdminProductSearchText>[0],
        ),
      ) as FilterFn<TData>,
    [],
  );

  const handleGlobalFilterChange = React.useCallback((value: string) => {
    setGlobalFilter(value);
    setRowSelection({});
  }, []);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
    },
    autoResetPageIndex: true,
    onGlobalFilterChange: handleGlobalFilterChange,
    globalFilterFn,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getRowId: (row, index) => {
      const item = row as Record<string, unknown>;
      const node = item.node as Record<string, unknown> | undefined;
      const nodeId = typeof node?.id === "string" ? node.id : null;
      const id = typeof item.id === "string" ? item.id : null;
      return nodeId || id || String(index);
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const selectedIds = React.useMemo(
    () =>
      Object.entries(rowSelection)
        .filter(([, selected]) => selected)
        .map(([id]) => id),
    [rowSelection],
  );
  const filteredCount = table.getFilteredRowModel().rows.length;
  const isFiltering = globalFilter.trim().length > 0;

  React.useEffect(() => {
    if (!drag || !enableDragSelect) return;

    const onMouseMove = (event: MouseEvent) => {
      setDrag((prev) =>
        prev
          ? {
              ...prev,
              currentX: event.clientX,
              currentY: event.clientY,
            }
          : null,
      );
    };
    const onMouseUp = () => setDrag(null);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [drag, enableDragSelect]);

  React.useEffect(() => {
    if (!drag || !enableDragSelect || !tableWrapRef.current) return;

    const rect = new DOMRect(
      Math.min(drag.startX, drag.currentX),
      Math.min(drag.startY, drag.currentY),
      Math.abs(drag.currentX - drag.startX),
      Math.abs(drag.currentY - drag.startY),
    );

    const hits: RowSelectionState = {};
    for (const row of table.getRowModel().rows) {
      const node = rowRefs.current[row.id];
      if (!node) continue;
      const rowRect = node.getBoundingClientRect();
      const intersects = !(
        rect.right < rowRect.left ||
        rect.left > rowRect.right ||
        rect.bottom < rowRect.top ||
        rect.top > rowRect.bottom
      );
      if (intersects) hits[row.id] = true;
    }

    setRowSelection(drag.additive ? { ...drag.startSelection, ...hits } : hits);
  }, [drag, enableDragSelect, table]);

  const onBulkDelete = async () => {
    if (!bulkDeleteEndpoint || selectedIds.length === 0) return;
    setIsDeleting(true);
    try {
      const res = await fetch(bulkDeleteEndpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const payload = (await res.json().catch(() => null)) as {
        deletedIds?: string[];
        blocked?: { id: string; reason: string }[];
        message?: string;
      } | null;
      if (!res.ok) {
        throw new Error(payload?.message || "Bulk delete failed.");
      }
      const deleted = payload?.deletedIds?.length ?? 0;
      const blocked = payload?.blocked?.length ?? 0;
      setRowSelection({});
      router.refresh();
      toast({
        title: "Bulk delete completed",
        description: `Deleted: ${deleted}, Blocked: ${blocked}.`,
      });
    } catch (error) {
      toast({
        title: "Bulk delete failed",
        description: error instanceof Error ? error.message : "Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const dragOverlayStyle = React.useMemo(() => {
    if (!drag || !tableWrapRef.current) return undefined;
    const rootRect = tableWrapRef.current.getBoundingClientRect();
    return {
      left: Math.min(drag.startX, drag.currentX) - rootRect.left,
      top: Math.min(drag.startY, drag.currentY) - rootRect.top,
      width: Math.abs(drag.currentX - drag.startX),
      height: Math.abs(drag.currentY - drag.startY),
    };
  }, [drag]);

  return (
    <div className="space-y-4">
      <AdminTableSearch
        table={table}
        showTotalCount
        placeholder='Search products — try: ST_01, silk kanchi, "silk saree", draft, featured...'
      />
      {bulkDeleteEndpoint ? (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => selectAllFilteredRows(table, setRowSelection)}
            disabled={filteredCount === 0}
          >
            {isFiltering ? `Select filtered (${filteredCount})` : "Select all"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setRowSelection({})}
            disabled={selectedIds.length === 0}
          >
            Clear
          </Button>
          <Button
            variant="destructive"
            onClick={() => void onBulkDelete()}
            disabled={selectedIds.length === 0 || isDeleting}
          >
            {isDeleting
              ? "Deleting..."
              : `${bulkDeleteLabel} (${selectedIds.length})`}
          </Button>
          {enableDragSelect ? (
            <span className="text-xs text-muted-foreground">
              Tip: Drag on empty table space to box-select rows.
            </span>
          ) : null}
        </div>
      ) : null}
      <div ref={tableWrapRef} className="relative rounded-md border">
        <Table
          onMouseDown={(event) => {
            if (
              !enableDragSelect ||
              event.button !== 0 ||
              !tableWrapRef.current
            )
              return;
            const target = event.target as HTMLElement;
            if (
              target.closest("button") ||
              target.closest("a") ||
              target.closest("[role=checkbox]")
            ) {
              return;
            }
            setDrag({
              startX: event.clientX,
              startY: event.clientY,
              currentX: event.clientX,
              currentY: event.clientY,
              additive: event.ctrlKey || event.metaKey,
              startSelection: rowSelection,
            });
          }}
        >
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  ref={(node) => {
                    rowRefs.current[row.id] = node;
                  }}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {globalFilter.trim()
                    ? `No results for "${globalFilter.trim()}".`
                    : "No results."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        {dragOverlayStyle ? (
          <div
            className="pointer-events-none absolute z-20 border border-primary/70 bg-primary/15"
            style={dragOverlayStyle}
          />
        ) : null}
      </div>
      {isFiltering && filteredCount === 0 ? null : (
        <DataTablePagination table={table} />
      )}
    </div>
  );
}

export default DataTable;
