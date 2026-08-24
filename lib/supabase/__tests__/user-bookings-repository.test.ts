import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFrom = vi.fn();
const mockUpsert = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: mockFrom,
  }),
}));

import {
  claimGuestBookingsForUser,
  indexGuestBooking,
} from "../user-bookings-repository";

describe("user-bookings-repository guest index", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpsert.mockReturnValue({ error: null });
    mockEq.mockReturnValue({
      select: mockSelect,
    });
    mockSelect.mockReturnValue({
      eq: mockEq,
    });
  });

  it("indexGuestBooking upserts normalized email", async () => {
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await indexGuestBooking({
      email: " Guest@Example.com ",
      bookingReference: "WRC-260720-ABCD",
      publicToken: "tok",
      wizardBookingId: 99,
    });

    expect(mockFrom).toHaveBeenCalledWith("guest_booking_index");
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        email: "guest@example.com",
        booking_reference: "WRC-260720-ABCD",
        public_token: "tok",
        wizard_booking_id: 99,
      },
      { onConflict: "email,booking_reference", ignoreDuplicates: false },
    );
  });

  it("indexGuestBooking keeps vehicle, dates, and price when licence path columns are missing", async () => {
    mockUpsert
      .mockReturnValueOnce({
        error: {
          code: "42703",
          message: "column guest_booking_index.driver_licence_front_path does not exist",
        },
      })
      .mockReturnValueOnce({ error: null });
    mockFrom.mockReturnValue({ upsert: mockUpsert });

    await indexGuestBooking({
      email: "guest@example.com",
      bookingReference: "WRC-260824-P7MQ",
      pickupAt: "2026-08-26T10:00:00.000Z",
      returnAt: "2026-08-28T10:00:00.000Z",
      vehicleMake: "Kia",
      vehicleModel: "Picanto",
      totalCents: 13986,
      driverLicenceFrontPath: "guest-checkout/abc/front.jpg",
    });

    expect(mockUpsert).toHaveBeenCalledTimes(2);
    const retryPayload = mockUpsert.mock.calls[1]?.[0] as Record<string, unknown>;
    expect(retryPayload.vehicle_make).toBe("Kia");
    expect(retryPayload.total_cents).toBe(13986);
    expect(retryPayload.pickup_at).toBeTruthy();
    expect(retryPayload).not.toHaveProperty("driver_licence_front_path");
  });

  it("claimGuestBookingsForUser upserts each indexed row into user_bookings", async () => {
    const userBookingsUpsert = vi.fn().mockReturnValue({ error: null });
    mockFrom.mockImplementation((table: string) => {
      if (table === "guest_booking_index") {
        return {
          select: () => ({
            eq: () =>
              Promise.resolve({
                data: [
                  {
                    booking_reference: "WRC-260720-ABCD",
                    public_token: "tok1",
                    wizard_booking_id: 1,
                  },
                  {
                    booking_reference: "WRC-260721-EFGH",
                    public_token: "tok2",
                    wizard_booking_id: 2,
                  },
                ],
                error: null,
              }),
          }),
        };
      }
      if (table === "user_bookings") {
        return {
          select: () => ({
            in: () => Promise.resolve({ data: [], error: null }),
          }),
          upsert: userBookingsUpsert,
        };
      }
      throw new Error(`unexpected table ${table}`);
    });

    const claimed = await claimGuestBookingsForUser("user-123", "guest@example.com");
    expect(claimed).toBe(2);
    expect(userBookingsUpsert).toHaveBeenCalledTimes(2);
    expect(userBookingsUpsert).toHaveBeenCalledWith(
      {
        user_id: "user-123",
        booking_reference: "WRC-260720-ABCD",
        public_token: "tok1",
        wizard_booking_id: 1,
        customer_email: "guest@example.com",
      },
      { onConflict: "user_id,booking_reference", ignoreDuplicates: false },
    );
  });

  it("claimGuestBookingsForUser returns 0 when no indexed rows", async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    });

    const claimed = await claimGuestBookingsForUser("user-123", "nobody@example.com");
    expect(claimed).toBe(0);
  });
});
