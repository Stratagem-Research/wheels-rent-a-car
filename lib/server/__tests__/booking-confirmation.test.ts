import { beforeEach, describe, expect, it, vi } from "vitest";

const maybeSingle = vi.fn();
const insert = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          eq: () => ({
            limit: () => ({
              maybeSingle,
            }),
          }),
        }),
      }),
      insert,
    }),
  }),
}));

vi.mock("@/lib/server/notifications", () => ({
  enqueueNotification: vi.fn().mockResolvedValue(undefined),
}));

import { enqueueNotification } from "@/lib/server/notifications";
import {
  enqueueBookingConfirmationOnce,
  isApprovalStatus,
  isInventoryReleaseStatus,
} from "@/lib/server/booking-confirmation";

describe("booking-confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    maybeSingle.mockResolvedValue({ data: null, error: null });
    insert.mockResolvedValue({ error: null });
  });

  it("recognizes approval statuses", () => {
    expect(isApprovalStatus("approved")).toBe(true);
    expect(isApprovalStatus("confirmed")).toBe(true);
    expect(isApprovalStatus("pending_approval")).toBe(false);
  });

  it("recognizes inventory-release statuses", () => {
    expect(isInventoryReleaseStatus("cancelled")).toBe(true);
    expect(isInventoryReleaseStatus("canceled")).toBe(true);
    expect(isInventoryReleaseStatus("rejected")).toBe(true);
    expect(isInventoryReleaseStatus("approved")).toBe(false);
    expect(isInventoryReleaseStatus("pending_approval")).toBe(false);
  });

  it("enqueues confirmation when none exists", async () => {
    const result = await enqueueBookingConfirmationOnce({
      bookingReference: "WRC-1",
      recipient: "guest@example.com",
      vehicle: "Toyota",
    });
    expect(result.enqueued).toBe(true);
    expect(enqueueNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        template: "booking_confirmation",
        bookingReference: "WRC-1",
        recipient: "guest@example.com",
      }),
    );
  });

  it("is idempotent when confirmation already queued", async () => {
    maybeSingle.mockResolvedValueOnce({ data: { id: "existing" }, error: null });
    const result = await enqueueBookingConfirmationOnce({
      bookingReference: "WRC-1",
      recipient: "guest@example.com",
    });
    expect(result.enqueued).toBe(false);
    expect(enqueueNotification).not.toHaveBeenCalled();
  });
});
