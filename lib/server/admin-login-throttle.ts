import { clientAddress, createFailureThrottle } from "@/lib/server/failure-throttle";

/**
 * Brute-force protection for /api/admin/sessions.
 *
 * Wheels signs in with shared passwords, so one secret is the entire boundary
 * around the admin — unlimited guessing is the whole attack. Failures are
 * counted twice:
 *   - per client address, which only slows one source
 *   - per username, which holds from any address. Five misses on `admin` lock
 *     `admin` for 15 minutes even when each guess sends a new X-Forwarded-For.
 *
 * See failure-throttle.ts for the in-process state and deployment caveats.
 */
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;

const perClient = createFailureThrottle({
  maxFailures: 5,
  windowMs: WINDOW_MS,
  lockoutMs: LOCKOUT_MS,
});

const perUsername = createFailureThrottle({
  maxFailures: 5,
  windowMs: WINDOW_MS,
  lockoutMs: LOCKOUT_MS,
});

export const adminLoginClientKey = clientAddress;

/** Same normalization as `authenticateAdminCredentials`, so `admin` and ` admin ` share one lock. */
export function adminLoginUsernameKey(username: string): string {
  return username.trim();
}

export function checkAdminLoginAllowed(key: string, now?: number) {
  return perClient.check(key, now);
}

export function checkAdminUsernameAllowed(username: string, now?: number) {
  const key = adminLoginUsernameKey(username);
  if (!key) return { allowed: true } as const;
  return perUsername.check(key, now);
}

/** Returns true when this failure tripped the lockout. */
export function recordAdminLoginFailure(key: string, now?: number): boolean {
  return perClient.recordFailure(key, now);
}

/** Returns true when this failure tripped the username lockout. */
export function recordAdminUsernameFailure(username: string, now?: number): boolean {
  const key = adminLoginUsernameKey(username);
  if (!key) return false;
  return perUsername.recordFailure(key, now);
}

export function clearAdminLoginFailures(key: string): void {
  perClient.clear(key);
}

export function clearAdminUsernameFailures(username: string): void {
  const key = adminLoginUsernameKey(username);
  if (key) perUsername.clear(key);
}

export function resetAdminLoginThrottle(): void {
  perClient.reset();
  perUsername.reset();
}
