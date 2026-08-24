import {
  buildBookingConfirmationPayload,
  enqueueBookingTemplateOnce,
} from "@/lib/server/booking-confirmation";
import { appendBookingState } from "@/lib/server/payment-events";
import { isManualVehicleId, parseWizardVehicleId } from "@/lib/booking/wizard-vehicle-id";
import {
  findIndexedBookingByReference,
  updateStoredBookingState,
  type UserBookingRow,
} from "@/lib/supabase/user-bookings-repository";
import { deleteVehicleBookingHold } from "@/lib/supabase/vehicle-booking-holds-repository";

export function isManualIndexedBooking(row: {
  frontendVehicleId: string | null;
  wizardVehicleId: number | null;
}): boolean {
  if (isManualVehicleId(row.frontendVehicleId ?? "")) return true;
  if (row.wizardVehicleId != null) return false;
  return parseWizardVehicleId(row.frontendVehicleId ?? "") == null && Boolean(row.frontendVehicleId);
}

function recipientEmail(row: UserBookingRow): string {
  return (row.driverEmail ?? row.customerEmail ?? "").trim();
}

function vehicleLabel(row: UserBookingRow): string {
  return [row.vehicleMake, row.vehicleModel].filter(Boolean).join(" ");
}

async function requireManualRow(bookingReference: string): Promise<UserBookingRow> {
  const row = await findIndexedBookingByReference(bookingReference);
  if (!row || !isManualIndexedBooking(row)) {
    throw new Error("Confirm and cancel are only available for website-only bookings.");
  }
  if (!recipientEmail(row)) {
    throw new Error("This booking has no customer email.");
  }
  return row;
}

export async function confirmManualBooking(bookingReference: string): Promise<{ enqueued: boolean }> {
  const row = await requireManualRow(bookingReference);
  const recipient = recipientEmail(row);
  const richPayload = await buildBookingConfirmationPayload(row, recipient).catch(() => null);
  const result = await enqueueBookingTemplateOnce("booking_confirmation", {
    bookingReference: row.bookingReference,
    recipient,
    vehicle: vehicleLabel(row),
    payload: { state: "confirmed", source: "admin", ...richPayload },
  });
  await appendBookingState(row.bookingReference, "confirmed", { source: "admin" });
  await updateStoredBookingState(row.bookingReference, "confirmed");
  return result;
}

export async function cancelManualBooking(bookingReference: string): Promise<{ enqueued: boolean }> {
  const row = await requireManualRow(bookingReference);
  await deleteVehicleBookingHold(row.bookingReference);
  await updateStoredBookingState(row.bookingReference, "cancelled");
  await appendBookingState(row.bookingReference, "cancelled", { source: "admin" });
  return enqueueBookingTemplateOnce("booking_cancelled", {
    bookingReference: row.bookingReference,
    recipient: recipientEmail(row),
    vehicle: vehicleLabel(row),
    payload: { state: "cancelled", source: "admin" },
  });
}
