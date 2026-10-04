import { describe, expect, it } from "vitest";
import { ADMIN_HEADERS, SECURITY_HEADERS } from "@/lib/server/security-headers";

const byKey = (entries: { key: string; value: string }[]) =>
  Object.fromEntries(entries.map((e) => [e.key, e.value]));

describe("security headers", () => {
  const headers = byKey(SECURITY_HEADERS);

  it("forbids framing the site, in both the modern and legacy header", () => {
    expect(headers["Content-Security-Policy"]).toContain("frame-ancestors 'none'");
    expect(headers["X-Frame-Options"]).toBe("DENY");
  });

  it("turns off MIME sniffing and sends HSTS", () => {
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["Strict-Transport-Security"]).toMatch(/^max-age=\d+/);
  });

  it("does not restrict features the site uses", () => {
    const policy = headers["Permissions-Policy"] ?? "";
    expect(policy).not.toMatch(/geolocation/);
    expect(policy).not.toMatch(/camera/);
  });

  it("doesn't add a script-src policy that could break checkout", () => {
    expect(headers["Content-Security-Policy"]).not.toMatch(/script-src|default-src/);
  });

  it("keeps admin responses out of caches", () => {
    expect(byKey(ADMIN_HEADERS)["Cache-Control"]).toContain("no-store");
  });
});
