"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getRedirectFromSearchParams } from "@/lib/auth/redirect";
import { getURL } from "@/lib/utils";

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

    const next = encodeURIComponent(getRedirectFromSearchParams(searchParams));
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${getURL()}auth/callback?next=${next}`,
      },
    });

    if (error) {
      router.push("/sign-in");
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
