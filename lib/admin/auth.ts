"use client";

/**
 * Admin authentication — server-session based.
 *
 * Login calls /api/admin/sessions and receives HttpOnly cookies.
 * Role checks happen on server-side API routes.
 *
 * The browser keeps only non-sensitive session metadata for UI state.
 */

export type AdminIdentity = { username: string; role: "content-editor" | "ops-admin" };

const SESSION_KEY = "wheels.admin.user";

function readCachedIdentity(): AdminIdentity | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminIdentity;
  } catch {
    return null;
  }
}

function writeCachedIdentity(identity: AdminIdentity | null): void {
  if (typeof window === "undefined") return;
  if (!identity) {
    window.sessionStorage.removeItem(SESSION_KEY);
    return;
  }
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(identity));
}

export async function signIn(
  username: string,
  password: string,
): Promise<{ ok: true; user: AdminIdentity } | { ok: false; message: string }> {
  const res = await fetch("/api/admin/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const data = (await res.json().catch(() => ({}))) as { message?: string; user?: AdminIdentity };
  if (!res.ok || !data.user) {
    return { ok: false, message: data.message ?? "Invalid username or password." };
  }
  writeCachedIdentity(data.user);
  return { ok: true, user: data.user };
}

export async function signOut(): Promise<void> {
  const csrf = getAdminCsrfToken();
  await fetch("/api/admin/sessions", {
    method: "DELETE",
    headers: csrf ? { "x-admin-csrf": csrf } : undefined,
  }).catch(() => undefined);
  writeCachedIdentity(null);
}

export async function getAdminSession(): Promise<AdminIdentity | null> {
  const res = await fetch("/api/admin/sessions", { cache: "no-store" });
  if (!res.ok) {
    writeCachedIdentity(null);
    return null;
  }
  const data = (await res.json()) as { user?: AdminIdentity };
  if (!data.user) return null;
  writeCachedIdentity(data.user);
  return data.user;
}

export function getCachedAdminSession(): AdminIdentity | null {
  return readCachedIdentity();
}

function getAdminCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1] ?? "");
}
