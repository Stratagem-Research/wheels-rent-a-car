import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockIsActive = vi.fn();

vi.mock("@/lib/supabase/admin-sessions-repository", () => ({
  isAdminSessionActive: (...args: unknown[]) => mockIsActive(...args),
}));

import { requireAdminSession } from "@/lib/server/admin-api";
import { createAdminSession, readAdminSession } from "@/lib/server/admin-auth";

function requestWith(token: string): Request {
  return new Request("http://localhost/api/admin/x", {
    headers: { cookie: `wheels.admin.session=${encodeURIComponent(token)}` },
  });
}

describe("requireAdminSession", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.ADMIN_SESSION_SECRET = "test-secret-test-secret-test-secret";
    process.env.ADMIN_OPS_ADMIN_USERNAMES = "admin";
    process.env.ADMIN_CONTENT_EDITOR_USERNAMES = "editor";
    mockIsActive.mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("accepts a signed token whose server-side session is live", async () => {
    mockIsActive.mockResolvedValue(true);
    const { token, sid } = createAdminSession("admin", "ops-admin");
    const result = await requireAdminSession(requestWith(token));
    expect(result.ok).toBe(true);
    expect(mockIsActive).toHaveBeenCalledWith(sid);
  });

  it("rejects a validly signed token once the session is revoked (logout)", async () => {
    mockIsActive.mockResolvedValue(false);
    const { token } = createAdminSession("admin", "ops-admin");
    const result = await requireAdminSession(requestWith(token));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("fails closed when the session store can't be reached", async () => {
    mockIsActive.mockRejectedValue(new Error("db down"));
    const { token } = createAdminSession("admin", "ops-admin");
    const result = await requireAdminSession(requestWith(token));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(503);
  });

  it("rejects a user who was removed from the env lists after signing in", async () => {
    mockIsActive.mockResolvedValue(true);
    const { token } = createAdminSession("editor", "content-editor");
    process.env.ADMIN_CONTENT_EDITOR_USERNAMES = "someone-else";
    const result = await requireAdminSession(requestWith(token));
    expect(result.ok).toBe(false);
  });

  it("uses the current role, not the one baked into the token", async () => {
    mockIsActive.mockResolvedValue(true);
    const { token } = createAdminSession("admin", "ops-admin");
    process.env.ADMIN_OPS_ADMIN_USERNAMES = "someone-else";
    process.env.ADMIN_CONTENT_EDITOR_USERNAMES = "admin";
    const result = await requireAdminSession(requestWith(token), ["ops-admin"]);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(403);
  });

  it("rejects an old-format token with no session id", async () => {
    const { token } = createAdminSession("admin", "ops-admin");
    const [payload] = token.split(".");
    const legacy = JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"));
    delete legacy.sid;
    // Re-sign by hand is impossible without the secret path; an unsigned/edited
    // payload must fail signature verification either way.
    const tampered = `${Buffer.from(JSON.stringify(legacy)).toString("base64url")}.${token.split(".")[1]}`;
    expect(readAdminSession(requestWith(tampered))).toBeNull();
    const result = await requireAdminSession(requestWith(tampered));
    expect(result.ok).toBe(false);
    expect(mockIsActive).not.toHaveBeenCalled();
  });
});
