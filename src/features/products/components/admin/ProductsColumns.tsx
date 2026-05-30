"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import DeleteDialog from "@/components/ui/deleteDialog";
import { gql, DocumentType } from "@/gql";
import { formatPrice } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

export const ProductColumnFragment = gql(/* GraphQL */ `
  fragment ProductColumnFragment on products {
    id
    name
    description
    rating
    slug
    badge
    price
    badge
    featured
    featuredImage: medias {
      id
      key
      alt
    }
    collections {
      id
      label
      slug
    }
  }
`);

type ProductRow = {
  node: DocumentType<typeof ProductColumnFragment>;
};

function ProductRowActions({ productId }: { productId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  const onDelete = async () => {
    try {
      const res = await fetch("/api/admin/products/manage", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [productId] }),
      });
      const payload = (await res.json().catch(() => null)) as {
        deletedIds?: string[];
        blocked?: { id: string; reason: string }[];
        message?: string;
      } | null;

      if (!res.ok) {
        throw new Error(payload?.message || "Delete failed");
      }

      const blocked = payload?.blocked ?? [];
      if (blocked.length > 0) {
        throw new Error(blocked[0].reason || "Product cannot be deleted.");
      }

      toast({ title: "Product deleted." });
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
    <div className="flex items-center gap-2">
      <Link href={`/admin/products/${productId}`}>
        <Button size="sm" variant="outline">
          Edit
        </Button>
      </Link>
      <DeleteDialog
        onClickHandler={() => {
          void onDelete();
        }}
        triggerLabel="Delete"
        title="Delete product?"
        description="This action permanently removes the product if it has no order history."
        actionLabel="Delete"
      />
    </div>
  );
}

const ProductsColumns: ColumnDef<ProductRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
            ? true
            : table.getIsSomePageRowsSelected()
              ? "indeterminate"
              : false
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all products on page"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select product row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "name",
    header: () => <div className="text-left capitalize">Product Name</div>,
    cell: ({ row }) => {
      const product = row.original.node;

      return (
        <Link
          href={`/admin/products/${product.id}`}
          className="text-center font-medium capitalize px-3 hover:underline"
        >
          {product.name}
        </Link>
      );
    },
  },
  {
    accessorKey: "slug",
    header: () => <div className="">Slug</div>,
    cell: ({ row }) => {
      const product = row.original.node;

      return <div className="font-medium">{product.slug}</div>;
    },
  },
  {
    accessorKey: "Collection",
    header: () => <div className="">Collection</div>,
    cell: ({ row }) => {
      const product = row.original.node;

      return (
        <div className="font-medium">
          {product.collections ? product.collections.label : "-"}
        </div>
      );
    },
  },
  {
    accessorKey: "featured",
    header: () => <div className="">Featured</div>,
    cell: ({ row }) => {
      const product = row.original.node;

      return <div className="font-medium">{`${product.featured}`}</div>;
    },
  },
  {
    accessorKey: "price",
    header: () => <div className="">Price</div>,
    cell: ({ row }) => {
      const product = row.original.node;

      return <div className="font-medium">{formatPrice(product.price)}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-center capitalize">Actions</div>,
    cell: ({ row }) => {
      const product = row.original.node;
      return <ProductRowActions productId={product.id} />;
    },
  },
];

export default ProductsColumns;
