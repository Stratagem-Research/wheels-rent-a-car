/**
 * Typed fetch wrapper for the Wheels API.
 *
 * - Retries 2x with exponential backoff for any booking-related endpoint
 *   (per 00_global.md §19). Other endpoints fail fast.
 * - Throws `ApiError` (typed) with status, body, and url on non-2xx.
 * - Always JSON in/out; multipart is a separate helper.
 *
 * The mock layer (MSW) intercepts the same paths in dev. To target a real
 * backend, set NEXT_PUBLIC_API_BASE_URL — the client prefixes that to every
 * request path. Default is "" so paths are same-origin and MSW catches them.
 */

const RETRYABLE_ENDPOINTS = ["/api/booking/", "/api/account/bookings", "/api/auth/"];

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `API ${status} on ${url}`);
    this.name = "ApiError";
  }
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

function shouldRetry(path: string): boolean {
  return RETRYABLE_ENDPOINTS.some((p) => path.startsWith(p));
}

async function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export interface ApiRequestInit extends Omit<RequestInit, "body"> {
  /** Parsed and JSON-serialised automatically. */
  body?: unknown;
  /** Override default retry behaviour. */
  retry?: boolean;
  /** Abort after N ms; default 15s. */
  timeoutMs?: number;
}

/**
 * Generic JSON-in/JSON-out fetch. Throws `ApiError` on non-2xx.
 *
 * Usage:
 *   const v = await apiFetch<Vehicle>(endpoints.vehicleBySlug("yaris"));
 *   const r = await apiFetch<QuoteResponse>(endpoints.bookingQuote, {
 *     method: "POST", body: { draft }
 *   });
 */
export async function apiFetch<T>(path: string, init: ApiRequestInit = {}): Promise<T> {
  const { body, retry, timeoutMs = 15_000, headers, ...rest } = init;
  const url = `${API_BASE_URL}${path}`;
  const shouldRetryThis = retry ?? shouldRetry(path);

  const maxAttempts = shouldRetryThis ? 3 : 1;
  let attempt = 0;
  let lastError: unknown;

  while (attempt < maxAttempts) {
    attempt += 1;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...rest,
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: "same-origin",
      });
      clearTimeout(timer);

      // 5xx is retryable; 4xx is not (request is malformed).
      if (!res.ok) {
        const parsed = await res.json().catch(() => undefined);
        const err = new ApiError(res.status, url, parsed);
        if (res.status >= 500 && attempt < maxAttempts) {
          lastError = err;
          await sleep(2 ** (attempt - 1) * 300);
          continue;
        }
        throw err;
      }

      if (res.status === 204) return undefined as T;
      const json = (await res.json()) as T;
      return json;
    } catch (err) {
      clearTimeout(timer);
      // AbortError (timeout) and network errors retry on retryable endpoints.
      const isNetworkLike =
        err instanceof TypeError || (err instanceof DOMException && err.name === "AbortError");
      if (isNetworkLike && attempt < maxAttempts) {
        lastError = err;
        await sleep(2 ** (attempt - 1) * 300);
        continue;
      }
      throw err;
    }
  }

  throw lastError ?? new Error(`Failed after ${maxAttempts} attempts: ${url}`);
}

/** Convenience helpers. */
export const api = {
  get: <T>(path: string, init?: Omit<ApiRequestInit, "method" | "body">) =>
    apiFetch<T>(path, { ...init, method: "GET" }),
  post: <T>(path: string, body?: unknown, init?: Omit<ApiRequestInit, "method">) =>
    apiFetch<T>(path, { ...init, method: "POST", body }),
  patch: <T>(path: string, body?: unknown, init?: Omit<ApiRequestInit, "method">) =>
    apiFetch<T>(path, { ...init, method: "PATCH", body }),
  delete: <T>(path: string, init?: Omit<ApiRequestInit, "method" | "body">) =>
    apiFetch<T>(path, { ...init, method: "DELETE" }),
};
