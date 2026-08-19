import { describe, expect, it } from "vitest";
import { toVehicleWithMetadata, type VehicleMetadataRow } from "@/lib/supabase/admin-repository";
import { metadataOnlyToVehicle } from "@/lib/server/wizard-catalog";
import { VEHICLES } from "@/lib/api/fixtures/vehicles";

const baseMeta = (overrides: Partial<VehicleMetadataRow>): VehicleMetadataRow => ({
  frontend_vehicle_id: VEHICLES[0]!.id,
  slug: "custom-slug",
  title: null,
  brand: null,
  model: null,
  tagline: null,
  description: null,
  features: [],
  badges: [],
  media: [],
  operational: {},
  updated_at: "2026-08-19T00:00:00.000Z",
  ...overrides,
});

describe("toVehicleWithMetadata", () => {
  it("applies website brand and model as the listing title", () => {
    const vehicle = VEHICLES[0]!;
    const result = toVehicleWithMetadata(vehicle, [
      baseMeta({
        title: "Kia Rio",
        brand: "Kia",
        model: "Rio",
      }),
    ]);
    expect(result.title).toBe("Kia Rio");
    expect(result.make).toBe("Kia");
    expect(result.model).toBe("Rio");
  });
});

describe("metadataOnlyToVehicle", () => {
  it("builds a public vehicle from a manual metadata row", () => {
    const vehicle = metadataOnlyToVehicle(
      baseMeta({
        frontend_vehicle_id: "manual-1",
        slug: "hyundai-accent",
        title: "Hyundai Accent",
        brand: "Hyundai",
        model: "Accent",
        media: [{ url: "/front.jpg", view: "front", alt: "Front", width: 100, height: 80 }],
      }),
    );
    expect(vehicle.id).toBe("manual-1");
    expect(vehicle.title).toBe("Hyundai Accent");
    expect(vehicle.make).toBe("Hyundai");
    expect(vehicle.model).toBe("Accent");
    expect(vehicle.images[0]?.url).toBe("/front.jpg");
  });

  it("applies Wizard-shaped operational specs", () => {
    const vehicle = metadataOnlyToVehicle(
      baseMeta({
        frontend_vehicle_id: "manual-2",
        slug: "nissan-micra",
        title: "NISSAN MICRA",
        brand: "NISSAN",
        model: "MICRA",
        operational: {
          year: 2018,
          number_of_seats: 4,
          number_of_doors: 5,
          gearbox: "automatic",
          fuel_type: "petrol",
          daily_rate: 20,
          category_name: "small",
          website_enabled: true,
        },
      }),
    );
    expect(vehicle.year).toBe(2018);
    expect(vehicle.seats).toBe(4);
    expect(vehicle.doors).toBe(5);
    expect(vehicle.dailyRateFromCents).toBe(2000);
    expect(vehicle.transmission).toBe("automatic");
    expect(vehicle.fuel).toBe("petrol");
  });

  it("keeps a Wizard frontend id on website-created rows", () => {
    const vehicle = metadataOnlyToVehicle(
      baseMeta({
        frontend_vehicle_id: "wiz-131",
        slug: "nissan-micra",
        title: "NISSAN MICRA",
        brand: "NISSAN",
        model: "MICRA",
      }),
    );
    expect(vehicle.id).toBe("wiz-131");
  });
});
