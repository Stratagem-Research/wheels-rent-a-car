import type { BookingPickup, BookingReturn } from "@/types/domain";

/**
 * Wizard's `/booking-request` expects a numeric address id for
 * `pickup_address`/`drop_off_address`, not our internal branch slugs.
 * Wheels has two physical pickup points; Wizard assigned them ids 1 and 2.
 */
const WIZARD_ADDRESS_ID: Readonly<Record<string, number>> = {
  "br-hazmieh": 1,
  "br-bey-airport": 2,
};

export class UnmappedWizardAddressError extends Error {
  constructor(public readonly locationId: string) {
    super(`No Wizard address id for location ${locationId}`);
    this.name = "UnmappedWizardAddressError";
  }
}

/** Resolve a Wizard numeric address id from our branch locationId, if known. */
export function resolveWizardAddressId(locationId: string | undefined): number | undefined {
  if (!locationId) return undefined;
  return WIZARD_ADDRESS_ID[locationId];
}

/**
 * Resolve pickup/drop-off for the booking-request payload.
 * Branch/airport slugs must map to Wizard numeric ids; address-delivery
 * uses the freeform address string.
 */
export function resolveWizardAddressForBooking(
  point: BookingPickup | BookingReturn,
): number | string {
  const mapped = resolveWizardAddressId(point.locationId);
  if (mapped != null) return mapped;

  if ("type" in point && point.type === "address-delivery" && point.address?.trim()) {
    return point.address.trim();
  }
  if (point.address?.trim()) return point.address.trim();

  throw new UnmappedWizardAddressError(point.locationId ?? "unknown");
}
