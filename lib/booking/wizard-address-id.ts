/**
 * Wizard's `/booking-request` expects a numeric address id for
 * `pickup_address`/`drop_off_address`, not our internal branch slugs.
 * Wheels has two physical pickup points; Wizard assigned them ids 1 and 2.
 */
const WIZARD_ADDRESS_ID: Readonly<Record<string, number>> = {
  "br-hazmieh": 1,
  "br-bey-airport": 2,
};

/** Resolve a Wizard numeric address id from our branch locationId, if known. */
export function resolveWizardAddressId(locationId: string | undefined): number | undefined {
  if (!locationId) return undefined;
  return WIZARD_ADDRESS_ID[locationId];
}
