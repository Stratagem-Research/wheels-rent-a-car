import { describe, expect, it } from "vitest";
import { generateBookingRef, isValidBookingRef, BOOKING_REF_PATTERN } from "./ref";

describe("booking/ref", () => {
  it("accepts the documented format", () => {
    expect(isValidBookingRef("WRC-260520-9KQ4")).toBe(true);
  });

  it("rejects malformed refs", () => {
    expect(isValidBookingRef("wrc-260520-9KQ4")).toBe(false); // lowercase prefix
    expect(isValidBookingRef("WRC-26052-9KQ4")).toBe(false); // short date
    expect(isValidBookingRef("WRC-260520-9KQ")).toBe(false); // short suffix
    expect(isValidBookingRef("FOO-260520-9KQ4")).toBe(false);
  });

  it("generates refs that match the pattern", () => {
    const ref = generateBookingRef(new Date("2026-05-20T10:00:00.000Z"));
    expect(ref).toMatch(BOOKING_REF_PATTERN);
    expect(ref.startsWith("WRC-260520-")).toBe(true);
  });

  it("omits ambiguous characters (I, O, 0, 1) from the suffix", () => {
    for (let i = 0; i < 50; i++) {
      const suffix = generateBookingRef().split("-")[2]!;
      expect(suffix).not.toMatch(/[IO01]/);
    }
  });
});
