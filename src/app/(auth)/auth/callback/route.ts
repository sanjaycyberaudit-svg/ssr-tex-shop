import {
  buildOAuthCallbackUrl,
  getPostAuthRedirectUrl,
} from "@/lib/auth/callback";
import { getRedirectFromSearchParams } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const { searchParams } = request.nextUrl;
  const next = getRedirectFromSearchParams(searchParams);
  const code = searchParams.get("code");
  const oauthError =
    searchParams.get("error_description") ?? searchParams.get("error");

  if (oauthError) {
    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set(
      "error",
      oauthError.replace(/\+/g, " ").replace(/%20/g, " "),
    );
    if (next !== "/") {
      signIn.searchParams.set("from", next);
    }
    return NextResponse.redirect(signIn);
  }

  if (code) {
    const supabase = createClient({ cookieStore });
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(getPostAuthRedirectUrl(request, next));
    }

    const signIn = new URL("/sign-in", request.url);
    signIn.searchParams.set(
      "error",
      error.message || "Google sign-in could not be completed.",
    );
    if (next !== "/") {
      signIn.searchParams.set("from", next);
    }
    return NextResponse.redirect(signIn);
  }

  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = createClient({ cookieStore });
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      return NextResponse.redirect(getPostAuthRedirectUrl(request, next));
    }
  }

  return NextResponse.redirect(new URL("/error", request.url));
}
