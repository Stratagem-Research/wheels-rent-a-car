import { describe, expect, it } from "vitest";
import { buildManageBookingUrl } from "../manage-booking-url";

describe("buildManageBookingUrl", () => {
  it("includes ref and normalized email query params", () => {
    const url = buildManageBookingUrl({
      ref: "WRC-260720-ZX3C",
      email: "Test@Example.com",
    });
    expect(url).toBe("/manage-booking?ref=WRC-260720-ZX3C&email=test%40example.com");
  });

  it("trims whitespace from inputs", () => {
    const url = buildManageBookingUrl({
      ref: " WRC-260720-ZX3C ",
      email: "  user@wheels.test  ",
    });
    expect(url).toBe("/manage-booking?ref=WRC-260720-ZX3C&email=user%40wheels.test");
  });
});
