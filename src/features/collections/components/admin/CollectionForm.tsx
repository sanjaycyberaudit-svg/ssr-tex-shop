"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createInsertSchema } from "drizzle-zod";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { Input } from "@/components/ui/input";

import { InsertCollection, collections } from "@/lib/supabase/schema";

import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { DocumentType, gql } from "@/gql";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImageDialog } from "@/features/medias";

const CollectionFromFragment = gql(/* GraphQL */ `
  fragment CollectionFromFragment on collections {
    id
    slug
    label
    description
    title
    featured_image_id
  }
`);
type CollectionFormProps = {
  collection?: DocumentType<typeof CollectionFromFragment>;
};

function CollectionForm({ collection }: CollectionFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, setIsPending] = useState(false);

  const form = useForm<InsertCollection>({
    resolver: zodResolver(createInsertSchema(collections)),
    defaultValues: {
      ...collection,
      featuredImageId: collection ? collection.featured_image_id : undefined,
    },
  });

  const {
    register,
    control,
    handleSubmit,
  } = form;

  const onSubmit = handleSubmit(async (data: InsertCollection) => {
    setIsPending(true);
    try {
      const payload = {
        slug: data.slug,
        label: data.label,
        description: data.description,
        title: data.title,
        featuredImageId: data.featuredImageId,
      };

      if (collection) {
        const res = await fetch("/api/admin/collections", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: collection.id, ...payload }),
        });

        if (!res.ok) {
          const err = (await res.json().catch(() => null)) as
            | { message?: string }
            | null;
          throw new Error(err?.message || "Failed to update collection.");
        }

        router.replace("/admin/collections");
        router.refresh();
        toast({ title: "Collection updated successfully." });
        return;
      }

      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as
          | { message?: string }
          | null;
        throw new Error(err?.message || "Failed to create collection.");
      }

      router.replace("/admin/collections");
      router.refresh();
      toast({ title: "Collection created successfully." });
    } catch (error) {
      toast({
        title: "Unable to save collection",
        description:
          error instanceof Error ? error.message : "Please retry.",
        variant: "destructive",
      });
    } finally {
      setIsPending(false);
    }
  });

  return (
    <Form {...form}>
      <form
        id="project-form"
        className="gap-x-5 flex gap-y-5 flex-col px-3"
        onSubmit={onSubmit}
      >
        <div className="flex flex-col gap-y-5 max-w-[500px]">
          <FormItem>
            <FormLabel className="text-sm">Label*</FormLabel>
            <FormControl>
              <Input
                aria-invalid={!!form.formState.errors.label}
                placeholder="Type Collection label."
                {...register("label")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
          <FormItem>
            <FormLabel className="text-sm">Title*</FormLabel>
            <FormControl>
              <Input
                aria-invalid={!!form.formState.errors.title}
                placeholder="Type Collection title."
                {...register("title")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Slug*</FormLabel>
            <FormControl>
              <Input
                defaultValue={collection?.slug}
                aria-invalid={!!form.formState.errors.slug}
                placeholder="Type Collection slug."
                {...register("slug")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormItem>
            <FormLabel className="text-sm">Description*</FormLabel>
            <FormControl>
              <Textarea
                defaultValue={collection?.description}
                aria-invalid={!!form.formState.errors.description}
                placeholder="Type Collection description."
                {...register("description")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>

          <FormField
            control={form.control}
            name="featuredImageId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Featured Image*</FormLabel>
                <Suspense>
                  <div className="">
                    <ImageDialog
                      defaultValue={collection?.featured_image_id}
                      onChange={field.onChange}
                      value={field.value}
                    />
                  </div>
                </Suspense>

                <FormDescription>
                  Drag n Drop the image to above section or click the button to
                  select from Image gallery.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="py-8 flex gap-x-5 items-center">
          <Button disabled={isPending} variant={"outline"} form="project-form">
            {collection ? "Update" : "Create"}
            {isPending && (
              <Spinner
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
          </Button>
          <Link href="/admin/collections" className={buttonVariants()}>
            Cancel
          </Link>
        </div>
      </form>
    </Form>
  );
}

export default CollectionForm;
