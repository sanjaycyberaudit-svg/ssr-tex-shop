import { UPLOAD_LIMIT_BYTES, UPLOAD_LIMIT_MB } from "@/lib/image/uploadLimits";
import { processUploadedImage } from "@/lib/image/processUpload";
import db from "@/lib/supabase/db";
import { medias } from "@/lib/supabase/schema";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { SUPABASE_MEDIA_BUCKET } from "@/lib/utils";
import { nanoid } from "nanoid";
import { ensureMediaBucket, uploadMediaToSupabase } from "./uploadMedia";

export type DirectUploadPurpose = "upload" | "product-draft";

const STAGING_PREFIX = "sakthi/staging/";

const ALLOWED_EXTENSIONS = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "heic",
  "heif",
  "avif",
]);

export function sanitizeExtension(fileName: string): string {
  const match = fileName.match(/\.([a-zA-Z0-9]+)$/);
  const ext = match?.[1]?.toLowerCase() ?? "jpg";
  return ALLOWED_EXTENSIONS.has(ext) ? ext : "jpg";
}

export function buildStagingPath(fileName: string): string {
  return `${STAGING_PREFIX}${nanoid()}.${sanitizeExtension(fileName)}`;
}

export function isValidStagingPath(path: string): boolean {
  if (!path.startsWith(STAGING_PREFIX)) return false;
  if (path.includes("..") || path.includes("\\")) return false;
  return /^sakthi\/staging\/[A-Za-z0-9_-]+\.[a-z0-9]+$/i.test(path);
}

async function deleteStagingFile(storagePath: string) {
  const supabase = createServiceRoleClient();
  await supabase.storage.from(SUPABASE_MEDIA_BUCKET).remove([storagePath]);
}

export async function createDirectUploadSession(params: {
  fileName: string;
  contentType: string;
  fileSize: number;
}) {
  if (params.fileSize <= 0) {
    throw new Error("File is empty.");
  }
  if (params.fileSize > UPLOAD_LIMIT_BYTES) {
    throw new Error(`Each image must be ${UPLOAD_LIMIT_MB} MB or smaller.`);
  }
  if (!params.contentType.startsWith("image/")) {
    throw new Error("Only image files are allowed.");
  }

  await ensureMediaBucket();
  const storagePath = buildStagingPath(params.fileName);
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data?.signedUrl || !data.path) {
    throw new Error(error?.message ?? "Could not create upload session.");
  }

  return {
    storagePath: data.path,
    signedUrl: data.signedUrl,
    token: data.token,
  };
}

export async function finalizeDirectUpload(params: {
  storagePath: string;
  originalFileName: string;
  purpose: DirectUploadPurpose;
}) {
  if (!isValidStagingPath(params.storagePath)) {
    throw new Error("Invalid staging path.");
  }

  const supabase = createServiceRoleClient();
  const { data: blob, error: downloadError } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .download(params.storagePath);

  if (downloadError || !blob) {
    throw new Error("Uploaded file not found. Try uploading again.");
  }

  const buffer = Buffer.from(await blob.arrayBuffer());
  if (buffer.length === 0) {
    await deleteStagingFile(params.storagePath);
    throw new Error("Empty file.");
  }
  if (buffer.length > UPLOAD_LIMIT_BYTES) {
    await deleteStagingFile(params.storagePath);
    throw new Error(`Each image must be ${UPLOAD_LIMIT_MB} MB or smaller.`);
  }

  const contentType = blob.type || "application/octet-stream";
  const uploadFile = new File([buffer], params.originalFileName, {
    type: contentType,
  });

  let processed;
  try {
    processed = await processUploadedImage(uploadFile);
  } catch (error) {
    await deleteStagingFile(params.storagePath);
    throw error instanceof Error ? error : new Error("Image processing failed.");
  }

  const namePrefix =
    params.purpose === "product-draft" ? "product-draft" : "upload";

  let finalKey: string;
  try {
    finalKey = await uploadMediaToSupabase(
      processed.buffer,
      processed.contentType,
      processed.extension,
      namePrefix,
    );
  } catch (error) {
    await deleteStagingFile(params.storagePath);
    throw error instanceof Error ? error : new Error("Storage upload failed.");
  }

  const [insertedMedia] = await db
    .insert(medias)
    .values({ alt: params.originalFileName, key: finalKey })
    .returning({ id: medias.id });

  await deleteStagingFile(params.storagePath);

  return {
    mediaId: insertedMedia.id,
    key: finalKey,
    fileName: params.originalFileName,
  };
}
