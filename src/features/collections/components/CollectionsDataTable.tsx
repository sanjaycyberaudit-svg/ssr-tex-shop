"use client";

import { DataTable } from "@/features/cms";
import { buildAdminCollectionSearchText } from "@/lib/admin/table-search";
import { DocumentType } from "@/gql";
import CollectionsColumns, {
  CollectionColumnsFragment,
} from "./CollectionsColumns";

type CollectionRow = {
  node: DocumentType<typeof CollectionColumnsFragment>;
};

type CollectionsDataTableProps = {
  data: CollectionRow[];
};

export function CollectionsDataTable({ data }: CollectionsDataTableProps) {
  return (
    <DataTable
      columns={CollectionsColumns}
      data={data}
      searchPlaceholder='Search collections — try: kanchi, "wedding saree", silk-sarees...'
      getSearchText={(row) =>
        buildAdminCollectionSearchText(
          row as Parameters<typeof buildAdminCollectionSearchText>[0],
        )
      }
    />
  );
}
