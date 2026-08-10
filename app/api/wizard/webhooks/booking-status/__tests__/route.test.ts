import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/booking-confirmation", () => ({
  isApprovalStatus: (status: string) =>
    status === "approved" || status === "confirmed",
  enqueueBookingConfirmationOnce: vi.fn(),
}));

import { POST } from "@/app/api/wizard/webhooks/booking-status/route";
import { enqueueBookingConfirmationOnce } from "@/lib/server/booking-confirmation";

describe("POST /api/wizard/webhooks/booking-status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.WHEELS_INTERNAL_API_TOKEN = "test-token";
    vi.mocked(enqueueBookingConfirmationOnce).mockResolvedValue({ enqueued: true });
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
  });
});
