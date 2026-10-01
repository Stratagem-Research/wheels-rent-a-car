import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { randomBytes, scryptSync } from "crypto";
import { authenticateAdminCredentials } from "@/lib/server/admin-auth";

function scryptHash(password: string): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt.toString("hex")}$${key.toString("hex")}`;
}

describe("admin-auth credentials", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ADMIN_SESSION_SECRET = "test-secret";
    process.env.ADMIN_OPS_ADMIN_USERNAMES = "admin";
    process.env.ADMIN_CONTENT_EDITOR_USERNAMES = "editor";
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_PASSWORD_HASH;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("accepts the right password against a stored scrypt hash", () => {
    process.env.ADMIN_PASSWORD_HASH = scryptHash("correct horse battery");
    expect(authenticateAdminCredentials("admin", "correct horse battery")).toEqual({
      username: "admin",
      role: "ops-admin",
    });
  });

  it("rejects a wrong password against the hash", () => {
    process.env.ADMIN_PASSWORD_HASH = scryptHash("correct horse battery");
    expect(authenticateAdminCredentials("admin", "wrong password")).toBeNull();
  });

  it("prefers the hash over a stale plaintext password", () => {
    process.env.ADMIN_PASSWORD_HASH = scryptHash("the real one");
    process.env.ADMIN_PASSWORD = "the old one";
    expect(authenticateAdminCredentials("admin", "the old one")).toBeNull();
    expect(authenticateAdminCredentials("admin", "the real one")).not.toBeNull();
  });

  it("rejects a malformed hash rather than falling back to plaintext", () => {
    process.env.ADMIN_PASSWORD_HASH = "scrypt$not-a-real-hash";
    process.env.ADMIN_PASSWORD = "plain";
    expect(authenticateAdminCredentials("admin", "plain")).toBeNull();
  });

  it("still supports a plaintext password when no hash is configured", () => {
    process.env.ADMIN_PASSWORD = "plain-password";
    expect(authenticateAdminCredentials("admin", "plain-password")).toEqual({
      username: "admin",
      role: "ops-admin",
    });
    expect(authenticateAdminCredentials("admin", "nope")).toBeNull();
  });

  it("rejects an unknown username even with the right password", () => {
    process.env.ADMIN_PASSWORD_HASH = scryptHash("right");
    expect(authenticateAdminCredentials("stranger", "right")).toBeNull();
  });
});
