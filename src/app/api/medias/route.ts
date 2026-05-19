import { env } from "@/env.mjs";
import { processUploadedImage } from "@/lib/image/processUpload";
import { uploadImage } from "@/lib/s3";
import db from "@/lib/supabase/db";
import { medias } from "@/lib/supabase/schema";
import { mediaSchema } from "@/validations/medias";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const data = Object.fromEntries(formData) as z.infer<typeof mediaSchema>;
  const validation = mediaSchema.safeParse(data);

  if (validation.success === false) {
    return NextResponse.json(validation.error.format(), { status: 400 });
  }

  const uploadedPaths: string[] = [];
  const errors: string[] = [];

  for (const file of Object.values(data)) {
    if (!file || !(file instanceof File)) continue;

    try {
      const processed = await processUploadedImage(file);
      const key = `public/${nanoid()}.${processed.extension}`;

      await uploadImage({
        Bucket: env.NEXT_PUBLIC_S3_BUCKET,
        Key: key,
        Body: processed.buffer,
        ContentType: processed.contentType,
        CacheControl: "public, max-age=31536000, immutable",
      });

      await db.insert(medias).values({ alt: file.name, key }).returning();

      uploadedPaths.push(file.name);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed.";
      errors.push(`${file.name}: ${message}`);
    }
  }

  if (uploadedPaths.length === 0) {
    return NextResponse.json(
      { message: errors.join(" ") || "No images were uploaded." },
      { status: 400 },
    );
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { uploaded: uploadedPaths, errors },
      { status: 207 },
    );
  }

  return NextResponse.json(uploadedPaths, { status: 201 });
}
