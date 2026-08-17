import { describe, expect, it } from "vitest";
import { isValidLebanonMobile, phoneValueFromStored, toE164 } from "./phone";

describe("booking/phone", () => {
  it("accepts 8-digit Lebanese mobile numbers", () => {
    expect(isValidLebanonMobile("79084321")).toBe(true);
    expect(isValidLebanonMobile("89085410")).toBe(true);
  });

  it("accepts 03 numbers without the local trunk 0 (+961 format)", () => {
    expect(isValidLebanonMobile("3123456")).toBe(true);
    expect(isValidLebanonMobile("03123456")).toBe(true);
  });

  it("rejects 7-digit numbers that are not the 03 prefix", () => {
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

  it("formats Lebanon E.164 without a trunk 0", () => {
    expect(toE164("LB", "70123456")).toBe("+96170123456");
    expect(toE164("LB", "3123456")).toBe("+9613123456");
    expect(toE164("LB", "03123456")).toBe("+9613123456");
    expect(toE164("LB", "070123456")).toBe("+96170123456");
  });
});
