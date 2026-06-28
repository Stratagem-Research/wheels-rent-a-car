import { syncWizardVehiclesFromApi } from "@/lib/server/wizard-vehicle-sync";

async function main() {
  const result = await syncWizardVehiclesFromApi();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
