import { createWheelsInternalClient } from "@/lib/api/wheels-public";
import type { WizardVehicle } from "@/lib/api/wheels-public/schemas";
import { getWizardEnv } from "@/lib/server/env";
import {
  frontendVehicleIdFromWizard,
  slugifyVehicleName,
} from "@/lib/booking/wizard-vehicle-id";
import {
  ensureVehicleMetadataStub,
  upsertWizardVehicles,
  clearDailyRateOverrides,
  type UpsertWizardVehicleInput,
} from "@/lib/supabase/wizard-vehicles-repository";
import { ensureVehicleSeoRows } from "@/lib/supabase/seo-repository";
import { listVehicleMetadata, type VehicleMetadataRow } from "@/lib/supabase/admin-repository";
import { parseOperational } from "@/lib/vehicles/vehicle-operational";

export type WizardVehicleSyncResult = {
  source: "vehicles_sync_endpoint";
  fetched: number;
  upserted: number;
  /** Count of vehicles with website_enabled after filters. */
  websiteEnabled: number;
  /** Always 0 — sync only upserts; it never deletes local cars. */
  prunedWizard: number;
  /** Always 0 — sync only upserts; it never deletes website metadata. */
  prunedMetadata: number;
  /** Admin daily-rate overrides reset to the Wizard price. 0 in dry-run. */
  overridesCleared: number;
  updatedSince?: string;
};

export type SyncPreviewItem = {
  frontend_vehicle_id: string;
  label: string;
  adminRate: number;
  wizardRate: number | null;
};

export type WizardVehicleSyncPreview = {
  source: "vehicles_sync_endpoint";
  fetched: number;
  /** Admin overrides that would be reset to the Wizard price. */
  items: SyncPreviewItem[];
  count: number;
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
 * Upserts every payload row. Never deletes local mirror or metadata rows
 * (manual cars and extra website content stay). Incremental `updatedSince`
 * is forwarded to Wizard as `?updated_since=`.
 *
 * Wizard is the source of truth for pricing: on a real sync, any admin-set
 * `daily_rate` override on the synced vehicles is cleared so the public
 * listing falls back to the Wizard rate. Pass `dryRun: true` to fetch Wizard
 * and return the list of overrides that would be cleared without persisting.
 */
export async function syncWizardVehiclesFromApi(
  options: SyncWizardVehiclesOptions & { dryRun?: boolean; keepOverrides?: boolean } = {},
): Promise<WizardVehicleSyncResult | WizardVehicleSyncPreview> {
  const env = getWizardEnv();
  const client = createWheelsInternalClient({
    apiToken: env.WHEELS_INTERNAL_API_TOKEN,
    baseUrl: env.WHEELS_INTERNAL_API_BASE_URL,
  });

  const response = await client.syncVehicles({ updatedSince: options.updatedSince });
  const vehicles = response.data.vehicles;

  const rows: UpsertWizardVehicleInput[] = [];
  for (const vehicle of vehicles) {
    const id = wizardVehicleId(vehicle);
    if (id == null) continue;
    rows.push(wizardVehicleToRow(vehicle, id));
  }

  const frontendIds = rows.map((row) => frontendVehicleIdFromWizard(row.wizard_vehicle_id));
  const metadataRows = await listVehicleMetadata();
  const metaById = new Map(metadataRows.map((row) => [row.frontend_vehicle_id, row] as const));

  // Overrides that would be (or are) cleared: synced wizard vehicles whose
  // metadata row carries a positive admin `daily_rate`.
  const overrideItems: SyncPreviewItem[] = [];
  for (const row of rows) {
    const frontendId = frontendVehicleIdFromWizard(row.wizard_vehicle_id);
    const meta = metaById.get(frontendId);
    const adminRate = parseOperational(meta?.operational).daily_rate;
    if (typeof adminRate === "number" && adminRate > 0) {
      const wizRate = row.operational.daily_rate;
      overrideItems.push({
        frontend_vehicle_id: frontendId,
        label: row.display_name,
        adminRate,
        wizardRate: typeof wizRate === "number" ? wizRate : null,
      });
    }
  }

  if (options.dryRun) {
    return {
      source: "vehicles_sync_endpoint",
      fetched: vehicles.length,
      items: overrideItems,
      count: overrideItems.length,
      updatedSince: options.updatedSince,
    };
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

  // Surface synced vehicle models in /admin/seo without a manual step — one
  // row per slug (matching ensureVehicleMetadataStub's slug above), since
  // units of the same model share one /vehicles/[slug] page. Best-effort —
  // never blocks the Wizard sync from completing.
  await ensureVehicleSeoRows(
    websiteRows.map((row) => {
      const frontendId = frontendVehicleIdFromWizard(row.wizard_vehicle_id);
      return {
        slug: slugifyVehicleName(row.display_name) || frontendId,
        label: row.display_name,
      };
    }),
  ).catch(() => undefined);

  // Wizard is the source of truth for pricing — clear admin overrides on the
  // synced batch so the public listing falls back to the Wizard rate. The admin
  // can opt out per-sync via `keepOverrides` (modal: "Keep my prices").
  const overridesCleared = options.keepOverrides
    ? 0
    : await clearDailyRateOverrides(frontendIds).catch(() => 0);

  return {
    source: "vehicles_sync_endpoint",
    fetched: vehicles.length,
    upserted: totalUpserted,
    websiteEnabled: websiteRows.length,
    prunedWizard: 0,
    prunedMetadata: 0,
    overridesCleared,
    updatedSince: options.updatedSince,
  };
}
