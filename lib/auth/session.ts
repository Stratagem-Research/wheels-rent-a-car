/**
 * Client session cache for Supabase auth.
 *
 * Supabase SSR sets the real JWT in `sb-*-auth-token` (httpOnly). API routes
 * also set `wheels.session` (httpOnly user id). The client keeps a mirrored copy:
 *   - localStorage — rich `User` object for `useSession` / header UI.
 *   - document.cookie — non-httpOnly user id so `proxy.ts` can gate `/account/*`.
 * Kept in sync via `writeSession` / `clearSession`; validated on mount via `/api/auth/me`.
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
