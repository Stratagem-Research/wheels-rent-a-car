import { describe, expect, it } from "vitest";
import { mapWebsiteSyncToWizardPayload, REQUEST_STATE_SYNC_TYPE } from "../sync-status";

describe("wheels-public/sync-status", () => {
  it("maps confirmed state to Wizard approved", () => {
    const payload = mapWebsiteSyncToWizardPayload({
      lifecycleState: "confirmed",
      paymentStatus: "paid",
      paidAmount: 120,
    });
    expect(payload.status).toBe("approved");
    expect(payload.sync_type).toBe("payment_confirmed");
    expect(payload.payment_method).toBe("website_payment");
  });

  it("maps request-like states using sync_type fallback while keeping status compatible", () => {
    const payload = mapWebsiteSyncToWizardPayload({
      lifecycleState: "refund_requested",
      paymentStatus: "partially_paid",
      message: "Customer requested partial refund.",
    });
    expect(payload.status).toBe("pending_approval");
    expect(payload.sync_type).toBe(REQUEST_STATE_SYNC_TYPE.refund_requested);
  });

  it("maps payment_failed to sync_type", () => {
    const payload = mapWebsiteSyncToWizardPayload({
      lifecycleState: "pending",
      paymentStatus: "payment_failed",
    });
    expect(payload.sync_type).toBe("payment_failed");
  });

  it("includes parent_id when wizardBookingId provided", () => {
    const payload = mapWebsiteSyncToWizardPayload({
      lifecycleState: "confirmed",
      paymentStatus: "paid",
      wizardBookingId: 1202,
    });
    expect(payload.parent_id).toBe(1202);
  });
});
