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
    expect(payload.sync_type).toBe("status_update");
  });

  it("maps request-like states using sync_type fallback while keeping status compatible", () => {
    const payload = mapWebsiteSyncToWizardPayload({
      lifecycleState: "refund_requested",
      paymentStatus: "partially_paid",
      message: "Customer requested partial refund.",
    });
    expect(payload.status).toBe("pending");
    expect(payload.sync_type).toBe(REQUEST_STATE_SYNC_TYPE.refund_requested);
  });
});
