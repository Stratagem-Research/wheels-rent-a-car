/**
 * Brute-force protection for /api/admin/sessions.
 *
 * Wheels signs in with a single shared password, so that one secret is the
 * entire boundary around the admin — unlimited guessing is the whole attack.
 * This caps attempts per client and locks the client out for a cooling-off
 * window once the cap is hit.
 *
 * State is in-process: it resets when the Node process restarts and is not
 * shared across instances. That's sufficient for the single-process Plesk
 * deployment; move it to Supabase if Wheels ever runs more than one node.
 */

const MAX_FAILURES = 5;
/** Failures older than this stop counting toward the cap. */
const WINDOW_MS = 15 * 60 * 1000;
const LOCKOUT_MS = 15 * 60 * 1000;
/** Bound the map so a spray across spoofed IPs can't grow it without limit. */
const MAX_TRACKED_CLIENTS = 5_000;

type Attempt = { failures: number; firstFailureAt: number; lockedUntil: number };

const attempts = new Map<string, Attempt>();

function prune(now: number): void {
  for (const [key, entry] of attempts) {
    const expired = entry.lockedUntil < now && now - entry.firstFailureAt > WINDOW_MS;
    if (expired) attempts.delete(key);
  }
  if (attempts.size <= MAX_TRACKED_CLIENTS) return;
  // Still oversized after pruning — drop the oldest entries.
  const sorted = [...attempts.entries()].sort((a, b) => a[1].firstFailureAt - b[1].firstFailureAt);
  for (const [key] of sorted.slice(0, attempts.size - MAX_TRACKED_CLIENTS)) attempts.delete(key);
}

/**
 * Best-effort client identity. `x-forwarded-for` is spoofable, so this slows
 * down a single attacker rather than guaranteeing per-client accounting.
 */
export function adminLoginClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function checkAdminLoginAllowed(
  key: string,
  now: number = Date.now(),
): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  const entry = attempts.get(key);
  if (!entry) return { allowed: true };
  if (entry.lockedUntil > now) {
    return { allowed: false, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
  }
  return { allowed: true };
}

/** Returns true when this failure tripped the lockout. */
export function recordAdminLoginFailure(key: string, now: number = Date.now()): boolean {
  prune(now);
  const entry = attempts.get(key);
  if (!entry || now - entry.firstFailureAt > WINDOW_MS) {
    attempts.set(key, { failures: 1, firstFailureAt: now, lockedUntil: 0 });
    return false;
  }
  entry.failures += 1;
  if (entry.failures >= MAX_FAILURES) {
    entry.lockedUntil = now + LOCKOUT_MS;
    entry.failures = 0;
    entry.firstFailureAt = now;
    return true;
  }
  return false;
}

export function clearAdminLoginFailures(key: string): void {
  attempts.delete(key);
}

/** Test seam — the module-level map would otherwise leak between cases. */
export function resetAdminLoginThrottle(): void {
  attempts.clear();
}
