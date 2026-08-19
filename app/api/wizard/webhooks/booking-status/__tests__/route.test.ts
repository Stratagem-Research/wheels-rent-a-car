import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/booking-confirmation", () => ({
  isApprovalStatus: (status: string) =>
    status === "approved" || status === "confirmed",
  isInventoryReleaseStatus: (status: string) =>
    status === "cancelled" || status === "canceled" || status === "rejected",
  enqueueBookingConfirmationOnce: vi.fn(),
  buildBookingConfirmationPayload: vi.fn(),
}));

vi.mock("@/lib/supabase/vehicle-booking-holds-repository", () => ({
  deleteVehicleBookingHold: vi.fn(),
}));

vi.mock("@/lib/supabase/user-bookings-repository", () => ({
  findIndexedBookingByReference: vi.fn(),
}));

vi.mock("@/lib/server/payment-events", () => ({
  appendBookingState: vi.fn().mockResolvedValue(undefined),
}));

import { POST } from "@/app/api/wizard/webhooks/booking-status/route";
import {
  buildBookingConfirmationPayload,
  enqueueBookingConfirmationOnce,
} from "@/lib/server/booking-confirmation";
import { deleteVehicleBookingHold } from "@/lib/supabase/vehicle-booking-holds-repository";
import { findIndexedBookingByReference } from "@/lib/supabase/user-bookings-repository";

describe("POST /api/wizard/webhooks/booking-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WHEELS_INTERNAL_API_TOKEN = "test-token";
    vi.mocked(enqueueBookingConfirmationOnce).mockResolvedValue({ enqueued: true });
    vi.mocked(deleteVehicleBookingHold).mockResolvedValue(undefined);
    vi.mocked(findIndexedBookingByReference).mockResolvedValue(null);
    vi.mocked(buildBookingConfirmationPayload).mockResolvedValue({});
  });

  it("returns 401 without bearer", async () => {
    const res = await POST(
      new Request("http://localhost/api/wizard/webhooks/booking-status", {
        method: "POST",
        body: JSON.stringify({
          booking_reference: "WRC-1",
          status: "approved",
          customer_email: "a@b.com",
        }),
      }),
    );
    expect(res.status).toBe(401);
  });

  it("enqueues confirmation on approved", async () => {
    const res = await POST(
      new Request("http://localhost/api/wizard/webhooks/booking-status", {
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
        body: JSON.stringify({
          booking_reference: "WRC-1",
          status: "approved",
          customer_email: "a@b.com",
          vehicle: "Toyota",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { confirmationEnqueued: boolean };
    expect(json.confirmationEnqueued).toBe(true);
    expect(enqueueBookingConfirmationOnce).toHaveBeenCalled();
    expect(deleteVehicleBookingHold).not.toHaveBeenCalled();
  });

  it("does not enqueue for pending_approval", async () => {
    const res = await POST(
      new Request("http://localhost/api/wizard/webhooks/booking-status", {
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
        body: JSON.stringify({
          booking_reference: "WRC-1",
          status: "pending_approval",
          customer_email: "a@b.com",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { confirmationEnqueued: boolean; reason: string };
    expect(json.confirmationEnqueued).toBe(false);
    expect(json.reason).toBe("status_not_approval");
    expect(enqueueBookingConfirmationOnce).not.toHaveBeenCalled();
    expect(deleteVehicleBookingHold).not.toHaveBeenCalled();
  });

  it("releases the inventory hold on cancelled", async () => {
    const res = await POST(
      new Request("http://localhost/api/wizard/webhooks/booking-status", {
        method: "POST",
        headers: { Authorization: "Bearer test-token" },
        body: JSON.stringify({
          booking_reference: "WRC-1",
          status: "cancelled",
          customer_email: "a@b.com",
        }),
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { holdReleased: boolean; reason: string };
    expect(json.holdReleased).toBe(true);
    expect(json.reason).toBe("hold_released");
    expect(deleteVehicleBookingHold).toHaveBeenCalledWith("WRC-1");
    expect(enqueueBookingConfirmationOnce).not.toHaveBeenCalled();
  });
});
