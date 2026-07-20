import { ZodError } from "zod";
import {
  WheelsApiError,
  VehicleUnavailableError,
  WheelsNetworkError,
  WheelsThrottledError,
  WheelsValidationError,
} from "@/lib/api/wheels-public";
import {
  IncompleteBookingDraftError,
  MissingBackendVehicleIdError,
} from "@/lib/api/wheels-public/adapters";

type SubmitErrorResponse = {
  status: number;
  message: string;
  reason?: string;
};

function wizardBodyMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const record = body as Record<string, unknown>;
  if (typeof record.message === "string" && record.message.trim()) return record.message.trim();
  if (typeof record.error === "string" && record.error.trim()) return record.error.trim();
  return undefined;
}

function unknownMessage(err: unknown): string {
  if (err instanceof Error && err.message.trim()) return err.message.trim();
  if (typeof err === "object" && err && "message" in err) {
    const message = (err as { message?: unknown }).message;
    if (typeof message === "string" && message.trim()) return message.trim();
  }
  return "Booking submission failed.";
}

/** Map any submit-path failure to a client-safe HTTP response. */
export function mapSubmitError(err: unknown): SubmitErrorResponse {
  if (err instanceof VehicleUnavailableError) {
    const body = err.body as { unavailable_reason?: string; message?: string } | null;
    return {
      status: 409,
      message: "Vehicle is not available for this period.",
      reason: body?.unavailable_reason ?? body?.message ?? undefined,
    };
  }
  if (err instanceof WheelsThrottledError) {
    return {
      status: 429,
      message: "Too many booking requests. Please wait a moment and try again.",
    };
  }
  if (err instanceof ZodError) {
    const first = err.issues[0];
    const path = first?.path?.length ? first.path.join(".") : "request";
    return {
      status: 400,
      message: first?.message ? `Invalid booking data (${path}): ${first.message}` : "Invalid booking data.",
    };
  }
  if (err instanceof IncompleteBookingDraftError || err instanceof MissingBackendVehicleIdError) {
    return { status: 400, message: err.message };
  }
  if (err instanceof WheelsValidationError) {
    return {
      status: 502,
      message: "Booking was created but the confirmation response was unexpected. Please contact support.",
    };
  }
  if (err instanceof WheelsNetworkError) {
    return {
      status: 502,
      message: "Could not reach the booking system. Check your connection and try again.",
    };
  }
  if (err instanceof WheelsApiError) {
    const fromBody = wizardBodyMessage(err.body);
    const status = err.status >= 400 && err.status < 600 ? err.status : 502;
    return {
      status: status === 409 ? 409 : status >= 500 ? 502 : 400,
      message: fromBody ?? err.message,
      reason: status === 409 ? fromBody : undefined,
    };
  }
  if (err instanceof Error) {
    if (err.message.includes("3 months")) return { status: 400, message: err.message };
    if (err.message === "Incomplete booking") return { status: 400, message: err.message };
    if (err.message === "Vehicle gone") {
      return { status: 409, message: err.message };
    }
    if (err.message.startsWith("No wizard mapping for vehicle")) {
      return { status: 400, message: err.message };
    }
  }

  if (process.env.NODE_ENV !== "production") {
    console.error("[booking-submit] unmapped error", err);
  }

  return { status: 502, message: unknownMessage(err) };
}
