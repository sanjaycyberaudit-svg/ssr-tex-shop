import { nanoid } from "nanoid";
import { createServiceRoleClient } from "@/lib/supabase/service";
import { SUPABASE_MEDIA_BUCKET } from "@/lib/utils";

export async function ensureMediaBucket() {
  const supabase = createServiceRoleClient();
  const { data: buckets, error: listError } =
    await supabase.storage.listBuckets();
  if (listError) throw listError;

  if (buckets?.some((b) => b.name === SUPABASE_MEDIA_BUCKET)) return;

  const { error } = await supabase.storage.createBucket(SUPABASE_MEDIA_BUCKET, {
    public: true,
    fileSizeLimit: 15 * 1024 * 1024,
  });
  if (error && !error.message.includes("already exists")) throw error;
}

export async function uploadMediaToSupabase(
  buffer: Buffer,
  contentType: string,
  extension: string,
  namePrefix = "upload",
): Promise<string> {
  await ensureMediaBucket();

  const storagePath = `sakthi/${namePrefix}-${nanoid()}.${extension}`;
  const supabase = createServiceRoleClient();

  const { error } = await supabase.storage
    .from(SUPABASE_MEDIA_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });

  if (error) throw error;
  return storagePath;
}
