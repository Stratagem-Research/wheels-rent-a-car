import { syncWizardVehiclesFromApi } from "@/lib/server/wizard-vehicle-sync";

async function main() {
  // Optional incremental sync: `pnpm wizard:sync-vehicles "2026-06-27 00:00:00"`
  const updatedSince = process.argv[2]?.trim() || undefined;
  const result = await syncWizardVehiclesFromApi({ updatedSince });
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
