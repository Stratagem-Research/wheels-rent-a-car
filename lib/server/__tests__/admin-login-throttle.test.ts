import { beforeEach, describe, expect, it } from "vitest";
import {
  adminLoginClientKey,
  checkAdminLoginAllowed,
  clearAdminLoginFailures,
  recordAdminLoginFailure,
  resetAdminLoginThrottle,
} from "@/lib/server/admin-login-throttle";

const FIFTEEN_MIN = 15 * 60 * 1000;

describe("admin-login-throttle", () => {
  beforeEach(() => {
    resetAdminLoginThrottle();
  });

  it("allows an unseen client", () => {
    expect(checkAdminLoginAllowed("1.2.3.4")).toEqual({ allowed: true });
  });

  it("allows attempts up to the cap, then locks out", () => {
    for (let i = 0; i < 4; i += 1) {
      expect(recordAdminLoginFailure("1.2.3.4")).toBe(false);
      expect(checkAdminLoginAllowed("1.2.3.4").allowed).toBe(true);
    }
    expect(recordAdminLoginFailure("1.2.3.4")).toBe(true);
    const result = checkAdminLoginAllowed("1.2.3.4");
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("locks one client without affecting another", () => {
    for (let i = 0; i < 5; i += 1) recordAdminLoginFailure("1.2.3.4");
    expect(checkAdminLoginAllowed("1.2.3.4").allowed).toBe(false);
    expect(checkAdminLoginAllowed("5.6.7.8").allowed).toBe(true);
  });

  it("releases the lockout once the window passes", () => {
    const start = Date.now();
    for (let i = 0; i < 5; i += 1) recordAdminLoginFailure("1.2.3.4", start);
    expect(checkAdminLoginAllowed("1.2.3.4", start).allowed).toBe(false);
    expect(checkAdminLoginAllowed("1.2.3.4", start + FIFTEEN_MIN + 1000).allowed).toBe(true);
  });

  it("forgets stale failures outside the counting window", () => {
    const start = Date.now();
    for (let i = 0; i < 4; i += 1) recordAdminLoginFailure("1.2.3.4", start);
    // A failure long after the window starts a fresh count rather than tripping.
    expect(recordAdminLoginFailure("1.2.3.4", start + FIFTEEN_MIN + 1000)).toBe(false);
    expect(checkAdminLoginAllowed("1.2.3.4", start + FIFTEEN_MIN + 1000).allowed).toBe(true);
  });

  it("clears the count after a successful sign-in", () => {
    for (let i = 0; i < 4; i += 1) recordAdminLoginFailure("1.2.3.4");
    clearAdminLoginFailures("1.2.3.4");
    expect(recordAdminLoginFailure("1.2.3.4")).toBe(false);
    expect(checkAdminLoginAllowed("1.2.3.4").allowed).toBe(true);
  });

  it("keys off the first x-forwarded-for hop", () => {
    const request = new Request("http://localhost/api/admin/sessions", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(adminLoginClientKey(request)).toBe("203.0.113.5");
  });

  it("falls back to a stable key when no client IP is present", () => {
    expect(adminLoginClientKey(new Request("http://localhost/api/admin/sessions"))).toBe("unknown");
  });
});
