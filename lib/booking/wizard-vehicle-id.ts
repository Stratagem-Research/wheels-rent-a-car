const WIZ_PREFIX = "wiz-";

/** Stable frontend vehicle id for a Wizard numeric vehicle id. */
export function frontendVehicleIdFromWizard(wizardVehicleId: number): string {
  return `${WIZ_PREFIX}${wizardVehicleId}`;
}

/** Parse Wizard numeric id from `wiz-131` or a bare `131`. */
export function parseWizardVehicleId(frontendVehicleId: string): number | null {
  const trimmed = frontendVehicleId.trim();
  if (trimmed.startsWith(WIZ_PREFIX)) {
    const parsed = Number.parseInt(trimmed.slice(WIZ_PREFIX.length), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  if (/^\d+$/.test(trimmed)) {
    const parsed = Number.parseInt(trimmed, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }
  return null;
}

export function isManualVehicleId(frontendVehicleId: string): boolean {
  return frontendVehicleId.startsWith("manual-");
}

/** Website-only inventory unit — never sent to the Wizard booking API. */
export function newManualVehicleId(): string {
  return `manual-${crypto.randomUUID()}`;
}

/**
 * Admin-typed unit id. Stored as `manual-{id}` so it cannot be mistaken for a Wizard vehicle.
 * Rejects empty values and Wizard-shaped ids (`131`, `wiz-131`).
 */
export function normalizeManualUnitId(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, "-");
  if (!trimmed) return null;
  const body = trimmed.toLowerCase().startsWith("manual-")
    ? trimmed.slice("manual-".length)
    : trimmed;
  if (!body) return null;
  if (parseWizardVehicleId(trimmed) != null || parseWizardVehicleId(body) != null) return null;
  if (!/^[a-zA-Z0-9._-]+$/.test(body)) return null;
  return `manual-${body}`;
}

/** User-facing unit id (`MICRA-1`), not the stored `manual-` prefix. */
export function displayManualUnitId(frontendVehicleId: string): string {
  if (!frontendVehicleId.startsWith("manual-")) return frontendVehicleId;
  const rest = frontendVehicleId.slice("manual-".length);
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rest)) {
    return `manual-${rest.replace(/-/g, "").slice(0, 8)}`;
  }
  return rest || frontendVehicleId;
}

/** Accept `131` or `wiz-131`. */
export function parseWizardIdInput(raw: string): number | null {
  return parseWizardVehicleId(raw);
}

export const WIZARD_VEHICLE_UNKNOWN =
  "Wizard does not recognise this vehicle id. Check the Wizard vehicle id in fleet admin.";

export function slugifyVehicleName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
