import { seedWebsiteData } from "../lib/supabase/seed";

async function main() {
  const resources = process.argv.slice(2);
  const targets = resources.length > 0 ? resources : (["catalog"] as const);
  const results = await seedWebsiteData(targets as never);
  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
