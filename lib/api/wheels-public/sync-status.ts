import type { SyncStatusRequest } from "./schemas";

export type WebsiteBookingLifecycleState =
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled"
  | "cancel_requested"
  | "change_requested"
  | "refund_requested";

export interface WebsiteToWizardSyncInput {
  lifecycleState: WebsiteBookingLifecycleState;
  paymentStatus?: string;
  paidAmount?: number;
  paymentMethod?: string;
  paymentReference?: string;
  paymentDate?: string;
  message?: string;
}

export const REQUEST_STATE_SYNC_TYPE: Record<
  Extract<WebsiteBookingLifecycleState, "cancel_requested" | "change_requested" | "refund_requested">,
  string
> = {
  cancel_requested: "cancel_request",
  change_requested: "change_request",
  refund_requested: "refund_request",
};

const WIZARD_STATUS_FALLBACK = "pending";

/**
 * Wizard currently cannot store request-like statuses directly.
 * We keep status in a supported value and encode workflow in sync_type.
 */
export function mapWebsiteSyncToWizardPayload(input: WebsiteToWizardSyncInput): SyncStatusRequest {
  const requestSyncType =
    input.lifecycleState === "cancel_requested" ||
    input.lifecycleState === "change_requested" ||
    input.lifecycleState === "refund_requested"
      ? REQUEST_STATE_SYNC_TYPE[input.lifecycleState]
      : undefined;

  const status =
    requestSyncType != null
      ? WIZARD_STATUS_FALLBACK
      : input.lifecycleState === "confirmed"
        ? "approved"
        : input.lifecycleState;

  return {
    status,
    payment_status: input.paymentStatus,
    paid_amount: input.paidAmount,
    payment_method: input.paymentMethod,
    payment_reference: input.paymentReference,
    payment_date: input.paymentDate,
    sync_type: requestSyncType ?? "status_update",
    message: input.message,
  };
}
