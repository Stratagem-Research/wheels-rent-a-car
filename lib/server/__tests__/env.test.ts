import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicEnv, getServerEnv } from "@/lib/server/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server/env", () => {
  it("validates public env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pk_live_x");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");

    expect(() => getPublicEnv()).not.toThrow();
  });

  it("validates server env", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "srk");
    vi.stubEnv("DATABASE_URL", "postgres://postgres:pw@localhost:5432/postgres");
    vi.stubEnv("WHISH_CHANNEL", "channel");
    vi.stubEnv("WHISH_SECRET", "secret");
    vi.stubEnv("WEBSITE_URL", "https://wheels.com.lb");
    vi.stubEnv("WHEELS_INTERNAL_API_BASE_URL", "https://api.wheels.com.lb/api/v1");
    vi.stubEnv("WHEELS_INTERNAL_API_TOKEN", "token");

    expect(() => getServerEnv()).not.toThrow();
  });
});
