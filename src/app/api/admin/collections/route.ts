import { publicErrorMessage } from "@/lib/api/public-error";
import { invalidateStorefrontCache } from "@/lib/cache/invalidate-storefront";
import { getSessionUser, isAdminUser } from "@/lib/auth/admin";
import db from "@/lib/supabase/db";
import { collections } from "@/lib/supabase/schema";
import { slugify } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

function normalizeCollectionSlug(slug: string, label: string) {
  const fromLabel = slugify(label);
  const fromSlug = slugify(slug);
  const slugNeedsFix =
    /\s/.test(slug) || slug !== slug.toLowerCase() || slug !== fromSlug;
  if (slugNeedsFix) return fromLabel || fromSlug;
  return fromSlug || fromLabel;
}

async function revalidateCollectionPages() {
  revalidatePath("/collections");
  revalidatePath("/collections", "layout");
  revalidatePath("/shop");
  revalidatePath("/admin/collections");
  await invalidateStorefrontCache();
}

const collectionPayloadSchema = z.object({
  slug: z.string().trim().min(1),
  label: z.string().trim().min(1),
  title: z.string().trim().min(1),
  description: z.string().trim().min(1),
  featuredImageId: z.string().trim().min(1),
});

async function ensureAdmin() {
  const user = await getSessionUser();
  const admin = await isAdminUser(user);
  if (!user || !admin) return null;
  return user;
}

export async function POST(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = collectionPayloadSchema.safeParse(payload);
  if (!parsed.success) {
    const parseError = parsed as z.SafeParseError<
      z.infer<typeof collectionPayloadSchema>
    >;
    return NextResponse.json(
      {
        message: "Invalid collection payload",
        error: parseError.error.flatten(),
      },
      { status: 400 },
    );
  }

  try {
    const insertValues = {
      slug: normalizeCollectionSlug(parsed.data.slug, parsed.data.label),
      label: parsed.data.label,
      title: parsed.data.title,
      description: parsed.data.description,
      featuredImageId: parsed.data.featuredImageId,
    };
    await db.insert(collections).values(insertValues);
    await revalidateCollectionPages();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/collections] POST failed:", error);
    return NextResponse.json(
      {
        message: publicErrorMessage(error, "Failed to create collection."),
      },
      { status: 400 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const updatePayloadSchema = z.object({
    id: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    label: z.string().trim().min(1),
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    featuredImageId: z.string().trim().min(1),
  });
  const parsed = updatePayloadSchema.safeParse(payload);

  if (!parsed.success) {
    const parseError = parsed as z.SafeParseError<
      z.infer<typeof updatePayloadSchema>
    >;
    return NextResponse.json(
      {
        message: "Invalid collection payload",
        error: parseError.error.flatten(),
      },
      { status: 400 },
    );
  }

  const id = parsed.data.id;
  const setValues = {
    slug: normalizeCollectionSlug(parsed.data.slug, parsed.data.label),
    label: parsed.data.label,
    title: parsed.data.title,
    description: parsed.data.description,
    featuredImageId: parsed.data.featuredImageId,
  };

  try {
    const rows = await db
      .update(collections)
      .set(setValues)
      .where(eq(collections.id, id))
      .returning({ id: collections.id });

    if (rows.length < 1) {
      return NextResponse.json(
        { message: "Collection was not updated. Please retry." },
        { status: 404 },
      );
    }

    await revalidateCollectionPages();
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[admin/collections] PUT failed:", error);
    return NextResponse.json(
      {
        message: publicErrorMessage(error, "Failed to update collection."),
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const user = await ensureAdmin();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json().catch(() => null);
  const parsed = z.object({ id: z.string().trim().min(1) }).safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Collection id is required." },
      { status: 400 },
    );
  }

  try {
    const rows = await db
      .delete(collections)
      .where(eq(collections.id, parsed.data.id))
      .returning({ id: collections.id });

    if (rows.length < 1) {
      return NextResponse.json(
        { message: "Collection not found." },
        { status: 404 },
      );
    }

    await revalidateCollectionPages();
    return NextResponse.json({ ok: true, deletedId: parsed.data.id });
  } catch (error) {
    console.error("[admin/collections] DELETE failed:", error);
    return NextResponse.json(
      {
        message: publicErrorMessage(error, "Failed to delete collection."),
      },
      { status: 400 },
    );
  }
}
