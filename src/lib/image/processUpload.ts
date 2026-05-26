import sharp from "sharp";

/** Max size before processing (phone camera originals). */
export const UPLOAD_LIMIT_BYTES = 15 * 1024 * 1024;

/** Max width stored in S3 — detail/zoom; Next.js Image serves smaller sizes. */
export const MAX_IMAGE_WIDTH = 2000;

export const WEBP_QUALITY = 82;

export type ProcessedImage = {
  buffer: Buffer;
  contentType: string;
  extension: string;
};

/**
 * Normalize any uploaded image (JPEG, PNG, WebP, HEIC, static GIF, etc.)
 * for storage and storefront delivery.
 */
export async function processUploadedImage(
  file: File,
): Promise<ProcessedImage> {
  if (file.size > UPLOAD_LIMIT_BYTES) {
    throw new Error("Each image must be 15 MB or smaller.");
  }

  const input = Buffer.from(await file.arrayBuffer());
  if (input.length === 0) {
    throw new Error("Empty file.");
  }

  let metadata: sharp.Metadata;
  try {
    metadata = await sharp(input, { animated: true }).metadata();
  } catch {
    throw new Error("Only image files are allowed.");
  }

  if (!metadata.width || !metadata.height) {
    throw new Error("Could not read image dimensions.");
  }

  if (metadata.format === "svg") {
    throw new Error("SVG uploads are not supported. Use JPEG or PNG.");
  }

  const isAnimatedGif = metadata.format === "gif" && (metadata.pages ?? 1) > 1;

  if (isAnimatedGif) {
    return {
      buffer: input,
      contentType: "image/gif",
      extension: "gif",
    };
  }

  const buffer = await sharp(input)
    .rotate()
    .resize({
      width: MAX_IMAGE_WIDTH,
      withoutEnlargement: true,
    })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();

  return {
    buffer,
    contentType: "image/webp",
    extension: "webp",
  };
}
