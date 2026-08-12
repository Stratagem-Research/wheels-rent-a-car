import { describe, expect, it } from "vitest";
import { isValidLebanonMobile, phoneValueFromStored } from "./phone";

describe("booking/phone", () => {
  it("accepts 8-digit Lebanese mobile numbers", () => {
    expect(isValidLebanonMobile("79084321")).toBe(true);
    expect(isValidLebanonMobile("89085410")).toBe(true);
  });

  it("rejects 7-digit numbers", () => {
    expect(isValidLebanonMobile("8908541")).toBe(false);
  });

  it("parses E.164 Lebanon numbers into phone parts", () => {
    expect(phoneValueFromStored("+96170123456")).toEqual({
      countryIso: "LB",
      national: "70123456",
    });
  });

  it("uses preferred country for national-only numbers", () => {
    expect(phoneValueFromStored("70123456", "LB")).toEqual({
      countryIso: "LB",
      national: "70123456",
    });
  });
});
