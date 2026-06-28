import type { Vehicle, VehicleCategory } from "@/types/domain";
import { frontendVehicleIdFromWizard, slugifyVehicleName } from "@/lib/booking/wizard-vehicle-id";
import {
  listVehicleMetadata,
  toVehicleWithMetadata,
  type VehicleMetadataRow,
} from "@/lib/supabase/admin-repository";
import type { WizardVehicleRow } from "@/lib/supabase/wizard-vehicles-repository";
import { listWebsiteEnabledWizardVehicles } from "@/lib/supabase/wizard-vehicles-repository";

const PLACEHOLDER_IMAGE = {
  url: "/images/Car Images/Untitled-design-2025-07-01T030112.627.png",
  alt: "Vehicle",
  width: 1080,
  height: 810,
} as const;

const CATEGORY_SET = new Set<string>([
  "economy",
  "compact",
  "sedan",
  "suv",
  "4x4",
  "7-seater",
  "luxury",
  "convertible",
]);

function normalizeCategory(raw: string | null): VehicleCategory {
  if (raw && CATEGORY_SET.has(raw)) return raw as VehicleCategory;
  return "economy";
}

export function wizardRowToVehicle(row: WizardVehicleRow, metadataRows: VehicleMetadataRow[]): Vehicle {
  const frontendId = frontendVehicleIdFromWizard(row.wizard_vehicle_id);
  const operational = row.operational ?? {};
  const seats =
    typeof operational.number_of_seats === "number" ? operational.number_of_seats : 4;
  const gearbox =
    operational.gearbox === "manual" ? "manual" : ("automatic" as const);
  const fuelRaw = operational.fuel_type;
  const fuel =
    fuelRaw === "diesel" || fuelRaw === "hybrid" || fuelRaw === "electric"
      ? fuelRaw
      : ("petrol" as const);

  const base: Vehicle = {
    id: frontendId,
    slug: slugifyVehicleName(row.display_name) || frontendId,
    make: row.brand ?? "Wheels",
    model: row.model ?? row.display_name,
    year: new Date().getFullYear(),
    category: normalizeCategory(row.category),
    transmission: gearbox,
    fuel,
    seats,
    doors: 4,
    bags: 3,
    features: [],
    images: [PLACEHOLDER_IMAGE],
    dailyRateFromCents: 2000,
    ownsInFleet: true,
  };

  return toVehicleWithMetadata(base, metadataRows);
}

export async function getSyncedPublicVehicles(): Promise<Vehicle[]> {
  const [rows, metadata] = await Promise.all([
    listWebsiteEnabledWizardVehicles(),
    listVehicleMetadata(),
  ]);
  if (rows.length === 0) return [];
  return rows.map((row) => wizardRowToVehicle(row, metadata));
}
