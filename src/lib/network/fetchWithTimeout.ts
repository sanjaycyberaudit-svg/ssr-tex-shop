const DEFAULT_TIMEOUT_MS = 12000;

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {},
) {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal, ...rest } = init;
  const controller = new AbortController();
  const externalAbort = () => controller.abort();
  signal?.addEventListener("abort", externalAbort, { once: true });
  const timeout = setTimeout(() => {
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`));
  }, timeoutMs);

  try {
    return await fetch(input, { ...rest, signal: controller.signal });
  } finally {
    signal?.removeEventListener("abort", externalAbort);
    clearTimeout(timeout);
  }
}
