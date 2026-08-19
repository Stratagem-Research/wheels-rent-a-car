import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function unquote(value: string): string {
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseEnvFile(envPath: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).replace(/^export\s+/, "").trim();
    out[key] = unquote(trimmed.slice(eq + 1));
  }
  return out;
}

/** Load `.env` then `.env.local` into `process.env` for CLI scripts (does not override existing vars). */
export function loadEnvFile(): void {
  const parsed: Record<string, string> = {};
  for (const name of [".env", ".env.local"]) {
    const envPath = join(process.cwd(), name);
    if (!existsSync(envPath)) continue;
    Object.assign(parsed, parseEnvFile(envPath));
  }
  for (const [key, value] of Object.entries(parsed)) {
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvFile();
