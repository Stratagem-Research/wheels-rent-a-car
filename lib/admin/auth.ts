"use client";

/**
 * Admin authentication — demo-grade client-side gate.
 *
 * Phase 12 ships a hardcoded `admin / admin123` credential for the client
 * demo. The gate is purely client-side (sessionStorage) so the admin
 * dashboard can be walked through in a browser without a backend.
 *
 * REPLACE BEFORE PRODUCTION:
 *   - Move the credential check to a real auth endpoint.
 *   - Issue an HttpOnly session cookie + server-side session lookup.
 *   - Add CSRF protection on every admin write.
 *   - Add rate-limiting + audit logging.
 *
 * The `/admin` route group also gets `X-Robots-Tag: noindex` from
 * middleware.ts so it never leaks into search engines.
 */

export const ADMIN_USERNAME = "admin";
export const ADMIN_PASSWORD = "admin123";

const SESSION_KEY = "wheels.admin.session";
const SESSION_VALUE = "ok";

/** Validate credentials against the staging defaults. */
export function signIn(username: string, password: string): boolean {
  const u = username.trim();
  const p = password;
  if (u !== ADMIN_USERNAME || p !== ADMIN_PASSWORD) return false;
  if (typeof window !== "undefined") {
    sessionStorage.setItem(SESSION_KEY, SESSION_VALUE);
  }
  return true;
}

/** Clear the session (sign out). */
export function signOut(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

/** Whether an admin session is currently active. */
export function isSignedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_KEY) === SESSION_VALUE;
}
