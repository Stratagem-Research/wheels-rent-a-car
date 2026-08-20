import { describe, expect, it } from "vitest";
import { VEHICLES } from "@/lib/api/fixtures/vehicles";
import {
  findSelectedFleetVehicle,
  groupFleetModels,
  groupVehiclesByModel,
  modelGroupKey,
} from "./group-by-model";
import type { Vehicle } from "@/types/domain";

describe("groupVehiclesByModel", () => {
  it("keeps unique models as-is", () => {
    expect(groupVehiclesByModel(VEHICLES)).toHaveLength(VEHICLES.length);
  });

  it("merges units that share make and model", () => {
    const yaris = VEHICLES[0]!;
    const duplicate: Vehicle = {
      ...yaris,
      id: "veh-yaris-2",
      slug: "toyota-yaris-2",
      dailyRateFromCents: yaris.dailyRateFromCents + 500,
      images: [],
    };
    const grouped = groupVehiclesByModel([yaris, duplicate, VEHICLES[1]!]);
    expect(grouped).toHaveLength(2);
    expect(grouped[0]?.id).toBe(yaris.id);
    expect(groupFleetModels([yaris, duplicate, VEHICLES[1]!])[0]?.unitCount).toBe(2);
  });

  it("prefers the cheaper unit as the representative", () => {
    const yaris = VEHICLES[0]!;
    const cheaper: Vehicle = {
      ...yaris,
      id: "veh-yaris-cheap",
      slug: "toyota-yaris-cheap",
      dailyRateFromCents: yaris.dailyRateFromCents - 100,
    };
    const grouped = groupVehiclesByModel([yaris, cheaper]);
    expect(grouped).toHaveLength(1);
    expect(grouped[0]?.id).toBe(cheaper.id);
  });

  it("does not merge vehicles that lack a model name", () => {
    const a: Vehicle = { ...VEHICLES[0]!, id: "a", model: "" };
    const b: Vehicle = { ...VEHICLES[0]!, id: "b", model: "" };
    expect(groupVehiclesByModel([a, b])).toHaveLength(2);
  });

  it("selects by unique id when slugs collide", () => {
    const a: Vehicle = { ...VEHICLES[0]!, id: "wiz-1", slug: "rio" };
    const b: Vehicle = { ...VEHICLES[1]!, id: "wiz-2", slug: "rio" };
    expect(findSelectedFleetVehicle([a, b], "wiz-2")?.id).toBe("wiz-2");
    expect(findSelectedFleetVehicle([a, b], "rio")).toBeNull();
  });

  it("builds a stable make+model key", () => {
    expect(modelGroupKey("Toyota", "Yaris", "x")).toBe("toyota|yaris");
    expect(modelGroupKey("Toyota", "", "veh-1")).toBe("veh-1");
  });
});
