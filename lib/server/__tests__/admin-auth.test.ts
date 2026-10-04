import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomBytes, scryptSync } from "crypto";
import { authenticateAdminCredentials } from "@/lib/server/admin-auth";

function scryptHash(password: string, separator: ":" | "$" = ":"): string {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 256 * 1024 * 1024 });
  return ["scrypt", 16384, 8, 1, salt.toString("hex"), key.toString("hex")].join(separator);
}

const OPS = { username: "admin", role: "ops-admin" };
const EDITOR = { username: "editor", role: "content-editor" };

describe("admin-auth credentials", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ADMIN_SESSION_SECRET = "test-secret";
    process.env.ADMIN_OPS_ADMIN_USERNAMES = "admin";
    process.env.ADMIN_CONTENT_EDITOR_USERNAMES = "editor";
    delete process.env.ADMIN_PASSWORD_HASH;
    delete process.env.ADMIN_EDITOR_PASSWORD_HASH;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  describe("ops password", () => {
    it("accepts the right password against a stored scrypt hash", () => {
      process.env.ADMIN_PASSWORD_HASH = scryptHash("correct horse battery");
      expect(authenticateAdminCredentials("admin", "correct horse battery")).toEqual(OPS);
    });

    it("rejects a wrong password against the hash", () => {
      process.env.ADMIN_PASSWORD_HASH = scryptHash("correct horse battery");
      expect(authenticateAdminCredentials("admin", "wrong password")).toBeNull();
    });

    it("rejects a malformed hash", () => {
      process.env.ADMIN_PASSWORD_HASH = "scrypt:not-a-real-hash";
      expect(authenticateAdminCredentials("admin", "plain")).toBeNull();
    });

    it("explains a mangled hash instead of just failing the login", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      // What Next's .env loader leaves of a `$`-delimited hash.
      process.env.ADMIN_PASSWORD_HASH = "scrypt6384";
      expect(authenticateAdminCredentials("admin", "anything")).toBeNull();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("isn't a valid hash"));
    });

    it("still accepts the legacy $-delimited hash format", () => {
      process.env.ADMIN_PASSWORD_HASH = scryptHash("legacy-password", "$");
      expect(authenticateAdminCredentials("admin", "legacy-password")).toEqual(OPS);
      expect(authenticateAdminCredentials("admin", "wrong")).toBeNull();
    });

    it("generates hashes with no `$`, so a .env file can't mangle them", () => {
      expect(scryptHash("whatever")).not.toContain("$");
    });

    it("fails loudly when no hash is configured", () => {
      expect(() => authenticateAdminCredentials("admin", "anything")).toThrow(
        /ADMIN_PASSWORD_HASH is required/,
      );
    });

    it("does not accept a plaintext ADMIN_PASSWORD", () => {
      process.env.ADMIN_PASSWORD = "plain-password";
      expect(() => authenticateAdminCredentials("admin", "plain-password")).toThrow(
        /ADMIN_PASSWORD_HASH is required/,
      );
    });

    it("rejects an unknown username even with the right password", () => {
      process.env.ADMIN_PASSWORD_HASH = scryptHash("right");
      expect(authenticateAdminCredentials("stranger", "right")).toBeNull();
    });
  });

  describe("separate editor password", () => {
    beforeEach(() => {
      process.env.ADMIN_PASSWORD_HASH = scryptHash("ops-password-1");
      process.env.ADMIN_EDITOR_PASSWORD_HASH = scryptHash("editor-password-1");
    });

    it("signs each role in with its own password", () => {
      expect(authenticateAdminCredentials("admin", "ops-password-1")).toEqual(OPS);
      expect(authenticateAdminCredentials("editor", "editor-password-1")).toEqual(EDITOR);
    });

    it("does not let the editor password unlock the ops username", () => {
      expect(authenticateAdminCredentials("admin", "editor-password-1")).toBeNull();
    });

    it("does not let the ops password unlock the editor username", () => {
      expect(authenticateAdminCredentials("editor", "ops-password-1")).toBeNull();
    });

    it("rejects a wrong editor password", () => {
      expect(authenticateAdminCredentials("editor", "nope")).toBeNull();
    });

    it("does not accept a plaintext ADMIN_EDITOR_PASSWORD", () => {
      delete process.env.ADMIN_EDITOR_PASSWORD_HASH;
      process.env.ADMIN_EDITOR_PASSWORD = "plain-editor-pw";
      expect(authenticateAdminCredentials("editor", "plain-editor-pw")).toBeNull();
    });
  });

  describe("editor sign-in when no editor password is configured", () => {
    it("is disabled — the ops password does not open the editor username", () => {
      process.env.ADMIN_PASSWORD_HASH = scryptHash("ops-password-1");
      expect(authenticateAdminCredentials("editor", "ops-password-1")).toBeNull();
      expect(authenticateAdminCredentials("editor", "")).toBeNull();
    });

    it("leaves ops sign-in unaffected", () => {
      process.env.ADMIN_PASSWORD_HASH = scryptHash("ops-password-1");
      expect(authenticateAdminCredentials("admin", "ops-password-1")).toEqual(OPS);
    });
  });

  describe("editor password equal to the ops password", () => {
    it("refuses editor sign-in so the roles can't be collapsed by config", () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
      process.env.ADMIN_PASSWORD_HASH = scryptHash("shared-password");
      process.env.ADMIN_EDITOR_PASSWORD_HASH = scryptHash("shared-password");
      expect(authenticateAdminCredentials("editor", "shared-password")).toBeNull();
      expect(warn).toHaveBeenCalled();
      // Ops itself is unaffected.
      expect(authenticateAdminCredentials("admin", "shared-password")).toEqual(OPS);
    });

  });
});
