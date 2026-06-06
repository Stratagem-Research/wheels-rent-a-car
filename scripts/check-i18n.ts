import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

function flattenKeys(obj: JsonValue, prefix = ""): string[] {
  if (obj === null) return [prefix];
  if (typeof obj !== "object") return [prefix];
  if (Array.isArray(obj)) return [prefix];

  return Object.entries(obj).flatMap(([key, value]) => {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    return flattenKeys(value, nextPrefix);
  });
}

function readJson(path: string): JsonValue {
  return JSON.parse(readFileSync(path, "utf8")) as JsonValue;
}

const root = process.cwd();
const locales = ["en", "ar", "fr"] as const;
const files = locales.map((locale) => ({
  locale,
  path: resolve(root, "messages", `${locale}.json`),
}));

const base = files[0];
if (!base) {
  console.error("No base locale file found.");
  process.exit(1);
}

const baseKeys = new Set(flattenKeys(readJson(base.path)).filter(Boolean));
let hasError = false;

for (const file of files.slice(1)) {
  const currentKeys = new Set(flattenKeys(readJson(file.path)).filter(Boolean));
  const missing = [...baseKeys].filter((key) => !currentKeys.has(key));
  const extra = [...currentKeys].filter((key) => !baseKeys.has(key));

  if (missing.length > 0 || extra.length > 0) {
    hasError = true;
    if (missing.length > 0) {
      console.error(`\n[${file.locale}] Missing keys (${missing.length}):`);
      for (const key of missing) console.error(`  - ${key}`);
    }
    if (extra.length > 0) {
      console.error(`\n[${file.locale}] Extra keys (${extra.length}):`);
      for (const key of extra) console.error(`  + ${key}`);
    }
  }
}

if (hasError) {
  process.exit(1);
}

console.log("i18n catalogs are key-aligned (en/ar/fr).");
