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
  getBookingByReferenceEmail: vi.fn(),
  synthesizeBookingRef: vi.fn(() => "WRC-260819-MAN1"),
  catalogVehicleToAvailable: vi.fn((vehicle: { id: string }) => ({ vehicle, rates: [] })),
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
  getPublicBranches: vi.fn().mockResolvedValue([]),
  getPublicDeliveryPricing: vi
    .fn()
    .mockResolvedValue({ baseFeeCents: 1000, freeRadiusKm: 5, perKmCents: 150 }),
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
  getIndexedGuestBooking: vi.fn().mockResolvedValue(null),
  findIndexedBookingByRefAndEmail: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/supabase/additional-drivers-repository", () => ({
  getAdditionalDriverStoragePaths: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/supabase/booking-document-scans", () => ({
  withSignedAdditionalDriverScans: async <T>(booking: T) => booking,
}));

const mockAddVehicleBookingHold = vi.fn();
const mockIsVehicleHeld = vi.fn();
vi.mock("@/lib/supabase/vehicle-booking-holds-repository", () => ({
  addVehicleBookingHold: (...args: unknown[]) => mockAddVehicleBookingHold(...args),
  isVehicleHeld: (...args: unknown[]) => mockIsVehicleHeld(...args),
  listHeldFrontendVehicleIds: vi.fn().mockResolvedValue(new Set()),
}));

const mockEnqueueNotification = vi.fn().mockResolvedValue(undefined);
vi.mock("@/lib/server/notifications", () => ({
  enqueueNotification: (...args: unknown[]) => mockEnqueueNotification(...args),
}));

import { getBookingByReferenceEmail } from "@/lib/api/wheels-public";
import { emptyStoredBookingFields } from "@/lib/booking/stored-booking";
import {
  addUserBooking,
  findIndexedBookingByRefAndEmail,
  indexGuestBooking,
} from "@/lib/supabase/user-bookings-repository";
import { getPublicVehicles } from "@/lib/server/public-content";
import {
  handleBookingLookup,
  handleBookingSubmit,
  handleVerifyVehicleAvailability,
  VehicleUnavailableError,
} from "../booking-service";

const mockAddUserBooking = vi.mocked(addUserBooking);
const mockFindIndexedBookingByRefAndEmail = vi.mocked(findIndexedBookingByRefAndEmail);
const mockGetBookingByReferenceEmail = vi.mocked(getBookingByReferenceEmail);

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
    mockIsVehicleHeld.mockResolvedValue(false);
    mockAddVehicleBookingHold.mockResolvedValue(undefined);
    mockFindIndexedBookingByRefAndEmail.mockResolvedValue(null);
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
    expect(mockAddVehicleBookingHold).toHaveBeenCalledWith({
      bookingReference: "WRC-260721-TEST",
      wizardVehicleId: 131,
      frontendVehicleId: "wiz-131",
      pickupAt: "2026-07-21T10:00",
      returnAt: "2026-07-24T10:00",
    });
    expect(indexGuestBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "test@example.com",
        bookingReference: "WRC-260721-TEST",
        publicToken: "tok",
        wizardBookingId: 1,
        pickupAt: "2026-07-21T10:00",
        returnAt: "2026-07-24T10:00",
        frontendVehicleId: "wiz-131",
        wizardVehicleId: 131,
        totalCents: 10000,
      }),
    );
    expect(addUserBooking).not.toHaveBeenCalled();
    expect(mockEnqueueNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        bookingReference: "WRC-260721-TEST",
        channel: "email",
        template: "booking_request_received",
        recipient: "test@example.com",
      }),
    );
  });

  it("links booking to user when userId is provided", async () => {
    await handleBookingSubmit({ draft: completeDraft() }, { userId: "user-abc" });
    expect(addUserBooking).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-abc",
        bookingReference: "WRC-260721-TEST",
        publicToken: "tok",
        wizardBookingId: 1,
        customerEmail: "test@example.com",
        pickupAt: "2026-07-21T10:00",
        returnAt: "2026-07-24T10:00",
        frontendVehicleId: "wiz-131",
        wizardVehicleId: 131,
        totalCents: 10000,
      }),
    );
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

  it("rejects submit when the vehicle already has a website hold", async () => {
    mockIsVehicleHeld.mockResolvedValue(true);

    await expect(handleBookingSubmit({ draft: completeDraft() })).rejects.toBeInstanceOf(
      VehicleUnavailableError,
    );
    expect(mockCreateBookingRequest).not.toHaveBeenCalled();
    expect(mockAddVehicleBookingHold).not.toHaveBeenCalled();
  });

  it("still returns booking when the vehicle hold write fails", async () => {
    mockAddVehicleBookingHold.mockRejectedValueOnce(new Error("holds table missing"));
    const result = await handleBookingSubmit({ draft: completeDraft() });
    expect(result.booking.ref).toBe("WRC-260721-TEST");
    expect(mockCreateBookingRequest).toHaveBeenCalled();
  });

  it("does not query wizard map for manual vehicles", async () => {
    vi.mocked(getPublicVehicles).mockResolvedValueOnce([
      { id: "manual-abc", slug: "test", make: "T", model: "T", dailyRateFromCents: 2500 },
    ]);
    const result = await handleVerifyVehicleAvailability({
      vehicleId: "manual-abc",
      pickup: completeDraft().pickup,
      return: completeDraft().return,
    });
    expect(result).toEqual({ available: true });
    expect(mockListVehicleWizardMap).not.toHaveBeenCalled();
    expect(mockGetVehicleAvailability).not.toHaveBeenCalled();
  });

  it("submits manual website-only vehicles without calling Wizard", async () => {
    vi.mocked(getPublicVehicles).mockResolvedValueOnce([
      { id: "manual-abc", slug: "test", make: "T", model: "T", dailyRateFromCents: 2500 },
    ]);
    const draft = completeDraft();
    draft.vehicle = { vehicleId: "manual-abc", rate: { type: "best-price", mileage: "capped-200km" } };
    const result = await handleBookingSubmit({ draft });
    expect(result.booking.ref).toBe("WRC-260819-MAN1");
    expect(mockListVehicleWizardMap).not.toHaveBeenCalled();
    expect(mockCreateBookingRequest).not.toHaveBeenCalled();
    expect(mockGetVehicleAvailability).not.toHaveBeenCalled();
    expect(mockAddVehicleBookingHold).toHaveBeenCalledWith(
      expect.objectContaining({ frontendVehicleId: "manual-abc", bookingReference: "WRC-260819-MAN1" }),
    );
  });

  it("looks up manual bookings from the guest index without Wizard", async () => {
    mockFindIndexedBookingByRefAndEmail.mockResolvedValueOnce({
      ...emptyStoredBookingFields(),
      bookingReference: "WRC-260819-MAN1",
      publicToken: null,
      customerEmail: "test@example.com",
      createdAt: "2026-08-19T10:00:00.000Z",
      pickupAt: "2026-07-21T10:00:00.000Z",
      returnAt: "2026-07-24T10:00:00.000Z",
      frontendVehicleId: "manual-abc",
      wizardVehicleId: null,
      vehicleMake: "T",
      vehicleModel: "T",
      totalCents: 10000,
      paymentMethod: "cash",
    });
    const booking = await handleBookingLookup({
      ref: "WRC-260819-MAN1",
      email: "test@example.com",
    });
    expect(booking.ref).toBe("WRC-260819-MAN1");
    expect(booking.vehicle.vehicleId).toBe("manual-abc");
    expect(booking.vehicleSnapshot.make).toBe("T");
  });

  it("overlays stored payment method onto Wizard lookup", async () => {
    mockFindIndexedBookingByRefAndEmail.mockResolvedValueOnce({
      ...emptyStoredBookingFields(),
      bookingReference: "WRC-260721-TEST",
      publicToken: "tok",
      customerEmail: "test@example.com",
      createdAt: "2026-07-21T10:00:00.000Z",
      pickupAt: "2026-07-21T10:00:00.000Z",
      returnAt: "2026-07-24T10:00:00.000Z",
      frontendVehicleId: "wiz-131",
      wizardVehicleId: 131,
      paymentMethod: "omt",
      extras: [],
      totalCents: 0,
    });
    mockGetBookingByReferenceEmail.mockResolvedValueOnce({
      data: {
        reference: "WRC-260721-TEST",
        status: "pending",
        start_date_time: "2026-07-21 10:00",
        end_date_time: "2026-07-24 10:00",
        customer: {
          name: "Test User",
          email: "test@example.com",
          phone_number: "+96170000000",
        },
        vehicle: { id: 131, name: "NISSAN MICRA" },
        amount: 100,
      },
    } as never);
    const booking = await handleBookingLookup({
      ref: "WRC-260721-TEST",
      email: "test@example.com",
    });
    expect(booking.paymentMethod).toBe("omt");
  });

  it("books a sibling unit when the selected Wizard id is unknown", async () => {
    vi.mocked(getPublicVehicles).mockResolvedValueOnce([
      { id: "wiz-131", slug: "micra", make: "NISSAN", model: "MICRA", dailyRateFromCents: 2000 },
      { id: "wiz-132", slug: "micra", make: "NISSAN", model: "MICRA", dailyRateFromCents: 2000 },
    ]);
    mockGetVehicleAvailability.mockImplementation(async (id: unknown) => {
      if (id === 131) {
        throw Object.assign(new Error("not found"), { status: 400 });
      }
      return { data: { is_available: true, id } };
    });
    await handleBookingSubmit({ draft: completeDraft() });
    expect(mockAddVehicleBookingHold).toHaveBeenCalledWith(
      expect.objectContaining({ wizardVehicleId: 132, frontendVehicleId: "wiz-132" }),
    );
  });

  it("still submits when availability/{id} returns 400", async () => {
    mockGetVehicleAvailability.mockRejectedValue(Object.assign(new Error("not found"), { status: 400 }));
    const result = await handleBookingSubmit({ draft: completeDraft() });
    expect(result.booking.ref).toBe("WRC-260721-TEST");
    expect(mockCreateBookingRequest).toHaveBeenCalled();
  });
});
