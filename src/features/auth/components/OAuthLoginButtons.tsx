"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { buildOAuthCallbackUrl } from "@/lib/auth/callback";
import { getRedirectFromSearchParams } from "@/lib/auth/redirect";

import { Icons } from "@/components/layouts/icons";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/lib/supabase/client";

function OAuthLoginButtons() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const signWithGoogle = async () => {
    setIsLoading(true);

    const next = getRedirectFromSearchParams(searchParams);
    const redirectTo = buildOAuthCallbackUrl(window.location.origin, next);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      router.push("/sign-in?error=Google+sign-in+failed");
      setIsLoading(false);
      return;
    }

    if (data?.url) {
      window.location.assign(data.url);
      return;
    }

    setIsLoading(false);
  };

  return (
    <Button
      type="button"
      variant="outline"
      className="w-full border-[#00542E]/25 hover:bg-[#00542E]/5"
      onClick={signWithGoogle}
      disabled={isLoading}
    >
      {isLoading ? (
        <Spinner className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      ) : (
        <Icons.google className="mr-2 h-4 w-4" />
      )}
      Continue with Google
    </Button>
  );
}

export default OAuthLoginButtons;
