const WIZ_PREFIX = "wiz-";

/** Stable frontend vehicle id for a Wizard numeric vehicle id. */
export function frontendVehicleIdFromWizard(wizardVehicleId: number): string {
  return `${WIZ_PREFIX}${wizardVehicleId}`;
}

/** Parse Wizard numeric id from frontend vehicle id (`wiz-131` → 131). */
export function parseWizardVehicleId(frontendVehicleId: string): number | null {
  if (!frontendVehicleId.startsWith(WIZ_PREFIX)) return null;
  const parsed = Number.parseInt(frontendVehicleId.slice(WIZ_PREFIX.length), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function slugifyVehicleName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
