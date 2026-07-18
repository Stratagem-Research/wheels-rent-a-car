import { z } from "zod";

const PublicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
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
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
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

/**
 * Canonical public origin for building absolute redirect URLs (auth callbacks,
 * password-reset links). Resolves without forcing the full server-env schema —
 * so auth flows don't depend on unrelated secrets (Whish, internal API) being
 * present. Order: WEBSITE_URL → NEXT_PUBLIC_SITE_URL → localhost.
 */
export function getSiteUrl(): string {
  const candidate = process.env.WEBSITE_URL || process.env.NEXT_PUBLIC_SITE_URL;
  if (candidate) {
    try {
      return new URL(candidate).origin;
    } catch {
      // fall through to default on malformed values
    }
  }
  return "http://localhost:3000";
}
