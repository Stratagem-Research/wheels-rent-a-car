import { describe, expect, it, vi, beforeEach } from "vitest";
import type { BookingDraft } from "@/types/domain";

const mockGetAvailability = vi.fn();
const mockGetVehicleAvailability = vi.fn();
const mockCreateBookingRequest = vi.fn();
const mockListVehicleWizardMap = vi.fn();

vi.mock("@/lib/api/wheels-public", () => ({
  getAvailability: (...args: unknown[]) => mockGetAvailability(...args),
  getVehicleAvailability: (...args: unknown[]) => mockGetVehicleAvailability(...args),
  createBookingRequest: (...args: unknown[]) => mockCreateBookingRequest(...args),
  fromBookingDraft: vi.fn((draft, opts) => ({
    vehicle_id: opts.resolveVehicleId(draft.vehicle!.vehicleId),
    start_date_time: "2026-07-21 10:00",
    end_date_time: "2026-07-24 10:00",
    pickup_address: 1,
    drop_off_address: 1,
    payment_method: "cash_on_pickup",
    payment_status: "unpaid",
    customer: {
      first_name: draft.driver!.firstName,
      last_name: draft.driver!.lastName,
      email: draft.driver!.email,
      phone_number: draft.driver!.phone,
    },
  })),
  toInternalBooking: vi.fn((data, opts) => ({
    ref: data.reference,
    state: "confirmed",
    price: { totalCents: 10000 },
    pickup: opts.draft.pickup,
    return: opts.draft.return,
  })),
  VehicleUnavailableError: class VehicleUnavailableError extends Error {
    status = 409;
    constructor(
      public url: string,
      public body: unknown,
    ) {
      super("Vehicle is not available for this period.");
      this.name = "VehicleUnavailableError";
    }
  },
}));

vi.mock("@/lib/supabase/catalog-repository", () => ({
  listAddOnsFromDb: vi.fn().mockResolvedValue([]),
  listProtectionTiersFromDb: vi.fn().mockResolvedValue([]),
}));

vi.mock("@/lib/server/public-content", () => ({
  getPublicVehicles: vi
    .fn()
    .mockResolvedValue([
      { id: "wiz-131", slug: "test", make: "T", model: "T", dailyRateFromCents: 2500 },
    ]),
}));

vi.mock("@/lib/supabase/admin-repository", () => ({
  listVehicleWizardMap: (...args: unknown[]) => mockListVehicleWizardMap(...args),
}));

vi.mock("@/lib/supabase/promo-codes-repository", () => ({
  findPromoCode: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/server/wizard-sync", () => ({
  dispatchWizardSync: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/server/payment-events", () => ({
  appendBookingState: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/supabase/user-bookings-repository", () => ({
  addUserBooking: vi.fn().mockResolvedValue(undefined),
  indexGuestBooking: vi.fn().mockResolvedValue(undefined),
}));

const mockEnqueueNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/server/notifications", () => ({
  enqueueNotification: (...args: unknown[]) => mockEnqueueNotification(...args),
}));

import { addUserBooking, indexGuestBooking } from "@/lib/supabase/user-bookings-repository";
import { handleBookingSubmit, VehicleUnavailableError } from "../booking-service";

const mockAddUserBooking = vi.mocked(addUserBooking);

function completeDraft(): BookingDraft {
  return {
    pickup: { type: "branch", locationId: "br-hazmieh", datetime: "2026-07-21T10:00" },
    return: { locationId: "br-hazmieh", datetime: "2026-07-24T10:00" },
    vehicle: { vehicleId: "wiz-131", rate: { type: "best-price", mileage: "capped-200km" } },
    extras: [],
    protectionTierId: "pt-basic",
    driver: {
      firstName: "Test",
      lastName: "User",
      email: "test@example.com",
      phone: "+96170000000",
      dob: "1990-01-01",
      licenceNumber: "X",
      licenceIssue: "2020-01-01",
      licenceExpiry: "2030-01-01",
      country: "LB",
    },
    paymentMethod: "cash",
    marketingConsent: false,
    whatsappOptIn: false,
  };
}

describe("booking-service handleBookingSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockListVehicleWizardMap.mockResolvedValue([]);
    mockGetVehicleAvailability.mockResolvedValue({
      data: { is_available: true, id: 131 },
    });
    mockCreateBookingRequest.mockResolvedValue({
      data: {
        reference: "WRC-260721-TEST",
        public_token: "tok",
        booking_id: 1,
        amount: 100,
        status: "pending_approval",
        payment_status: "unpaid",
      },
    });
  });

  it("pre-submit availability guard rejects unavailable vehicles", async () => {
    mockGetVehicleAvailability.mockResolvedValue({
      data: { is_available: false, id: 131, unavailable_reason: "booked" },
    });

    await expect(handleBookingSubmit({ draft: completeDraft() })).rejects.toBeInstanceOf(
      VehicleUnavailableError,
    );
    expect(mockCreateBookingRequest).not.toHaveBeenCalled();
    expect(mockGetAvailability).not.toHaveBeenCalled();
  });

  it("submits when pre-check passes", async () => {
    const result = await handleBookingSubmit({ draft: completeDraft() });
    expect(result.booking.ref).toBe("WRC-260721-TEST");
    expect(mockGetVehicleAvailability).toHaveBeenCalledWith(131, {
      startDateTime: "2026-07-21 10:00",
      endDateTime: "2026-07-24 10:00",
    });
    expect(mockCreateBookingRequest).toHaveBeenCalled();
    expect(indexGuestBooking).toHaveBeenCalledWith({
      email: "test@example.com",
      bookingReference: "WRC-260721-TEST",
      publicToken: "tok",
      wizardBookingId: 1,
    });
    expect(addUserBooking).not.toHaveBeenCalled();
    expect(mockEnqueueNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingReference: "WRC-260721-TEST",
        channel: "email",
        template: "booking_confirmation",
        recipient: "test@example.com",
      }),
    );
  });

  it("links booking to user when userId is provided", async () => {
    await handleBookingSubmit({ draft: completeDraft() }, { userId: "user-abc" });
    expect(addUserBooking).toHaveBeenCalledWith({
      userId: "user-abc",
      bookingReference: "WRC-260721-TEST",
      publicToken: "tok",
      wizardBookingId: 1,
      customerEmail: "test@example.com",
    });
    expect(indexGuestBooking).toHaveBeenCalled();
  });

  it("still returns booking when user_bookings link fails (logged-in user)", async () => {
    mockAddUserBooking.mockRejectedValueOnce(
      Object.assign(new Error("wizard_booking_id column missing"), { code: "PGRST204" }),
    );
    const result = await handleBookingSubmit({ draft: completeDraft() }, { userId: "user-123" });
    expect(result.booking.ref).toBe("WRC-260721-TEST");
    expect(mockCreateBookingRequest).toHaveBeenCalled();
  });
});
