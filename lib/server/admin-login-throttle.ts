import { clientAddress, createFailureThrottle } from "@/lib/server/failure-throttle";

/**
 * Brute-force protection for /api/admin/sessions.
 *
 * Wheels signs in with shared passwords, so one secret is the entire boundary
 * around the admin — unlimited guessing is the whole attack. This caps attempts
 * per client and locks the client out for a cooling-off window once the cap is
 * hit. See failure-throttle.ts for the state and deployment caveats.
 */
const throttle = createFailureThrottle({
  maxFailures: 5,
  windowMs: 15 * 60 * 1000,
  lockoutMs: 15 * 60 * 1000,
});

export const adminLoginClientKey = clientAddress;

export function checkAdminLoginAllowed(key: string, now?: number) {
  return throttle.check(key, now);
}

/** Returns true when this failure tripped the lockout. */
export function recordAdminLoginFailure(key: string, now?: number): boolean {
  return throttle.recordFailure(key, now);
}

export function clearAdminLoginFailures(key: string): void {
  throttle.clear(key);
}

export function resetAdminLoginThrottle(): void {
  throttle.reset();
}
