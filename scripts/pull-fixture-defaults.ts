import { writeFileSync } from "node:fs";
import { join } from "node:path";
import "./load-env";
import { listLocations } from "@/lib/supabase/admin-repository";
import {
  listAddOnsFromDb,
  listCarWashPackagesFromDb,
  listLongTermTiersFromDb,
  listProtectionTiersFromDb,
} from "@/lib/supabase/catalog-repository";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AddOn, Review } from "@/types/domain";

function compact<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function tsExport(name: string, typeName: string, value: unknown): string {
  return `export const ${name}: ${typeName}[] = ${JSON.stringify(value, null, 2)};`;
}

async function addonsFromDb(): Promise<AddOn[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("catalog_addons")
    .select("id")
    .eq("active", true)
    .limit(1);
  if (error) throw new Error(error.message);
  if (!data?.length) {
    throw new Error("catalog_addons is empty — refusing to overwrite fixtures with fallback data.");
  }
  return listAddOnsFromDb();
}

async function reviewsFromDb(): Promise<Review[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_reviews")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  if (!data?.length) return [];
  return data.map((row) => ({
    id: row.id as string,
    rating: row.rating as number,
    body: row.body as string,
    author: row.reviewer_name as string,
    date: row.review_date as string,
    source: row.source as Review["source"],
    link: (row.link as string | null) ?? undefined,
  }));
}

async function main() {
  const [addons, protection, longTerm, carWash, branches, reviews] = await Promise.all([
    addonsFromDb(),
    listProtectionTiersFromDb(),
    listLongTermTiersFromDb(),
    listCarWashPackagesFromDb(true),
    listLocations(),
    reviewsFromDb(),
  ]);

  const catalogPath = join(process.cwd(), "lib/api/fixtures/catalog.ts");
  const catalog = `import type { AddOn, CarWashPackage, LongTermTier, ProtectionTier } from "@/types/domain";

/** Synced from live \`catalog_*\` tables. Re-run \`pnpm exec tsx scripts/pull-fixture-defaults.ts\`. */
${tsExport("ADD_ONS", "AddOn", compact(addons))}

/** WiFi hotspot add-ons — pick one data plan, not several at once. */
export function isWifiDataPlan(addOnId: string): boolean {
  return addOnId === "ao-wifi" || addOnId === "ao-sim-22gb" || addOnId.startsWith("ao-wifi-");
}

${tsExport("PROTECTION_TIERS", "ProtectionTier", compact(protection))}

${tsExport("LONG_TERM_TIERS", "LongTermTier", compact(longTerm))}

${tsExport("CAR_WASH_PACKAGES", "CarWashPackage", compact(carWash))}
`;
  writeFileSync(catalogPath, catalog);

  if (branches.length > 0) {
    writeFileSync(
      join(process.cwd(), "lib/api/fixtures/branches.ts"),
      `import type { Branch } from "@/types/domain";

/** Synced from live \`locations\`. Re-run \`pnpm exec tsx scripts/pull-fixture-defaults.ts\`. */
${tsExport("BRANCHES", "Branch", compact(branches))}
`,
    );
  }

  if (reviews.length > 0) {
    const contentPath = join(process.cwd(), "lib/api/fixtures/content.ts");
    const { SITE_CONFIG } = await import("@/lib/api/fixtures/content");
    writeFileSync(
      contentPath,
      `import type { Review, SiteConfig } from "@/types/domain";

/** Synced from live \`cms_reviews\`. Re-run \`pnpm exec tsx scripts/pull-fixture-defaults.ts\`. */
${tsExport("REVIEWS", "Review", compact(reviews))}

export const SITE_CONFIG: SiteConfig = ${JSON.stringify(compact(SITE_CONFIG), null, 2)};
`,
    );
  }

  console.log(
    JSON.stringify(
      {
        addons: addons.length,
        protection: protection.length,
        longTerm: longTerm.length,
        carWash: carWash.length,
        branches: branches.length,
        reviews: reviews.length,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
