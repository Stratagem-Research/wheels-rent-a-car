import { afterEach, describe, expect, it, vi } from "vitest";
import { getPublicEnv, getServerEnv, getWhishEnv, getWizardEnv } from "@/lib/server/env";

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

  it("falls back to defaults when Supabase env is absent (dev/CI)", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    delete process.env.NEXT_PUBLIC_SITE_URL;

    const env = getPublicEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://localhost:54321");
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("placeholder-anon-key");
    expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
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

  it("accepts WIZARD_API_TOKEN as alias for WHEELS_INTERNAL_API_TOKEN", () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "srk");
    vi.stubEnv("DATABASE_URL", "postgres://postgres:pw@localhost:5432/postgres");
    vi.stubEnv("WHISH_CHANNEL", "channel");
    vi.stubEnv("WHISH_SECRET", "secret");
    vi.stubEnv("WEBSITE_URL", "https://wheels.com.lb");
    vi.stubEnv("WHEELS_INTERNAL_API_BASE_URL", "https://api.wheels.com.lb/api/v1");
    delete process.env.WHEELS_INTERNAL_API_TOKEN;
    vi.stubEnv("WIZARD_API_TOKEN", "wizard-token");

    expect(getServerEnv().WHEELS_INTERNAL_API_TOKEN).toBe("wizard-token");
  });

  it("getWizardEnv validates only Wizard vars, ignoring Whish/Supabase", () => {
    vi.stubEnv("WHEELS_INTERNAL_API_BASE_URL", "https://api.wheels.com.lb/api/v1");
    vi.stubEnv("WHEELS_INTERNAL_API_TOKEN", "token");

    expect(() => getWizardEnv()).not.toThrow();
  });

  it("getWizardEnv accepts WIZARD_API_TOKEN as a fallback alias", () => {
    vi.stubEnv("WHEELS_INTERNAL_API_BASE_URL", "https://api.wheels.com.lb/api/v1");
    delete process.env.WHEELS_INTERNAL_API_TOKEN;
    vi.stubEnv("WIZARD_API_TOKEN", "wizard-token");

    expect(getWizardEnv().WHEELS_INTERNAL_API_TOKEN).toBe("wizard-token");
  });

  it("getWhishEnv validates only Whish vars, ignoring Wizard/Supabase", () => {
    vi.stubEnv("WHISH_CHANNEL", "channel");
    vi.stubEnv("WHISH_SECRET", "secret");
    vi.stubEnv("WEBSITE_URL", "https://wheels.com.lb");

    expect(() => getWhishEnv()).not.toThrow();
  });
});
