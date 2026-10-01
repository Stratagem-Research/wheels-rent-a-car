import { createHash, timingSafeEqual } from "crypto";

/**
 * Bearer-token gate for server-to-server routes that Wheels' backend (or an
 * ops script) calls into the website: the booking-status webhook and the
 * sync-status trigger. These must never be reachable from a browser — they can
 * rewrite a booking's lifecycle and payment state.
 *
 * Fails closed: with no token configured, every request is rejected.
 */
function expectedToken(): string | null {
  const token =
    process.env.WHEELS_INTERNAL_API_TOKEN?.trim() || process.env.WIZARD_API_TOKEN?.trim() || "";
  if (!token || token.startsWith("replace-with")) return null;
  return token;
}

/** Hash first so the compare is constant-time regardless of length. */
function safeEquals(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a, "utf8").digest();
  const hb = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(ha, hb);
}

export function isInternalRequestAuthorized(request: Request): boolean {
  const expected = expectedToken();
  if (!expected) return false;
  const match = /^Bearer\s+(.+)$/i.exec(request.headers.get("authorization") ?? "");
  return Boolean(match && safeEquals(match[1]!, expected));
}
