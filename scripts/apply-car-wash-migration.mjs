import { readFileSync } from "node:fs";
import { Client } from "pg";

const sql = readFileSync("supabase/migrations/20260622_000001_car_wash.sql", "utf8");
const password = process.env.SUPABASE_DB_PASSWORD ?? process.env.DATABASE_URL?.match(/:(.+?)@/)?.[1];
const ref = process.env.SUPABASE_PROJECT_REF ?? "bjzuuzaszxtwnlftmcuu";

if (!password) {
  console.error("Need SUPABASE_DB_PASSWORD or DATABASE_URL in env");
  process.exit(1);
}

/** Supabase IPv4 session pooler (direct db.* host is IPv6-only in many networks). */
const client = new Client({
  host: process.env.SUPABASE_POOLER_HOST ?? "aws-1-eu-central-1.pooler.supabase.com",
  port: Number(process.env.SUPABASE_POOLER_PORT ?? 5432),
  user: `postgres.${ref}`,
  password,
  database: "postgres",
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
});

try {
  await client.connect();
  console.log("Connected to Supabase Postgres");
  await client.query(sql);
  const { rows } = await client.query(
    "select count(*)::int as n from public.catalog_car_wash_packages",
  );
  console.log(`Migration applied. catalog_car_wash_packages rows: ${rows[0].n}`);
  await client.end();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
