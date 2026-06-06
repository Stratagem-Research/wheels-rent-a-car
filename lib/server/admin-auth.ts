import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export type AdminRole = "content-editor" | "ops-admin";

export type AdminSession = {
  username: string;
  role: AdminRole;
  exp: number;
};

const ADMIN_SESSION_COOKIE = "wheels.admin.session";
const ADMIN_CSRF_COOKIE = "wheels.admin.csrf";
const ONE_DAY_SECONDS = 60 * 60 * 24;

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`${name} is required for admin auth.`);
  return value;
}

function getConfig() {
  const password = getEnv("ADMIN_PASSWORD", "admin123");
  const secret = getEnv("ADMIN_SESSION_SECRET", "change-me-in-production");
  const contentEditors = (process.env.ADMIN_CONTENT_EDITOR_USERNAMES ?? "editor")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const opsAdmins = (process.env.ADMIN_OPS_ADMIN_USERNAMES ?? "admin")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return { password, secret, contentEditors, opsAdmins };
}

function b64urlEncode(raw: string): string {
  return Buffer.from(raw, "utf8").toString("base64url");
}

function b64urlDecode(raw: string): string {
  return Buffer.from(raw, "base64url").toString("utf8");
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

function parseCookie(cookieHeader: string | null, key: string): string | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";").map((part) => part.trim());
  for (const pair of pairs) {
    if (!pair.startsWith(`${key}=`)) continue;
    return decodeURIComponent(pair.slice(key.length + 1));
  }
  return null;
}

export function authenticateAdminCredentials(
  username: string,
  password: string,
): { username: string; role: AdminRole } | null {
  const cfg = getConfig();
  const normalized = username.trim();
  if (password !== cfg.password) return null;
  if (cfg.opsAdmins.includes(normalized)) return { username: normalized, role: "ops-admin" };
  if (cfg.contentEditors.includes(normalized)) {
    return { username: normalized, role: "content-editor" };
  }
  return null;
}

export function createAdminSessionToken(username: string, role: AdminRole): string {
  const cfg = getConfig();
  const payloadObj: AdminSession = {
    username,
    role,
    exp: Math.floor(Date.now() / 1000) + ONE_DAY_SECONDS,
  };
  const payload = b64urlEncode(JSON.stringify(payloadObj));
  const signature = sign(payload, cfg.secret);
  return `${payload}.${signature}`;
}

export function readAdminSession(request: Request): AdminSession | null {
  const cfg = getConfig();
  const token = parseCookie(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".", 2);
  if (!payload || !signature) return null;
  const expected = sign(payload, cfg.secret);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const decoded = JSON.parse(b64urlDecode(payload)) as AdminSession;
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    if (!decoded.username || !decoded.role) return null;
    return decoded;
  } catch {
    return null;
  }
}

export function getAdminCsrfCookie(request: Request): string | null {
  return parseCookie(request.headers.get("cookie"), ADMIN_CSRF_COOKIE);
}

export function assertAdminCsrf(request: Request): boolean {
  const cookieToken = getAdminCsrfCookie(request);
  const headerToken = request.headers.get("x-admin-csrf");
  return Boolean(cookieToken && headerToken && cookieToken === headerToken);
}

export function setAdminAuthCookies(
  response: NextResponse,
  sessionToken: string,
  csrfToken: string,
): NextResponse {
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(ADMIN_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ONE_DAY_SECONDS,
  });
  response.cookies.set(ADMIN_CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ONE_DAY_SECONDS,
  });
  return response;
}

export function clearAdminAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  response.cookies.delete(ADMIN_CSRF_COOKIE);
  return response;
}
