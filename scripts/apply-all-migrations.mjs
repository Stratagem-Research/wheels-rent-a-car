#!/usr/bin/env node
/**
 * Apply dated SQL migrations in supabase/migrations/ in filename order.
 * Records applied files in public.schema_migrations so re-runs are safe.
 * Uses DATABASE_URL or Supabase pooler settings (IPv4-friendly).
 */
import { existsSync, readFileSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile() {
  const envPath = join(root, ".env");
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
const migrationsDir = join(root, "supabase/migrations");
const databaseUrl = process.env.DATABASE_URL;

function buildClientConfig() {
  if (process.env.SUPABASE_POOLER_HOST || (databaseUrl && databaseUrl.includes("db.") && databaseUrl.includes(".supabase.co"))) {
    const password =
      process.env.SUPABASE_DB_PASSWORD ?? databaseUrl?.match(/postgres:([^@]+)@/)?.[1];
    const ref =
      process.env.SUPABASE_PROJECT_REF ??
      databaseUrl?.match(/db\.([^.]+)\.supabase\.co/)?.[1] ??
      "bjzuuzaszxtwnlftmcuu";
    if (!password) {
      console.error("Need SUPABASE_DB_PASSWORD or DATABASE_URL with password.");
      process.exit(1);
    }
    return {
      host: process.env.SUPABASE_POOLER_HOST ?? "aws-1-eu-central-1.pooler.supabase.com",
      port: Number(process.env.SUPABASE_POOLER_PORT ?? 5432),
      user: `postgres.${ref}`,
      password,
      database: "postgres",
      ssl: { rejectUnauthorized: false },
    };
  }

  if (!databaseUrl) {
    console.error("DATABASE_URL is required.");
    process.exit(1);
  }
  return { connectionString: databaseUrl };
}

const files = (await readdir(migrationsDir))
  .filter((f) => /^\d.+\.sql$/.test(f))
  .sort();

const client = new pg.Client(buildClientConfig());
await client.connect();

try {
  await client.query(`
    create table if not exists public.schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    );
  `);
  const { rows } = await client.query("select filename from public.schema_migrations");
  const applied = new Set(rows.map((row) => row.filename));

  let appliedNow = 0;
  for (const file of files) {
    if (applied.has(file)) {
      console.log(`Skipping ${file} (already applied)`);
      continue;
    }
    const sql = await readFile(join(migrationsDir, file), "utf8");
    console.log(`Applying ${file}...`);
    await client.query(sql);
    await client.query("insert into public.schema_migrations (filename) values ($1)", [file]);
    console.log("  OK");
    appliedNow += 1;
  }
  console.log(`Done. Applied ${appliedNow} migration(s), skipped ${files.length - appliedNow}.`);
} finally {
  await client.end();
}
