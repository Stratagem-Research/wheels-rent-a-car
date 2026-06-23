/**
 * Typed fetch client for the Wheels Public API.
 *
 * Mirrors the retry semantics of `lib/api/client.ts`:
 *   - 5xx and network errors retry with exponential backoff (300ms × 2^n).
 *   - 4xx errors fail fast (the request is malformed; retry won't help).
 *   - Aborts after 15s by default.
 *
 * Each response is Zod-validated. Unexpected shapes surface as
 * `WheelsValidationError` so we never silently consume drifted payloads.
 *
 * Error hierarchy:
 *   ApiError (base, like lib/api/client.ts's pattern)
 *     ├── VehicleUnavailableError (HTTP 409 with the documented body)
 *     ├── WheelsThrottledError    (HTTP 429 from Laravel's ThrottleRequests)
 *     ├── WheelsValidationError   (Zod parse failure on response)
 *     └── WheelsNetworkError      (network/abort failures after retries)
 */

import { z } from "zod";
import {
  AvailabilityResponseSchema,
  BookingLookupResponseSchema,
  BookingStatusResponseSchema,
  BookingRequestPayloadSchema,
  BookingSuccessResponseSchema,
  GenericErrorResponseSchema,
  SyncStatusRequestSchema,
  SyncStatusResponseSchema,
  VehicleAvailabilityResponseSchema,
  type AvailabilityResponse,
  type BookingLookupResponse,
  type BookingRequestPayload,
  type BookingStatusResponse,
  type BookingSuccessResponse,
  type SyncStatusRequest,
  type SyncStatusResponse,
  type VehicleAvailabilityResponse,
} from "./schemas";

/** Base error matching the convention in `lib/api/client.ts`. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly url: string,
    public readonly body: unknown,
    message?: string,
  ) {
    super(message ?? `Wheels API ${status} on ${url}`);
    this.name = "WheelsApiError";
  }
}

export class VehicleUnavailableError extends ApiError {
  constructor(url: string, body: unknown) {
    super(409, url, body, "Vehicle is not available for this period.");
    this.name = "VehicleUnavailableError";
  }
}

export class WheelsThrottledError extends ApiError {
  constructor(
    url: string,
    body: unknown,
    public readonly retryAfterSeconds?: number,
  ) {
    super(429, url, body, "Too many requests, backend throttled.");
    this.name = "WheelsThrottledError";
  }
}

export class WheelsValidationError extends ApiError {
  constructor(
    url: string,
    body: unknown,
    public readonly zodIssues: unknown,
  ) {
    super(0, url, body, "Wheels API response did not match the expected schema.");
    this.name = "WheelsValidationError";
  }
}

export class WheelsNetworkError extends ApiError {
  constructor(
    url: string,
    public override readonly cause: unknown,
  ) {
    super(0, url, undefined, "Wheels API network error.");
    this.name = "WheelsNetworkError";
  }
}

// ── Public surface ──────────────────────────────────────────────────────

export interface WheelsPublicClientOptions {
  /** Base URL ending without trailing slash. Defaults to env var or PDF test URL. */
  baseUrl?: string;
  /** Default 15000. */
  timeoutMs?: number;
  /** Default 3. Set to 1 to disable retries. */
  maxAttempts?: number;
  /** Injectable for tests / Node fetch override. */
  fetchImpl?: typeof fetch;
}

export interface AvailabilityQuery {
  startDateTime: string; // "YYYY-MM-DD HH:mm" (Beirut local) per toBackendDateTime
  endDateTime: string;
  vehicleTypeId?: number;
  gearbox?: string;
  fuelType?: string;
  seats?: number;
  includeBooked?: boolean;
}

export interface WheelsPublicClient {
  getAvailability: (query: AvailabilityQuery) => Promise<AvailabilityResponse>;
  getVehicleAvailability: (
    vehicleId: number,
    query: AvailabilityQuery,
  ) => Promise<VehicleAvailabilityResponse>;
  createBookingRequest: (payload: BookingRequestPayload) => Promise<BookingSuccessResponse>;
  getBookingByReferenceEmail: (reference: string, email: string) => Promise<BookingLookupResponse>;
  getBookingStatusByToken: (publicToken: string) => Promise<BookingStatusResponse>;
}

export interface WheelsInternalClient {
  syncBookingStatus: (reference: string, payload: SyncStatusRequest) => Promise<SyncStatusResponse>;
}

const DEFAULT_BASE_URL =
  process.env.NEXT_PUBLIC_WHEELS_API_BASE_URL ??
  "https://lucid-mclean.217-160-215-26.plesk.page/api/public";

export function createWheelsPublicClient(
  options: WheelsPublicClientOptions = {},
): WheelsPublicClient {
  const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async getAvailability(query) {
      const url = `${baseUrl}/availability?${buildAvailabilityQuery(query)}`;
      return requestJson(url, {
        method: "GET",
        schema: AvailabilityResponseSchema,
        fetchImpl,
        timeoutMs,
        maxAttempts,
      });
    },

    async getVehicleAvailability(vehicleId, query) {
      const url = `${baseUrl}/availability/${encodeURIComponent(String(vehicleId))}?${buildAvailabilityQuery(query)}`;
      return requestJson(url, {
        method: "GET",
        schema: VehicleAvailabilityResponseSchema,
        fetchImpl,
        timeoutMs,
        maxAttempts,
      });
    },

    async createBookingRequest(payload) {
      // Validate outgoing payload too, catches programming mistakes before
      // we waste a network call.
      const safe = BookingRequestPayloadSchema.parse(payload);
      const url = `${baseUrl}/booking-request`;
      return requestJson(url, {
        method: "POST",
        body: safe,
        schema: BookingSuccessResponseSchema,
        failureSchema: GenericErrorResponseSchema,
        fetchImpl,
        timeoutMs,
        maxAttempts,
      });
    },

    async getBookingByReferenceEmail(reference, email) {
      const url = `${baseUrl}/bookings/${encodeURIComponent(reference)}?email=${encodeURIComponent(email)}`;
      return requestJson(url, {
        method: "GET",
        schema: BookingLookupResponseSchema,
        failureSchema: GenericErrorResponseSchema,
        fetchImpl,
        timeoutMs,
        maxAttempts,
      });
    },

    async getBookingStatusByToken(publicToken) {
      const url = `${baseUrl}/booking-status/${encodeURIComponent(publicToken)}`;
      return requestJson(url, {
        method: "GET",
        schema: BookingStatusResponseSchema,
        failureSchema: GenericErrorResponseSchema,
        fetchImpl,
        timeoutMs,
        maxAttempts,
      });
    },
  };
}

export function createWheelsInternalClient(
  options: WheelsPublicClientOptions & { apiToken: string; baseUrl?: string },
): WheelsInternalClient {
  if (typeof window !== "undefined" && process.env.NODE_ENV !== "test") {
    throw new Error("createWheelsInternalClient is server-only and must not run in browser code.");
  }
  const baseUrl = (
    options.baseUrl ??
    process.env.WHEELS_INTERNAL_API_BASE_URL ??
    "https://lucid-mclean.217-160-215-26.plesk.page/api/v1"
  ).replace(/\/+$/, "");
  const timeoutMs = options.timeoutMs ?? 15_000;
  const maxAttempts = Math.max(1, options.maxAttempts ?? 3);
  const fetchImpl = options.fetchImpl ?? fetch;
  const apiToken = options.apiToken;

  return {
    async syncBookingStatus(reference, payload) {
      const safe = SyncStatusRequestSchema.parse(payload);
      const url = `${baseUrl}/bookings/${encodeURIComponent(reference)}/sync-status`;
      return requestJson(url, {
        method: "POST",
        body: safe,
        schema: SyncStatusResponseSchema,
        failureSchema: GenericErrorResponseSchema,
        fetchImpl: ((input: RequestInfo | URL, init?: RequestInit) =>
          fetchImpl(input, {
            ...init,
            headers: {
              ...(init?.headers ?? {}),
              Authorization: `Bearer ${apiToken}`,
            },
          })) as typeof fetch,
        timeoutMs,
        maxAttempts,
      });
    },
  };
}

// ── Default singleton ───────────────────────────────────────────────────

const defaultClient = createWheelsPublicClient();

export const getAvailability = defaultClient.getAvailability;
export const getVehicleAvailability = defaultClient.getVehicleAvailability;
export const createBookingRequest = defaultClient.createBookingRequest;
export const getBookingByReferenceEmail = defaultClient.getBookingByReferenceEmail;
export const getBookingStatusByToken = defaultClient.getBookingStatusByToken;

// ── Internals ───────────────────────────────────────────────────────────

function buildAvailabilityQuery(query: AvailabilityQuery): string {
  const params = new URLSearchParams();
  params.set("start_date_time", query.startDateTime);
  params.set("end_date_time", query.endDateTime);
  if (query.vehicleTypeId != null) params.set("vehicle_type_id", String(query.vehicleTypeId));
  if (query.gearbox) params.set("gearbox", query.gearbox);
  if (query.fuelType) params.set("fuel_type", query.fuelType);
  if (query.seats != null) params.set("seats", String(query.seats));
  if (query.includeBooked) params.set("include_booked", "1");
  return params.toString();
}

interface RequestJsonOptions<T> {
  method: "GET" | "POST";
  schema: z.ZodType<T>;
  /** Optional parser for backend error envelopes (sanitized 4xx / 429). */
  failureSchema?: z.ZodType<{ message: string }>;
  body?: unknown;
  fetchImpl: typeof fetch;
  timeoutMs: number;
  maxAttempts: number;
}

async function requestJson<T>(url: string, options: RequestJsonOptions<T>): Promise<T> {
  const { method, schema, failureSchema, body, fetchImpl, timeoutMs, maxAttempts } = options;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(url, {
        method,
        headers: {
          Accept: "application/json",
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });
      clearTimeout(timer);

      const rawText = await response.text();
      const parsedBody = rawText ? safeJson(rawText) : undefined;

      if (response.ok) {
        const result = schema.safeParse(parsedBody);
        if (!result.success) {
          throw new WheelsValidationError(url, parsedBody, result.error.issues);
        }
        return result.data;
      }

      if (response.status === 409) {
        // The documented "Vehicle is not available for this period." body —
        // but be defensive: if the body doesn't parse the failure schema we
        // still throw VehicleUnavailableError since 409 is unambiguous.
        if (failureSchema) failureSchema.safeParse(parsedBody);
        throw new VehicleUnavailableError(url, parsedBody);
      }
      if (response.status === 429) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "");
        throw new WheelsThrottledError(
          url,
          parsedBody,
          Number.isFinite(retryAfter) ? retryAfter : undefined,
        );
      }

      if (response.status >= 500 && attempt < maxAttempts) {
        lastError = new ApiError(response.status, url, parsedBody);
        await sleep(backoffMs(attempt));
        continue;
      }
      throw new ApiError(response.status, url, parsedBody);
    } catch (err) {
      clearTimeout(timer);

      // Already a typed error, propagate as-is.
      if (err instanceof ApiError) throw err;

      const isNetworkLike =
        err instanceof TypeError || (err instanceof DOMException && err.name === "AbortError");
      if (isNetworkLike && attempt < maxAttempts) {
        lastError = err;
        await sleep(backoffMs(attempt));
        continue;
      }
      throw new WheelsNetworkError(url, err);
    }
  }

  throw lastError instanceof ApiError ? lastError : new WheelsNetworkError(url, lastError);
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function backoffMs(attempt: number): number {
  return 2 ** (attempt - 1) * 300;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
