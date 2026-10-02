import { describe, expect, it } from "vitest";
import { createFailureThrottle } from "@/lib/server/failure-throttle";

describe("createFailureThrottle eviction", () => {
  it("drops unlocked keys to stay under the cap and keeps a lock", () => {
    const throttle = createFailureThrottle({
      maxFailures: 2,
      windowMs: 60_000,
      lockoutMs: 60_000,
      maxTracked: 3,
    });
    const now = 1_000_000;

    throttle.recordFailure("target", now);
    expect(throttle.recordFailure("target", now)).toBe(true);
    expect(throttle.check("target", now).allowed).toBe(false);

    throttle.recordFailure("junk-a", now + 1);
    throttle.recordFailure("junk-b", now + 2);
    throttle.recordFailure("junk-c", now + 3);
    throttle.recordFailure("junk-d", now + 4);

    expect(throttle.check("target", now + 5).allowed).toBe(false);
    expect(throttle.check("junk-d", now + 5).allowed).toBe(true);
  });
});
