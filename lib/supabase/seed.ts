import {
  CORPORATE_TIERS,
  FAQS,
  ITINERARIES,
  TRIPS,
} from "@/lib/supabase/seed-data";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  replaceCorporateTiersInDb,
  replaceFaqsInDb,
  replaceItinerariesInDb,
  replaceTripsInDb,
} from "@/lib/supabase/cms-repository";

/** Known Wizard mapping from live API tests (yaris). Extend as IDs are confirmed. */
const WIZARD_VEHICLE_MAP: Record<string, number> = {
  "veh-yaris": 131,
};

export type SeedResource =
  | "trips"
  | "itineraries"
  | "faqs"
  | "corporate"
  | "vehicle_metadata"
  | "vehicle_wizard_map"
  | "all";

export type SeedResult = {
  resource: SeedResource;
  count: number;
};

export async function seedWebsiteData(
  resources: SeedResource[] = ["all"],
): Promise<SeedResult[]> {
  const targets = resources.includes("all")
    ? ([
        "trips",
        "itineraries",
        "faqs",
        "corporate",
        "vehicle_metadata",
        "vehicle_wizard_map",
      ] as SeedResource[])
    : resources;

  const results: SeedResult[] = [];

  if (targets.includes("trips")) {
    await replaceTripsInDb(TRIPS);
    results.push({ resource: "trips", count: TRIPS.length });
  }

  if (targets.includes("itineraries")) {
    await replaceItinerariesInDb(ITINERARIES);
    results.push({ resource: "itineraries", count: ITINERARIES.length });
  }

  if (targets.includes("faqs")) {
    await replaceFaqsInDb(FAQS);
    const questionCount = FAQS.reduce((sum, g) => sum + g.entries.length, 0);
    results.push({ resource: "faqs", count: questionCount });
  }

  if (targets.includes("corporate")) {
    await replaceCorporateTiersInDb(CORPORATE_TIERS);
    results.push({ resource: "corporate", count: CORPORATE_TIERS.length });
  }

  if (targets.includes("vehicle_metadata")) {
    const supabase = getSupabaseAdminClient();
    const rows = VEHICLES.map((vehicle) => ({
      frontend_vehicle_id: vehicle.id,
      slug: vehicle.slug,
      tagline: vehicle.tagline ?? null,
      description: vehicle.description ?? null,
      features: vehicle.features,
      badges: vehicle.badge ? [vehicle.badge] : [],
      media: vehicle.images.map((image) => ({
        url: image.url,
        alt: image.alt,
        width: image.width,
        height: image.height,
      })),
      updated_at: new Date().toISOString(),
    }));
    const { error } = await supabase
      .from("vehicle_metadata")
      .upsert(rows, { onConflict: "frontend_vehicle_id" });
    if (error) throw new Error(error.message);
    results.push({ resource: "vehicle_metadata", count: rows.length });
  }

  if (targets.includes("vehicle_wizard_map")) {
    const supabase = getSupabaseAdminClient();
    const rows = Object.entries(WIZARD_VEHICLE_MAP).map(([frontendId, wizardId]) => ({
      frontend_vehicle_id: frontendId,
      wizard_vehicle_id: wizardId,
    }));
    if (rows.length > 0) {
      const { error } = await supabase
        .from("vehicle_wizard_map")
        .upsert(rows, { onConflict: "frontend_vehicle_id" });
      if (error) throw new Error(error.message);
    }
    results.push({ resource: "vehicle_wizard_map", count: rows.length });
  }

  return results;
}
