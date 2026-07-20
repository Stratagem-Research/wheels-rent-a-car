import { describe, expect, it } from "vitest";
import { isValidLebanonMobile } from "./phone";

describe("booking/phone", () => {
  it("accepts 8-digit Lebanese mobile numbers", () => {
    expect(isValidLebanonMobile("79084321")).toBe(true);
    expect(isValidLebanonMobile("89085410")).toBe(true);
  });

  it("rejects 7-digit numbers", () => {
    expect(isValidLebanonMobile("8908541")).toBe(false);
  });
});
