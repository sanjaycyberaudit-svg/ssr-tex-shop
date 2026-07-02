"use client";

import { Button } from "@/components/ui/button";
import { publicErrorMessage } from "@/lib/api/public-error";
import Link from "next/link";
import { useEffect } from "react";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-xl font-semibold">Admin could not load</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        {publicErrorMessage(
          error,
          "Something went wrong loading the admin panel. Try again or sign in again.",
        )}
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={() => reset()}>
          Try again
        </Button>
        <Button variant="outline" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">Store home</Link>
        </Button>
      </div>
    </div>
  );
}
