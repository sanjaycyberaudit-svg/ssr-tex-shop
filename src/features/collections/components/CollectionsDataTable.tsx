"use client";

import { DataTable } from "@/features/cms";
import CollectionsColumns from "./CollectionsColumns";

type CollectionRow = {
  node: {
    label: string;
    title: string;
    slug: string;
    description?: string | null;
  };
};

type CollectionsDataTableProps = {
  data: CollectionRow[];
};

export function CollectionsDataTable({ data }: CollectionsDataTableProps) {
  return (
    <DataTable
      columns={CollectionsColumns}
      data={data}
      searchPlaceholder="Search collections by label, title, or slug..."
      getSearchText={(row) =>
        [row.node.label, row.node.title, row.node.slug, row.node.description]
          .filter(Boolean)
          .join(" ")
      }
    />
  );
}
