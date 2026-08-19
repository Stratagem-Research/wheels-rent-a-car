import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFind = vi.fn();
const mockUpdateState = vi.fn();
const mockEnqueue = vi.fn();
const mockAppend = vi.fn();
const mockDeleteHold = vi.fn();

vi.mock("@/lib/supabase/user-bookings-repository", () => ({
  findIndexedBookingByReference: (...args: unknown[]) => mockFind(...args),
  updateStoredBookingState: (...args: unknown[]) => mockUpdateState(...args),
}));

const mockBuildPayload = vi.fn();

vi.mock("@/lib/server/booking-confirmation", () => ({
  enqueueBookingTemplateOnce: (...args: unknown[]) => mockEnqueue(...args),
  buildBookingConfirmationPayload: (...args: unknown[]) => mockBuildPayload(...args),
}));

vi.mock("@/lib/server/payment-events", () => ({
  appendBookingState: (...args: unknown[]) => mockAppend(...args),
}));

vi.mock("@/lib/supabase/vehicle-booking-holds-repository", () => ({
  deleteVehicleBookingHold: (...args: unknown[]) => mockDeleteHold(...args),
}));

import { emptyStoredBookingFields } from "@/lib/booking/stored-booking";
import { cancelManualBooking, confirmManualBooking } from "../manual-booking-ops";

const manualRow = {
  ...emptyStoredBookingFields(),
  bookingReference: "WRC-1",
  publicToken: null,
  customerEmail: "guest@example.com",
  createdAt: "2026-08-19T10:00:00.000Z",
  pickupAt: null,
  returnAt: null,
  frontendVehicleId: "manual-MICRA-1",
  wizardVehicleId: null,
  vehicleMake: "NISSAN",
  vehicleModel: "MICRA",
  driverEmail: "guest@example.com",
};

describe("manual-booking-ops", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFind.mockResolvedValue(manualRow);
    mockEnqueue.mockResolvedValue({ enqueued: true });
    mockBuildPayload.mockResolvedValue({ pickupDate: "1 January 2026" });
    mockAppend.mockResolvedValue(undefined);
    mockUpdateState.mockResolvedValue(undefined);
    mockDeleteHold.mockResolvedValue(undefined);
  });

  it("confirms with the same confirmation email as Wizard approval", async () => {
    await confirmManualBooking("WRC-1");
    expect(mockEnqueue).toHaveBeenCalledWith(
      "booking_confirmation",
      expect.objectContaining({
        bookingReference: "WRC-1",
        recipient: "guest@example.com",
        vehicle: "NISSAN MICRA",
      }),
    );
    expect(mockDeleteHold).not.toHaveBeenCalled();
  });

  it("cancels by releasing the hold and sending a cancelled email", async () => {
    await cancelManualBooking("WRC-1");
    expect(mockDeleteHold).toHaveBeenCalledWith("WRC-1");
    expect(mockEnqueue).toHaveBeenCalledWith(
      "booking_cancelled",
      expect.objectContaining({
        bookingReference: "WRC-1",
        recipient: "guest@example.com",
      }),
    );
  });

  it("rejects Wizard bookings", async () => {
    mockFind.mockResolvedValueOnce({
      ...manualRow,
      frontendVehicleId: "wiz-131",
      wizardVehicleId: 131,
    });
    await expect(confirmManualBooking("WRC-1")).rejects.toThrow(/website-only/);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });
});
