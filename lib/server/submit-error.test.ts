import { describe, expect, it } from "vitest";
import { WheelsApiError, VehicleUnavailableError } from "@/lib/api/wheels-public";
import { mapSubmitError } from "./submit-error";

describe("mapSubmitError", () => {
  it("maps vehicle unavailable to 409 with reason", () => {
    const mapped = mapSubmitError(
      new VehicleUnavailableError("test", { unavailable_reason: "booked" }),
    );
    expect(mapped.status).toBe(409);
    expect(mapped.reason).toBe("booked");
  });

  it("extracts Wizard message from ApiError body", () => {
    const mapped = mapSubmitError(
      new WheelsApiError(422, "https://x/booking-request", {
        success: false,
        message: "Invalid phone number format.",
      }),
    );
    expect(mapped.status).toBe(400);
    expect(mapped.message).toBe("Invalid phone number format.");
  });

  it("falls back when err is not an Error instance", () => {
    const mapped = mapSubmitError({ code: "weird" });
    expect(mapped.status).toBe(502);
    expect(mapped.message).toBe("Booking submission failed.");
  });
});
