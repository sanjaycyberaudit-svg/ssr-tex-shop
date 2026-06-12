"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/ui/deleteDialog";
import { gql, DocumentType } from "@/gql";
import { fetchWithTimeout } from "@/lib/network/fetchWithTimeout";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export const CollectionColumnsFragment = gql(/* GraphQL */ `
  fragment CollectionColumnsFragment on collections {
    id
    title
    label
    description
    slug
  }
`);

function CollectionRowActions({
  collectionId,
  label,
}: {
  collectionId: string;
  label: string;
}) {
  const router = useRouter();
  const { toast } = useToast();

  const onDelete = async () => {
    try {
      const res = await fetchWithTimeout("/api/admin/collections", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: collectionId }),
      });
      const payload = (await res.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!res.ok) {
        throw new Error(payload?.message || "Delete failed");
      }

      toast({ title: `"${label}" deleted.` });
      router.refresh();
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Please retry.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Link href={`/admin/collections/${collectionId}`}>
        <Button size="sm" variant="outline" aria-label={`Edit ${label}`}>
          <Pencil className="mr-1.5 h-3.5 w-3.5" />
          Edit
        </Button>
      </Link>
      <DeleteDialog
        onClickHandler={() => {
          void onDelete();
        }}
        triggerLabel="Delete"
        title={`Delete "${label}"?`}
        description="Products in this collection will become uncategorized. This cannot be undone."
        actionLabel="Delete"
      />
    </div>
  );
}

const CollectionsColumns: ColumnDef<{
  node: DocumentType<typeof CollectionColumnsFragment>;
}>[] = [
  {
    accessorKey: "label",
    header: () => <div className="text-left capitalize">Label</div>,
    cell: ({ row }) => {
      const collection = row.original.node;

      return (
        <Link
          href={`/admin/collections/${collection.id}`}
          className="text-center font-medium capitalize px-3 hover:underline"
        >
          {collection.label}
        </Link>
      );
    },
  },
  {
    accessorKey: "slug",
    header: () => <div className="">Slug</div>,
    cell: ({ row }) => {
      const collection = row.original.node;

      return <div className="font-medium">{collection.slug}</div>;
    },
  },
  {
    accessorKey: "title",
    header: () => <div className="text-left capitalize">Title</div>,
    cell: ({ row }) => {
      const collection = row.original.node;

      return (
        <p className="font-medium capitalize px-3">{collection.title}</p>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right capitalize">Actions</div>,
    cell: ({ row }) => {
      const collection = row.original.node;

      return (
        <CollectionRowActions
          collectionId={collection.id}
          label={collection.label}
        />
      );
    },
  },
];

export default CollectionsColumns;
