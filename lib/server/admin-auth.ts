import { createHmac, randomUUID, scryptSync, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export type AdminRole = "content-editor" | "ops-admin";

export type AdminSession = {
  /** Session id — the key of the revocable server-side record. */
  sid: string;
  username: string;
  role: AdminRole;
  exp: number;
};

const ADMIN_SESSION_COOKIE = "wheels.admin.session";
const ADMIN_CSRF_COOKIE = "wheels.admin.csrf";
/** Short on purpose: a stolen cookie is useful for hours, not days. */
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

function getEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) throw new Error(`${name} is required for admin auth.`);
  return value;
}

/** HMAC-SHA256 keys shorter than this are guessable offline from one cookie. */
export const MIN_SESSION_SECRET_LENGTH = 32;

/** The signing secret, or an error if it is missing or too short to trust. */
function requireSessionSecret(): string {
  const secret = getEnv("ADMIN_SESSION_SECRET");
  if (secret.length < MIN_SESSION_SECRET_LENGTH) {
    throw new Error(
      `ADMIN_SESSION_SECRET must be at least ${MIN_SESSION_SECRET_LENGTH} characters. Generate one with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
    );
  }
  return secret;
}

function getConfig() {
  const contentEditors = (process.env.ADMIN_CONTENT_EDITOR_USERNAMES ?? "editor")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const opsAdmins = (process.env.ADMIN_OPS_ADMIN_USERNAMES ?? "admin")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return { secret: requireSessionSecret(), contentEditors, opsAdmins };
}

function getSessionSecret(): string | null {
  try {
    return requireSessionSecret();
  } catch {
    // Fail closed: with no usable secret no cookie can be verified. Sign-in
    // surfaces the reason (it throws), so this stays quiet.
    return null;
  }
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

/**
 * `scrypt:<N>:<r>:<p>:<saltHex>:<keyHex>` — produced by
 * scripts/hash-admin-password.mjs. Separators are colons because Next's .env
 * loader expands `$NAME` and would mangle a `$`-delimited value into garbage.
 * The older `scrypt$…` form is still accepted for values set where nothing
 * expands them (e.g. Plesk's environment variables).
 */
function scryptSeparator(stored: string): ":" | "$" | null {
  if (stored.startsWith("scrypt:")) return ":";
  if (stored.startsWith("scrypt$")) return "$";
  return null;
}

export function verifyAdminPasswordHash(password: string, stored: string): boolean {
  const separator = scryptSeparator(stored);
  if (!separator) return false;
  const parts = stored.slice("scrypt".length + 1).split(separator);
  if (parts.length !== 5) return false;
  const [nRaw, rRaw, pRaw, saltHex, keyHex] = parts as [string, string, string, string, string];
  const N = Number(nRaw);
  const r = Number(rRaw);
  const p = Number(pRaw);
  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) return false;
  const expected = Buffer.from(keyHex, "hex");
  if (expected.length === 0) return false;
  try {
    const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length, {
      N,
      r,
      p,
      // scrypt's default maxmem (32MB) is below what N=16384,r=8 needs.
      maxmem: 256 * 1024 * 1024,
    });
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/**
 * Where a role's password lives. Each role has its own secret, stored only as a
 * scrypt hash so a leaked .env or server backup doesn't expose the live
 * password. There is no plaintext variable.
 */
type PasswordSource = { hashVar: string };

const OPS_PASSWORD: PasswordSource = { hashVar: "ADMIN_PASSWORD_HASH" };
const EDITOR_PASSWORD: PasswordSource = { hashVar: "ADMIN_EDITOR_PASSWORD_HASH" };

/**
 * `required` makes a missing hash throw (a misconfigured deployment should be
 * loud, not a silent "invalid password"); without it, a missing hash just never
 * matches.
 */
function passwordMatches(password: string, source: PasswordSource, required: boolean): boolean {
  const hash = required ? getEnv(source.hashVar).trim() : process.env[source.hashVar]?.trim();
  if (!hash) return false;
  if (!scryptSeparator(hash)) {
    // Fail closed, but say why — a mangled hash otherwise just looks like a
    // wrong password. The usual cause is a `$` in a .env value being expanded.
    console.warn(
      `[admin-auth] ${source.hashVar} is set but isn't a valid hash (it should start with "scrypt:"). Regenerate it with \`node scripts/hash-admin-password.mjs\`.`,
    );
    return false;
  }
  return verifyAdminPasswordHash(password, hash);
}

/**
 * The role comes from the username, but only a password that belongs to that
 * role unlocks it — typing the ops username with the editor password fails.
 *
 * Editors need `ADMIN_EDITOR_PASSWORD_HASH`. With none configured, editor
 * sign-in is off; it never falls back to the ops password, since that would let
 * every editor type the ops username and take ops access.
 */
export function authenticateAdminCredentials(
  username: string,
  password: string,
): { username: string; role: AdminRole } | null {
  const cfg = getConfig();
  const normalized = username.trim();

  if (cfg.opsAdmins.includes(normalized)) {
    return passwordMatches(password, OPS_PASSWORD, true)
      ? { username: normalized, role: "ops-admin" }
      : null;
  }

  if (cfg.contentEditors.includes(normalized)) {
    if (!passwordMatches(password, EDITOR_PASSWORD, false)) return null;
    // An editor password that is also the ops password would hand editors ops
    // access, undoing the separation — refuse rather than quietly allow it.
    if (passwordMatches(password, OPS_PASSWORD, false)) {
      console.warn(
        "[admin-auth] The editor password is the same as the ops password, so editor sign-in is refused. Set a different ADMIN_EDITOR_PASSWORD_HASH.",
      );
      return null;
    }
    return { username: normalized, role: "content-editor" };
  }

  // Unknown username: still spend a password check so the response time doesn't
  // reveal which usernames exist.
  passwordMatches(password, OPS_PASSWORD, true);
  return null;
}

/**
 * The role a username holds *now*, per the current env config. Sessions are
 * checked against this on every request, so removing someone from the env list
 * (or demoting them) takes effect immediately rather than at token expiry.
 */
export function resolveAdminRole(username: string): AdminRole | null {
  const cfg = getConfig();
  if (cfg.opsAdmins.includes(username)) return "ops-admin";
  if (cfg.contentEditors.includes(username)) return "content-editor";
  return null;
}

/**
 * Mints a signed token for a new session. The caller must persist `sid` (see
 * admin-sessions-repository) — a token without a live server-side record is
 * rejected by requireAdminSession.
 */
export function createAdminSession(
  username: string,
  role: AdminRole,
): { token: string; sid: string; expiresAt: Date } {
  const secret = requireSessionSecret();
  const sid = randomUUID();
  const exp = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  const payloadObj: AdminSession = { sid, username, role, exp };
  const payload = b64urlEncode(JSON.stringify(payloadObj));
  const signature = sign(payload, secret);
  return { token: `${payload}.${signature}`, sid, expiresAt: new Date(exp * 1000) };
}

export function readAdminSession(request: Request): AdminSession | null {
  const secret = getSessionSecret();
  if (!secret) return null;
  const token = parseCookie(request.headers.get("cookie"), ADMIN_SESSION_COOKIE);
  if (!token || !token.includes(".")) return null;
  const [payload, signature] = token.split(".", 2);
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null;
  try {
    const decoded = JSON.parse(b64urlDecode(payload)) as AdminSession;
    if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
    if (!decoded.username || !decoded.role || typeof decoded.sid !== "string" || !decoded.sid) {
      return null;
    }
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
    maxAge: ADMIN_SESSION_SECONDS,
  });
  response.cookies.set(ADMIN_CSRF_COOKIE, csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return response;
}

export function clearAdminAuthCookies(response: NextResponse): NextResponse {
  response.cookies.delete(ADMIN_SESSION_COOKIE);
  response.cookies.delete(ADMIN_CSRF_COOKIE);
  return response;
}
