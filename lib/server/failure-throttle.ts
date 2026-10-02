/**
 * Failure-counting throttle: N failed attempts under one key within a window
 * lock that key out for a cooling-off period. Used where the thing being
 * protected is a secret that can be guessed — the admin password, a booking
 * reference + email pair.
 *
 * State is in-process: it resets on restart and is not shared across
 * instances. That is enough for the single-process Plesk deployment; move it to
 * Supabase if Wheels ever runs more than one node.
 */

export type ThrottleOptions = {
  maxFailures: number;
  /** Failures older than this stop counting toward the cap. */
  windowMs: number;
  lockoutMs: number;
  /**
   * Cap on unlocked keys. A spray past this drops the oldest unlocked entries.
   * Keys that are currently locked are kept, so the map can sit above the cap
   * until those lockouts expire.
   */
  maxTracked?: number;
};

export type ThrottleCheck = { allowed: true } | { allowed: false; retryAfterSeconds: number };

export type FailureThrottle = {
  check(key: string, now?: number): ThrottleCheck;
  /** Returns true when this failure tripped the lockout. */
  recordFailure(key: string, now?: number): boolean;
  clear(key: string): void;
  /** Test seam — the module-level map would otherwise leak between cases. */
  reset(): void;
};

type Attempt = { failures: number; firstFailureAt: number; lockedUntil: number };

export function createFailureThrottle(options: ThrottleOptions): FailureThrottle {
  const { maxFailures, windowMs, lockoutMs, maxTracked = 5_000 } = options;
  const attempts = new Map<string, Attempt>();

  function prune(now: number): void {
    for (const [key, entry] of attempts) {
      if (entry.lockedUntil < now && now - entry.firstFailureAt > windowMs) attempts.delete(key);
    }
    if (attempts.size <= maxTracked) return;
    // Drop unlocked entries in insertion order until the map fits. A lock is
    // never evicted: a spray of fresh keys must not flush a key that is
    // already locked, even if that lets the map sit above the cap until those
    // locks expire. Map order is insertion order, so this needs no sort.
    for (const [key, entry] of attempts) {
      if (attempts.size <= maxTracked) return;
      if (entry.lockedUntil > now) continue;
      attempts.delete(key);
    }
  }

  return {
    check(key, now = Date.now()) {
      const entry = attempts.get(key);
      if (entry && entry.lockedUntil > now) {
        return { allowed: false, retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000) };
      }
      return { allowed: true };
    },

    recordFailure(key, now = Date.now()) {
      prune(now);
      const entry = attempts.get(key);
      if (!entry || now - entry.firstFailureAt > windowMs) {
        attempts.set(key, { failures: 1, firstFailureAt: now, lockedUntil: 0 });
        return false;
      }
      entry.failures += 1;
      if (entry.failures >= maxFailures) {
        entry.lockedUntil = now + lockoutMs;
        entry.failures = 0;
        entry.firstFailureAt = now;
        return true;
      }
      return false;
    },

    clear(key) {
      attempts.delete(key);
    },

    reset() {
      attempts.clear();
    },
  };
}

/**
 * Best-effort client identity. `x-forwarded-for` is spoofable unless the proxy
 * in front of the app overwrites it, so this slows down a single attacker
 * rather than guaranteeing per-client accounting — pair it with keys that don't
 * depend on the client (the booking ref, the email).
 */
export function clientAddress(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  return first || request.headers.get("x-real-ip")?.trim() || "unknown";
}
