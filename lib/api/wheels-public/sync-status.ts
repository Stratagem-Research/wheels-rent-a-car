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
  /** Wizard booking_id from create response; sent as parent_id when present. */
  wizardBookingId?: number;
}

export const REQUEST_STATE_SYNC_TYPE: Record<
  Extract<
    WebsiteBookingLifecycleState,
    "cancel_requested" | "change_requested" | "refund_requested"
  >,
  string
> = {
  cancel_requested: "cancel_request",
  change_requested: "change_request",
  refund_requested: "refund_request",
};

const WIZARD_STATUS_FALLBACK = "pending_approval";

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
        : input.lifecycleState === "cancelled"
          ? "canceled"
          : input.lifecycleState === "pending"
            ? "pending_approval"
            : input.lifecycleState;

  const syncType =
    requestSyncType ??
    resolveSyncType(input.lifecycleState, input.paymentStatus);

  return {
    ...(input.wizardBookingId != null ? { parent_id: input.wizardBookingId } : {}),
    status,
    payment_status: input.paymentStatus,
    paid_amount: input.paidAmount,
    payment_method: input.paymentMethod ?? "website_payment",
    payment_reference: input.paymentReference,
    payment_date: input.paymentDate,
    sync_type: syncType,
    message: input.message,
  };
}

function resolveSyncType(
  lifecycleState: WebsiteBookingLifecycleState,
  paymentStatus?: string,
): string {
  if (lifecycleState === "confirmed" && paymentStatus === "paid") {
    return "payment_confirmed";
  }
  if (paymentStatus === "payment_failed") return "payment_failed";
  if (paymentStatus === "payment_cancelled") return "payment_cancelled";
  if (paymentStatus === "refund_pending") return "refund_pending";
  if (paymentStatus === "refunded") return "refund_completed";
  if (lifecycleState === "cancelled") return "refund_completed";
  return "status_update";
}
