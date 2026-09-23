import { afterEach, describe, expect, it, vi } from "vitest";
import {
  getPublicEnv,
  getRequestOrigin,
  getServerEnv,
  getSiteUrl,
  getWhishEnv,
  getWizardEnv,
} from "@/lib/server/env";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("server/env", () => {
  it("validates public env", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "pk_live_x");

    expect(() => getPublicEnv()).not.toThrow();
  });

  it("falls back to defaults when Supabase env is absent (dev/CI)", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    const env = getPublicEnv();
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("http://localhost:54321");
    expect(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY).toBe("placeholder-anon-key");
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

describe("origin resolution", () => {
  const clearOriginEnv = () => {
    delete process.env.WEBSITE_URL;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
  };

  const req = (headers: Record<string, string>, url = "http://internal.local/api/auth/forgot-password") =>
    new Request(url, { headers });

  it("prefers WEBSITE_URL over everything else", () => {
    clearOriginEnv();
    vi.stubEnv("WEBSITE_URL", "https://wheelsrentacar.com.lb/some/path");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "ignored.vercel.app");
    expect(getSiteUrl()).toBe("https://wheelsrentacar.com.lb");
  });

  it("falls back to the Vercel-injected production URL with no configuration", () => {
    clearOriginEnv();
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "wheels.vercel.app");
    expect(getSiteUrl()).toBe("https://wheels.vercel.app");
  });

  it("derives the origin from the forwarded host when nothing is configured", () => {
    clearOriginEnv();
    expect(
      getRequestOrigin(
        req({ "x-forwarded-host": "wheelsrentacar.com.lb", "x-forwarded-proto": "https" }),
      ),
    ).toBe("https://wheelsrentacar.com.lb");
  });

  it("assumes https for a non-local host with no forwarded protocol", () => {
    clearOriginEnv();
    expect(getRequestOrigin(req({ host: "wheelsrentacar.com.lb" }))).toBe(
      "https://wheelsrentacar.com.lb",
    );
  });

  it("keeps http for local hosts", () => {
    clearOriginEnv();
    expect(getRequestOrigin(req({ host: "localhost:3000" }))).toBe("http://localhost:3000");
  });

  it("still prefers configured env over the request host", () => {
    clearOriginEnv();
    vi.stubEnv("WEBSITE_URL", "https://wheelsrentacar.com.lb");
    expect(getRequestOrigin(req({ host: "attacker.example" }))).toBe(
      "https://wheelsrentacar.com.lb",
    );
  });
});
