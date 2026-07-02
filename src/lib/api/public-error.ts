const isProduction = process.env.NODE_ENV === "production";

/** Safe client-facing message — hides internal details in production. */
export function publicErrorMessage(
  error: unknown,
  fallback: string,
): string {
  if (!isProduction && error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}
