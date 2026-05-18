"use server";

import db from "@/lib/supabase/db";
import createServerClient from "@/lib/supabase/server";
import { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { profiles } from "../../lib/supabase/schema";
import { AdminUserFormData } from "@/features/users/validations";
import { env } from "@/env.mjs";
import createClient from "@/lib/supabase/server";

export const getCurrentUser = async () => {
  const cookieStore = cookies();
  const supabase = createServerClient({ cookieStore });

  const userResponse = await supabase.auth.getUser();
  return userResponse.data.user;
};
export const getCurrentUserSession = async () => {
  const cookieStore = cookies();
  const supabase = createServerClient({ cookieStore });

  const userResponse = await supabase.auth.getSession();

  return userResponse.data.session;
};

/** Quick check from JWT metadata (safe optional chaining). */
export const isAdmin = (currentUser: User | null) =>
  Boolean(currentUser?.app_metadata?.isAdmin);

/** DB + metadata check for admin routes (profiles.is_admin fallback). */
export const checkIsAdmin = async (currentUser: User | null) => {
  if (!currentUser) return false;
  if (currentUser.app_metadata?.isAdmin) return true;

  try {
    const row = await db
      .select({ is_admin: profiles.is_admin })
      .from(profiles)
      .where(eq(profiles.id, currentUser.id))
      .limit(1);
    return row[0]?.is_admin === true;
  } catch {
    return false;
  }
};

export const getUser = async ({ userId }: { userId: string }) => {
  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  try {
    const { data, error } = await adminAuthClient.getUserById(userId);
    return data;
  } catch (err) {
    throw new Error("There is an error");
  }
};

export const listUsers = async ({
  page = 1,
  perPage = 10,
}: {
  page?: number;
  perPage?: number;
}) => {
  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  const {
    data: { users },
    error,
  } = await adminAuthClient.listUsers({
    page,
    perPage,
  });
  return users;
};

export const createUser = async ({
  email,
  name,
  password,
}: AdminUserFormData) => {
  const cookieStore = cookies();
  const adminAuthClient = createClient({ cookieStore, isAdmin: true }).auth
    .admin;

  try {
    const existedUser = await db.query.profiles.findFirst({
      where: eq(profiles.email, email),
    });
    if (existedUser) throw new Error(`User with email ${email} is existed.`);

    const res = await adminAuthClient.createUser({
      email,
      password,
      role: "ADMIN",
      user_metadata: { name },
    });

    return res;
  } catch (err) {
    throw new Error("Unexpected error occured.");
  }
};
