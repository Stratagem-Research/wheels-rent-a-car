import { getAvailability, getWizardVehicles } from "@/lib/api/wheels-public";
import type { WizardVehicle } from "@/lib/api/wheels-public/schemas";
import { mapVehicleTypeToCategory } from "@/lib/api/wheels-public/vehicle-enrichment";
import { toBackendDateTime } from "@/lib/api/wheels-public/datetime";
import {
  frontendVehicleIdFromWizard,
  slugifyVehicleName,
} from "@/lib/booking/wizard-vehicle-id";
import {
  ensureVehicleMetadataStub,
  upsertWizardVehicles,
  type UpsertWizardVehicleInput,
} from "@/lib/supabase/wizard-vehicles-repository";
import { ApiError as WheelsApiError } from "@/lib/api/wheels-public/client";

export type WizardVehicleSyncResult = {
  source: "vehicles_endpoint" | "availability_bootstrap";
  upserted: number;
  message?: string;
};

function isWebsiteEnabled(vehicle: WizardVehicle): boolean {
  if (vehicle.website_enabled === true || vehicle.is_website_enabled === true) return true;
  if (vehicle.public_status?.toLowerCase() === "public") return true;
  return vehicle.website_enabled !== false && vehicle.is_website_enabled !== false;
}

function wizardVehicleToRow(vehicle: WizardVehicle): UpsertWizardVehicleInput {
  const displayName =
    vehicle.display_name?.trim() ||
    [vehicle.brand, vehicle.model].filter(Boolean).join(" ").trim() ||
    vehicle.name?.trim() ||
    `Vehicle ${vehicle.id}`;

  const category =
    vehicle.category?.trim() ||
    (vehicle.vehicle_type ? mapVehicleTypeToCategory(vehicle.vehicle_type) : undefined) ||
    null;

  return {
    wizard_vehicle_id: vehicle.id,
    vehicle_type_id: vehicle.vehicle_type_id ?? null,
    brand: vehicle.brand ?? vehicle.name ?? null,
    model: vehicle.model ?? vehicle.name ?? null,
    display_name: displayName,
    category,
    website_enabled: isWebsiteEnabled(vehicle),
    wizard_updated_at: vehicle.updated_at ?? null,
    operational: {
      vehicle_type: vehicle.vehicle_type,
      gearbox: vehicle.gearbox,
      fuel_type: vehicle.fuel_type,
      number_of_seats: vehicle.number_of_seats,
      public_status: vehicle.public_status,
    },
  };
}

async function bootstrapFromAvailability(): Promise<WizardVehicle[]> {
  const start = new Date();
  start.setDate(start.getDate() + 7);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);

  const response = await getAvailability({
    startDateTime: toBackendDateTime(start.toISOString()),
    endDateTime: toBackendDateTime(end.toISOString()),
    includeBooked: true,
  });

  const byId = new Map<number, WizardVehicle>();
  for (const vehicle of response.data.vehicles) {
    if (!byId.has(vehicle.id)) {
      byId.set(vehicle.id, {
        id: vehicle.id,
        vehicle_type_id: vehicle.vehicle_type_id,
        brand: vehicle.name,
        model: vehicle.model,
        name: vehicle.name,
        display_name: vehicle.name,
        vehicle_type: vehicle.vehicle_type,
        website_enabled: true,
        gearbox: vehicle.gearbox,
        fuel_type: vehicle.fuel_type,
        number_of_seats: vehicle.number_of_seats,
      });
    }
  }
  return [...byId.values()];
}

export async function syncWizardVehiclesFromApi(): Promise<WizardVehicleSyncResult> {
  let vehicles: WizardVehicle[];
  let source: WizardVehicleSyncResult["source"] = "vehicles_endpoint";

  try {
    const response = await getWizardVehicles();
    vehicles = response.data.vehicles;
  } catch (error) {
    const notFound =
      error instanceof WheelsApiError && (error.status === 404 || error.status === 405);
    if (!notFound) throw error;
    source = "availability_bootstrap";
    vehicles = await bootstrapFromAvailability();
  }

  const rows = vehicles.map(wizardVehicleToRow).filter((row) => row.website_enabled);
  const upserted = await upsertWizardVehicles(rows);

  for (const row of rows) {
    const frontendId = frontendVehicleIdFromWizard(row.wizard_vehicle_id);
    await ensureVehicleMetadataStub({
      frontendVehicleId: frontendId,
      slug: slugifyVehicleName(row.display_name) || frontendId,
      displayName: row.display_name,
    });
  }

  return {
    source,
    upserted,
    message:
      source === "availability_bootstrap"
        ? "GET /api/public/vehicles returned 404; bootstrapped unique vehicles from /availability."
        : undefined,
  };
}
