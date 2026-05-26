import {
  BulkDraftSharedData,
  createDraftProductsFromMedia,
} from "@/_actions/products";
import { getSessionUser, isAdminUser } from "@/lib/auth/admin";
import { processUploadedImage } from "@/lib/image/processUpload";
import { uploadMediaToSupabase } from "@/lib/storage/uploadMedia";
import db from "@/lib/supabase/db";
import { medias } from "@/lib/supabase/schema";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MAX_BULK_FILES = 50;

const bulkSharedSchema = z.object({
  name: z.string().trim().min(2, "Name is required for bulk mode."),
  description: z.string().default(""),
  isDraft: z.boolean().default(true),
  collectionId: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((value) => (value ? value : null)),
  badge: z
    .enum(["new_product", "best_sale", "featured"])
    .optional()
    .nullable()
    .transform((value) => value ?? null),
  rating: z.string().trim().min(1).default("4"),
  price: z.string().trim().min(1).default("0"),
  tags: z.array(z.string()).default([]),
});

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  const isAdmin = await isAdminUser(user);
  if (!user || !isAdmin) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);
  const sharedRaw = formData.get("shared");

  let shared: BulkDraftSharedData | undefined;
  if (typeof sharedRaw === "string" && sharedRaw.trim().length > 0) {
    let sharedJson: unknown;
    try {
      sharedJson = JSON.parse(sharedRaw);
    } catch {
      return NextResponse.json(
        { message: "Invalid shared bulk product details." },
        { status: 400 },
      );
    }

    const parsedShared = bulkSharedSchema.safeParse(sharedJson);
    if (!parsedShared.success) {
      return NextResponse.json(
        { message: "Invalid shared bulk product details." },
        { status: 400 },
      );
    }
    shared = {
      baseName: parsedShared.data.name,
      description: parsedShared.data.description,
      isDraft: parsedShared.data.isDraft,
      collectionId: parsedShared.data.collectionId,
      badge: parsedShared.data.badge,
      rating: parsedShared.data.rating,
      price: parsedShared.data.price,
      tags: parsedShared.data.tags,
    };
  }

  if (files.length === 0) {
    return NextResponse.json(
      { message: "Select at least one image file." },
      { status: 400 },
    );
  }

  if (files.length > MAX_BULK_FILES) {
    return NextResponse.json(
      { message: `You can upload up to ${MAX_BULK_FILES} images at once.` },
      { status: 400 },
    );
  }

  const uploadErrors: string[] = [];
  const uploadedMedias: { mediaId: string; originalFileName: string }[] = [];

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      uploadErrors.push(`${file.name}: only image files are allowed.`);
      continue;
    }

    try {
      const processed = await processUploadedImage(file);
      const key = await uploadMediaToSupabase(
        processed.buffer,
        processed.contentType,
        processed.extension,
        "product-draft",
      );

      const [insertedMedia] = await db
        .insert(medias)
        .values({ alt: file.name, key })
        .returning({ id: medias.id });

      uploadedMedias.push({
        mediaId: insertedMedia.id,
        originalFileName: file.name,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed.";
      uploadErrors.push(`${file.name}: ${message}`);
    }
  }

  if (uploadedMedias.length === 0) {
    return NextResponse.json(
      {
        message: "No products were created.",
        created: [],
        errors: uploadErrors,
      },
      { status: 400 },
    );
  }

  try {
    const createdProducts = await createDraftProductsFromMedia(
      uploadedMedias,
      shared,
    );

    if (uploadErrors.length > 0) {
      return NextResponse.json(
        {
          message: "Created with partial errors.",
          created: createdProducts,
          errors: uploadErrors,
        },
        { status: 207 },
      );
    }

    return NextResponse.json(
      {
        message: "Draft products created.",
        created: createdProducts,
        errors: [],
      },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not create draft products.";
    return NextResponse.json(
      {
        message,
        created: [],
        errors: [...uploadErrors, message],
      },
      { status: 500 },
    );
  }
}
