#!/usr/bin/env node
/**
 * Production Supabase preflight — validates env and applies migrations.
 *
 * Usage:
 *   export DATABASE_URL="postgresql://postgres.<ref>:<pw>@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"
 *   export NEXT_PUBLIC_SUPABASE_URL=...
 *   export NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
 *   export SUPABASE_SERVICE_ROLE_KEY=...
 *   node scripts/supabase-production-preflight.mjs
 *
 * See docs/Integration/Supabase_Production_Setup.md
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnvFile() {
  const envPath = join(process.cwd(), ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();

const required = [
  "DATABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const missing = required.filter((key) => !process.env[key]?.trim());
if (missing.length > 0) {
  console.error("Missing required Supabase production variables:");
  for (const key of missing) console.error(`  - ${key}`);
  console.error("\nCreate the project in Supabase dashboard first, then re-run.");
  process.exit(1);
}

console.log("Applying migrations...");
const migrate = spawnSync("pnpm", ["db:migrate"], { stdio: "inherit", shell: true });
if (migrate.status !== 0) process.exit(migrate.status ?? 1);

console.log("\nRunning RLS negative tests...");
const rls = spawnSync("pnpm", ["security:rls:negative"], { stdio: "inherit", shell: true });
if (rls.status !== 0) process.exit(rls.status ?? 1);

console.log("\nPreflight complete. Next steps:");
console.log("  1. Configure Auth redirect URLs + SMTP in Supabase dashboard");
console.log("  2. Set WEBSITE_URL to production domain on Vercel");
console.log("  3. Share credentials with Wheels via secure channel");
console.log("  4. See docs/Integration/Supabase_Production_Setup.md §7 for handover");
