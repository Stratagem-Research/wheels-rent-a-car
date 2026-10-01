import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { isInternalRequestAuthorized } from "@/lib/server/internal-api-auth";

const req = (authorization?: string) =>
  new Request("http://localhost/api/wizard/sync/booking", {
    method: "POST",
    headers: authorization ? { authorization } : {},
  });

describe("internal-api-auth", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.WIZARD_API_TOKEN;
    process.env.WHEELS_INTERNAL_API_TOKEN = "s3cret-token";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("accepts the correct bearer token", () => {
    expect(isInternalRequestAuthorized(req("Bearer s3cret-token"))).toBe(true);
  });

  it("rejects a request with no authorization header", () => {
    expect(isInternalRequestAuthorized(req())).toBe(false);
  });

  it("rejects a wrong token", () => {
    expect(isInternalRequestAuthorized(req("Bearer nope"))).toBe(false);
  });

  it("rejects a non-bearer scheme carrying the right value", () => {
    expect(isInternalRequestAuthorized(req("Basic s3cret-token"))).toBe(false);
  });

  it("fails closed when no token is configured", () => {
    delete process.env.WHEELS_INTERNAL_API_TOKEN;
    expect(isInternalRequestAuthorized(req("Bearer "))).toBe(false);
    expect(isInternalRequestAuthorized(req("Bearer anything"))).toBe(false);
  });

  it("fails closed on a placeholder token", () => {
    process.env.WHEELS_INTERNAL_API_TOKEN = "replace-with-real-token";
    expect(isInternalRequestAuthorized(req("Bearer replace-with-real-token"))).toBe(false);
  });

  it("falls back to WIZARD_API_TOKEN", () => {
    delete process.env.WHEELS_INTERNAL_API_TOKEN;
    process.env.WIZARD_API_TOKEN = "wizard-token";
    expect(isInternalRequestAuthorized(req("Bearer wizard-token"))).toBe(true);
  });
});
