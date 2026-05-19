"use client";

import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DocumentType } from "@/gql";
import { TestimonialColumnsFragment } from "../query";

const TestimonialsColumns: ColumnDef<{
  node: DocumentType<typeof TestimonialColumnsFragment>;
}>[] = [
  {
    accessorKey: "kind",
    header: () => <span>Type</span>,
    cell: ({ row }) => (
      <span className="capitalize text-muted-foreground">
        {row.original.node.kind === "video" ? "Video" : "Text"}
      </span>
    ),
  },
  {
    accessorKey: "customer_name",
    header: () => <span className="text-left">Customer</span>,
    cell: ({ row }) => {
      const item = row.original.node;
      return (
        <Link
          href={`/admin/testimonials/${item.id}`}
          className="font-medium hover:underline"
        >
          {item.customer_name}
        </Link>
      );
    },
  },
  {
    accessorKey: "location",
    header: () => <span>Location</span>,
    cell: ({ row }) => (
      <span className="text-muted-foreground">
        {row.original.node.location || "—"}
      </span>
    ),
  },
  {
    accessorKey: "rating",
    header: () => <span className="block text-center">Rating</span>,
    cell: ({ row }) => (
      <span className="block text-center">
        {row.original.node.rating ?? 5}/5
      </span>
    ),
  },
  {
    accessorKey: "is_published",
    header: () => <span className="block text-center">Published</span>,
    cell: ({ row }) => (
      <span className="block text-center">
        {row.original.node.is_published ? "Yes" : "No"}
      </span>
    ),
  },
  {
    id: "actions",
    header: () => <span className="block text-center">Actions</span>,
    cell: ({ row }) => {
      const item = row.original.node;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            className="flex flex-col items-start"
          >
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <Link
              href={`/admin/testimonials/${item.id}`}
              className={buttonVariants({ variant: "ghost" })}
            >
              Edit testimonial
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default TestimonialsColumns;
