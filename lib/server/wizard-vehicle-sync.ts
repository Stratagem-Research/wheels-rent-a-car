import { createWheelsInternalClient } from "@/lib/api/wheels-public";
import type { WizardVehicle } from "@/lib/api/wheels-public/schemas";
import { getWizardEnv } from "@/lib/server/env";
import {
  frontendVehicleIdFromWizard,
  slugifyVehicleName,
} from "@/lib/booking/wizard-vehicle-id";
import {
  deleteVehicleMetadataNotIn,
  deleteWizardVehiclesNotIn,
  ensureVehicleMetadataStub,
  upsertWizardVehicles,
  type UpsertWizardVehicleInput,
} from "@/lib/supabase/wizard-vehicles-repository";

export type WizardVehicleSyncResult = {
  source: "vehicles_sync_endpoint";
  fetched: number;
  upserted: number;
  /** Count of vehicles with website_enabled after filters. */
  websiteEnabled: number;
  /** Rows removed from `wizard_vehicles` (full sync only). */
  prunedWizard: number;
  /** Rows removed from `vehicle_metadata` (full sync only). */
  prunedMetadata: number;
  updatedSince?: string;
};

export interface SyncWizardVehiclesOptions {
  /** ISO/backend datetime; forwards as `?updated_since=` for incremental sync. */
  updatedSince?: string;
}

/** Wizard numeric id — `vehicle_id` is canonical, `id` is a mirror. */
function wizardVehicleId(vehicle: WizardVehicle): number | null {
  return vehicle.vehicle_id ?? vehicle.id ?? null;
}

const WEBSITE_SYNC_STATUSES = new Set(["active", "available"]);

/**
 * A vehicle is shown on the website when Wizard flags it enabled AND it is
 * not sold. `is_publicly_bookable` is an additional gate when present.
 */
function isWebsiteEnabled(vehicle: WizardVehicle): boolean {
  if (vehicle.is_sold === true) return false;
  if (vehicle.website_enabled === false) return false;
  if (vehicle.is_publicly_bookable === false) return false;
  if (
    vehicle.status &&
    !WEBSITE_SYNC_STATUSES.has(vehicle.status.trim().toLowerCase())
  ) {
    return false;
  }
  return vehicle.website_enabled === true || vehicle.is_publicly_bookable === true;
}

function resolveDisplayName(vehicle: WizardVehicle, id: number): string {
  return (
    vehicle.name?.trim() ||
    vehicle.display_name?.trim() ||
    [vehicle.brand, vehicle.model].filter(Boolean).join(" ").trim() ||
    `Vehicle ${id}`
  );
}

function wizardVehicleToRow(vehicle: WizardVehicle, id: number): UpsertWizardVehicleInput {
  return {
    wizard_vehicle_id: id,
    vehicle_type_id: vehicle.vehicle_type_id ?? null,
    brand: vehicle.brand ?? null,
    model: vehicle.model ?? null,
    // Prefer Wizard `name` (human label), then display_name, then brand+model.
    display_name: resolveDisplayName(vehicle, id),
    category: vehicle.category?.trim() ? vehicle.category.toLowerCase() : null,
    website_enabled: isWebsiteEnabled(vehicle),
    wizard_updated_at: vehicle.updated_at ?? null,
    operational: {
      public_vehicle_key: vehicle.public_vehicle_key ?? null,
      name: vehicle.name ?? null,
      display_name: vehicle.display_name ?? null,
      gearbox: vehicle.gearbox ?? vehicle.transmission ?? null,
      transmission: vehicle.transmission ?? vehicle.gearbox ?? null,
      fuel_type: vehicle.fuel_type ?? null,
      number_of_seats: vehicle.number_of_seats ?? null,
      number_of_doors: vehicle.number_of_doors ?? null,
      status: vehicle.status ?? null,
      daily_rate: vehicle.pricing?.daily_rate ?? vehicle.pricing?.standard_price ?? null,
      currency: vehicle.pricing?.currency ?? null,
    },
  };
}

/**
 * Sync vehicles from Wizard's internal `GET /api/v1/vehicles/sync` into Supabase.
 * Upserts every payload row (so disabled ones clear `website_enabled`); metadata
 * stubs are created only for website-enabled vehicles.
 *
 * Full sync (no `updatedSince`): deletes local mirror + metadata rows whose
 * Wizard ids are not in the payload. Incremental sync never prunes.
 */
export async function syncWizardVehiclesFromApi(
  options: SyncWizardVehiclesOptions = {},
): Promise<WizardVehicleSyncResult> {
  const env = getWizardEnv();
  const client = createWheelsInternalClient({
    apiToken: env.WHEELS_INTERNAL_API_TOKEN,
    baseUrl: env.WHEELS_INTERNAL_API_BASE_URL,
  });

  const response = await client.syncVehicles({ updatedSince: options.updatedSince });
  const vehicles = response.data.vehicles;
  const isFullSync = !options.updatedSince?.trim();

  const rows: UpsertWizardVehicleInput[] = [];
  for (const vehicle of vehicles) {
    const id = wizardVehicleId(vehicle);
    if (id == null) continue;
    rows.push(wizardVehicleToRow(vehicle, id));
  }

  const totalUpserted = await upsertWizardVehicles(rows);
  const websiteRows = rows.filter((row) => row.website_enabled);

  for (const row of websiteRows) {
    const frontendId = frontendVehicleIdFromWizard(row.wizard_vehicle_id);
    await ensureVehicleMetadataStub({
      frontendVehicleId: frontendId,
      slug: slugifyVehicleName(row.display_name) || frontendId,
      displayName: row.display_name,
    });
  }

  let prunedWizard = 0;
  let prunedMetadata = 0;
  if (isFullSync && rows.length > 0) {
    const keepWizardIds = rows.map((r) => r.wizard_vehicle_id);
    // Keep marketing rows for every vehicle still returned (enabled or not) so a
    // temporary disable does not wipe photos/copy. Drop everything else (legacy
    // seed ids, removed Wizard stock).
    const keepFrontendIds = keepWizardIds.map((id) => frontendVehicleIdFromWizard(id));
    prunedWizard = await deleteWizardVehiclesNotIn(keepWizardIds);
    prunedMetadata = await deleteVehicleMetadataNotIn(keepFrontendIds);
  }

  return {
    source: "vehicles_sync_endpoint",
    fetched: vehicles.length,
    upserted: totalUpserted,
    websiteEnabled: websiteRows.length,
    prunedWizard,
    prunedMetadata,
    updatedSince: options.updatedSince,
  };
}
