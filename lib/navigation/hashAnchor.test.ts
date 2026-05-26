import { describe, expect, it } from "vitest";
import { hashFromSet, isHashInSet } from "./hashAnchor";

describe("hashAnchor", () => {
  const ids = new Set(["mileage", "f-b-1"]);

  it("validates ids against a set", () => {
    expect(isHashInSet("mileage", ids)).toBe(true);
    expect(isHashInSet("missing", ids)).toBe(false);
    expect(isHashInSet("", ids)).toBe(false);
  });

  it("reads the current hash when it matches the set", () => {
    window.location.hash = "#mileage";
    expect(hashFromSet(ids)).toBe("mileage");

    window.location.hash = "#unknown";
    expect(hashFromSet(ids)).toBe("");

    window.location.hash = "";
  });
});
