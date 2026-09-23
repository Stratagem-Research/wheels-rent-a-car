import { z } from "zod";

const PublicEnvSchema = z.object({
  // Defaults let the app boot in dev/CI without Supabase provisioned.
  // Queries against the placeholder URL fail gracefully and fall back to
  // fixtures (see lib/server/public-content.ts). `pnpm env:check` is the
  // explicit production gate that requires real values before deploy.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default("http://localhost:54321"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).default("placeholder-anon-key"),
});

const ServerEnvSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  WHISH_CHANNEL: z.string().min(1),
  WHISH_SECRET: z.string().min(1),
  WEBSITE_URL: z.string().url(),
  WHEELS_INTERNAL_API_BASE_URL: z.string().url(),
  WHEELS_INTERNAL_API_TOKEN: z.string().min(1),
});

const WhishEnvSchema = z.object({
  WHISH_CHANNEL: z.string().min(1),
  WHISH_SECRET: z.string().min(1),
  WEBSITE_URL: z.string().url(),
});

const WizardEnvSchema = z.object({
  WHEELS_INTERNAL_API_BASE_URL: z.string().url(),
  WHEELS_INTERNAL_API_TOKEN: z.string().min(1),
});

type PublicEnv = z.infer<typeof PublicEnvSchema>;
type ServerEnv = z.infer<typeof ServerEnvSchema>;
type WhishEnv = z.infer<typeof WhishEnvSchema>;
type WizardEnv = z.infer<typeof WizardEnvSchema>;

export function getPublicEnv(): PublicEnv {
  return PublicEnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}

export function getServerEnv(): ServerEnv {
  return ServerEnvSchema.parse({
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    WHISH_CHANNEL: process.env.WHISH_CHANNEL,
    WHISH_SECRET: process.env.WHISH_SECRET,
    WEBSITE_URL: process.env.WEBSITE_URL,
    WHEELS_INTERNAL_API_BASE_URL: process.env.WHEELS_INTERNAL_API_BASE_URL,
    WHEELS_INTERNAL_API_TOKEN:
      process.env.WHEELS_INTERNAL_API_TOKEN ?? process.env.WIZARD_API_TOKEN,
  });
}

/** Whish-only slice, for consumers that don't need Supabase/Wizard vars. */
export function getWhishEnv(): WhishEnv {
  return WhishEnvSchema.parse({
    WHISH_CHANNEL: process.env.WHISH_CHANNEL,
    WHISH_SECRET: process.env.WHISH_SECRET,
    WEBSITE_URL: process.env.WEBSITE_URL,
  });
}

/** Wizard-only slice, for consumers that don't need Supabase/Whish vars. */
export function getWizardEnv(): WizardEnv {
  return WizardEnvSchema.parse({
    WHEELS_INTERNAL_API_BASE_URL: process.env.WHEELS_INTERNAL_API_BASE_URL,
    WHEELS_INTERNAL_API_TOKEN:
      process.env.WHEELS_INTERNAL_API_TOKEN ?? process.env.WIZARD_API_TOKEN,
  });
}

function toOrigin(value: string | undefined | null): string | null {
  if (!value) return null;
  const withProtocol = /^https?:\/\//.test(value) ? value : `https://${value}`;
  try {
    return new URL(withProtocol).origin;
  } catch {
    return null;
  }
}

/**
 * Canonical public origin for building absolute redirect URLs (auth callbacks,
 * password-reset links, SEO metadata, robots/sitemap). Resolves without
 * forcing the full server-env schema — so these don't depend on unrelated
 * secrets (Whish, internal API) being present.
 *
 * `WEBSITE_URL` is the single source of truth for the site's own origin —
 * there is intentionally no second `NEXT_PUBLIC_*` variant of it. Every
 * consumer of this value runs server-side (route handlers, `robots.ts`,
 * `sitemap.ts`, layout/page metadata), so a client-bundle-inlined duplicate
 * would only invite the two to drift.
 *
 * Order: WEBSITE_URL → VERCEL_PROJECT_PRODUCTION_URL (injected by Vercel, so
 * deployments resolve their own domain with no configuration) → localhost.
 */
export function getSiteUrl(): string {
  return (
    toOrigin(process.env.WEBSITE_URL) ??
    toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    "http://localhost:3000"
  );
}

/**
 * Same as `getSiteUrl()`, but falls back to the origin of the incoming request
 * before defaulting to localhost. Lets auth redirects work on any deployment
 * (preview URLs, a domain that changed, a fresh environment) without anyone
 * having to set an env var first.
 *
 * The forwarded host is only ever a fallback, and is never trusted on its own:
 * Supabase ignores any `redirect_to` outside its dashboard allow-list, so a
 * spoofed Host header cannot redirect a recovery link off-domain.
 */
export function getRequestOrigin(request: Request): string {
  const configured =
    toOrigin(process.env.WEBSITE_URL) ?? toOrigin(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  if (configured) return configured;

  const headers = request.headers;
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (host) {
    const forwardedProto = headers.get("x-forwarded-proto")?.split(",")[0]?.trim();
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
    const proto = forwardedProto || (isLocal ? "http" : "https");
    const origin = toOrigin(`${proto}://${host}`);
    if (origin) return origin;
  }

  try {
    return new URL(request.url).origin;
  } catch {
    return "http://localhost:3000";
  }
}
