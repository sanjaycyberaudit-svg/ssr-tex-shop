import db from "@/lib/supabase/db";
import createServerClient from "@/lib/supabase/server";
import { profiles } from "@/lib/supabase/schema";
import type { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

/** Read session in Server Components / layouts (not a server action). */
export async function getSessionUser(): Promise<User | null> {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient({ cookieStore });
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.error("[auth] getUser:", error.message);
      return null;
    }
    return data.user ?? null;
  } catch (err) {
    console.error("[auth] getSessionUser failed:", err);
    return null;
  }
}

export function isAdminFromMetadata(user: User | null): boolean {
  return Boolean(user?.app_metadata?.isAdmin);
}

export async function isAdminUser(user: User | null): Promise<boolean> {
  if (!user) return false;
  if (isAdminFromMetadata(user)) return true;

  try {
    const row = await db
      .select({ is_admin: profiles.is_admin })
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1);
    return row[0]?.is_admin === true;
  } catch (err) {
    console.error("[auth] isAdminUser DB check failed:", err);
    return isAdminFromMetadata(user);
  }
}
