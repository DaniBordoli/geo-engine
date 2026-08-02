// Retry con backoff exponencial + jitter. Respeta Retry-After si viene.
// Reintenta solo errores transitorios (429 / 5xx / red); los 4xx "duros" fallan
// rápido para no gastar en algo que no se va a arreglar solo.

export type RetryOptions = {
  retries?: number;
  baseMs?: number;
  maxMs?: number;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function statusOf(err: unknown): number | undefined {
  return typeof err === "object" && err !== null && "status" in err
    ? (err as { status?: number }).status
    : undefined;
}

function isRetryable(err: unknown): boolean {
  const status = statusOf(err);
  if (status === undefined) return true; // error de red / sin status → reintentable
  if (status === 429) return true;
  return status >= 500 && status < 600;
}

// Retry-After (segundos) desde headers del SDK, si está.
function retryAfterMs(err: unknown): number | undefined {
  if (typeof err !== "object" || err === null || !("headers" in err)) return undefined;
  const headers = (err as { headers?: unknown }).headers;
  let raw: string | null | undefined;
  if (headers instanceof Headers) raw = headers.get("retry-after");
  else if (typeof headers === "object" && headers !== null) {
    raw = (headers as Record<string, string>)["retry-after"];
  }
  const secs = raw ? Number(raw) : NaN;
  return Number.isFinite(secs) ? secs * 1000 : undefined;
}

export async function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions = {}): Promise<T> {
  const retries = opts.retries ?? 3;
  const baseMs = opts.baseMs ?? 500;
  const maxMs = opts.maxMs ?? 8000;

  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt === retries || !isRetryable(err)) throw err;
      const hinted = retryAfterMs(err);
      const exp = Math.min(maxMs, baseMs * 2 ** attempt);
      const delay = hinted ?? Math.floor(Math.random() * exp); // full jitter
      await sleep(delay);
    }
  }
  throw lastErr;
}
