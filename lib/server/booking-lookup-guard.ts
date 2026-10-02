import { NextResponse } from "next/server";
import { ApiError } from "@/lib/api/wheels-public/client";
import { clientAddress, createFailureThrottle, type ThrottleCheck } from "@/lib/server/failure-throttle";

/**
 * Brute-force protection for the routes that treat "booking ref + matching
 * email" as the credential: lookup, cancel-preview, cancel and change. A hit
 * returns the driver's details, signed links to licence scans, and lets the
 * caller cancel or change the booking.
 *
 * Failed guesses are counted along three independent dimensions:
 *   - per ref:   stops someone brute-forcing the email for a known ref
 *   - per email: stops someone brute-forcing the ~1M-value ref suffix for a
 *                known customer email (the realistic attack)
 *   - per IP:    slows one source spraying random pairs
 * The ref and email limits don't depend on the client address, so they still
 * hold when `x-forwarded-for` can be spoofed to dodge the IP limit.
 *
 * Trade-off: an attacker can lock a victim out of this self-service lookup for
 * a while by guessing wrong against their ref or email. That only delays the
 * lookup — it never touches the booking itself.
 */
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

const perRef = createFailureThrottle({ maxFailures: 8, windowMs: WINDOW_MS, lockoutMs: LOCKOUT_MS });
const perEmail = createFailureThrottle({ maxFailures: 8, windowMs: WINDOW_MS, lockoutMs: LOCKOUT_MS });
const perIp = createFailureThrottle({ maxFailures: 15, windowMs: WINDOW_MS, lockoutMs: LOCKOUT_MS });

export type BookingLookupGuard = {
  /** A ready-made 429 when any dimension is locked out; null to proceed. */
  blocked: NextResponse | null;
  /** The ref/email pair did not match a booking — count it. */
  fail(): void;
  /** The pair matched — forgive earlier typos for this ref and email. */
  succeed(): void;
};

function normalizeRef(ref: unknown): string | null {
  return typeof ref === "string" && ref.trim() ? ref.trim().toUpperCase() : null;
}

function normalizeEmail(email: unknown): string | null {
  return typeof email === "string" && email.trim() ? email.trim().toLowerCase() : null;
}

export function guardBookingLookup(
  request: Request,
  credentials: { ref?: unknown; email?: unknown },
): BookingLookupGuard {
  const ip = clientAddress(request);
  const ref = normalizeRef(credentials.ref);
  const email = normalizeEmail(credentials.email);

  const checks: ThrottleCheck[] = [perIp.check(ip)];
  if (ref) checks.push(perRef.check(ref));
  if (email) checks.push(perEmail.check(email));

  const locked = checks.filter((c): c is Extract<ThrottleCheck, { allowed: false }> => !c.allowed);
  const blocked =
    locked.length > 0
      ? NextResponse.json(
          { message: "Too many attempts. Please try again later." },
          {
            status: 429,
            headers: { "Retry-After": String(Math.max(...locked.map((c) => c.retryAfterSeconds))) },
          },
        )
      : null;

  return {
    blocked,
    fail() {
      perIp.recordFailure(ip);
      if (ref) perRef.recordFailure(ref);
      if (email) perEmail.recordFailure(email);
    },
    succeed() {
      // The IP counter is deliberately left alone: otherwise one source could
      // reset its own count by interleaving a lookup of a booking it owns.
      if (ref) perRef.clear(ref);
      if (email) perEmail.clear(email);
    },
  };
}

/**
 * Whether an error means "that ref/email pair doesn't match".
 *
 * `handleBookingLookup` has no miss type of its own. A wrong ref or email
 * falls through to `getBookingByReferenceEmail`, which throws `ApiError` with
 * the backend's 4xx status. Network failures and unparseable responses are
 * `ApiError` subclasses with status 0 (`WheelsNetworkError`,
 * `WheelsValidationError`); a backend 429 is `WheelsThrottledError`. None of
 * those are guesses, and neither is a plain `Error` from our own code.
 */
export function isLookupMiss(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false;
  if (error.status === 429) return false;
  return error.status >= 400 && error.status < 500;
}

/** Test seam — the module-level state would otherwise leak between cases. */
export function resetBookingLookupGuard(): void {
  perRef.reset();
  perEmail.reset();
  perIp.reset();
}
