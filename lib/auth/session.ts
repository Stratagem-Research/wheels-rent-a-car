/**
 * Session model — Phase 1 mock layer.
 *
 * In production, the real backend will issue an httpOnly Secure SameSite=Lax
 * cookie that the client never touches directly. Server middleware reads it
 * and gates /account/*; pages call /api/auth/me to hydrate the user object.
 *
 * For Phase 1 mocks (no backend, no httpOnly), we keep TWO copies:
 *   - `wheels.session` in localStorage — rich user object for `useSession`.
 *   - `wheels.session` as a (non-httpOnly) cookie — readable by Next.js
 *     middleware for the /account/* redirect rule.
 * The two are kept in sync via `writeSession` / `clearSession`.
 */

import type { User } from "@/types/domain";

export const SESSION_STORAGE_KEY = "wheels.session";
export const SESSION_COOKIE_NAME = "wheels.session";

export interface Session {
  user: User;
}

export function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    // Mirror as a cookie so the Next.js middleware can see it.
    document.cookie = `${SESSION_COOKIE_NAME}=${session.user.id}; path=/; max-age=${60 * 60 * 24 * 14}; samesite=lax`;
    window.dispatchEvent(new CustomEvent("wheels:session"));
  } catch {
    // ignore (private modes, quota errors)
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
    document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
    window.dispatchEvent(new CustomEvent("wheels:session"));
  } catch {
    // ignore
  }
}
