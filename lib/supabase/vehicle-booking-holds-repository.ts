import { fromBackendDateTime } from "@/lib/api/wheels-public/datetime";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type VehicleBookingHoldInput = {
  bookingReference: string;
  wizardVehicleId?: number | null;
  frontendVehicleId: string;
  pickupAt: string;
  returnAt: string;
};

/** Normalize SearchBar, Wizard, or ISO datetimes to UTC for hold storage/queries. */
export function toHoldIso(datetime: string): string {
  const trimmed = datetime.trim();
  try {
    return fromBackendDateTime(trimmed);
  } catch {
    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid datetime: ${JSON.stringify(datetime)}`);
    }
    return parsed.toISOString();
  }
}

function warnHolds(error: { message?: string }, action: string) {
  console.warn(`[vehicle_booking_holds] ${action} failed (non-fatal)`, error.message ?? error);
}

/**
 * Record that this inventory unit is taken for the rental window.
 * Idempotent on booking_reference.
 */
export async function addVehicleBookingHold(input: VehicleBookingHoldInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("vehicle_booking_holds").upsert(
    {
      booking_reference: input.bookingReference,
      ...(input.wizardVehicleId != null ? { wizard_vehicle_id: input.wizardVehicleId } : {}),
      frontend_vehicle_id: input.frontendVehicleId,
      pickup_at: toHoldIso(input.pickupAt),
      return_at: toHoldIso(input.returnAt),
    },
    { onConflict: "booking_reference" },
  );
  if (error) throw error;
}

export async function isVehicleHeld(
  frontendVehicleId: string,
  pickupAt: string,
  returnAt: string,
): Promise<boolean> {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from("vehicle_booking_holds")
      .select("booking_reference")
      .eq("frontend_vehicle_id", frontendVehicleId)
      .lt("pickup_at", toHoldIso(returnAt))
      .gt("return_at", toHoldIso(pickupAt))
      .limit(1)
      .maybeSingle();
    if (error) {
      warnHolds(error, "isVehicleHeld");
      return false;
    }
    return Boolean(data);
  } catch (err) {
    warnHolds(err instanceof Error ? err : { message: String(err) }, "isVehicleHeld");
    return false;
  }
}

/**
 * Frontend vehicle ids currently held.
 * With a range: overlapping that window. Without: any hold that has not yet ended.
 */
export async function listHeldFrontendVehicleIds(range?: {
  from: string;
  to: string;
}): Promise<Set<string>> {
  try {
    const supabase = getSupabaseAdminClient();
    const query = supabase.from("vehicle_booking_holds").select("frontend_vehicle_id");
    const { data, error } = range
      ? await query.lt("pickup_at", toHoldIso(range.to)).gt("return_at", toHoldIso(range.from))
      : await query.gt("return_at", new Date().toISOString());
    if (error) {
      warnHolds(error, "listHeldFrontendVehicleIds");
      return new Set();
    }
    return new Set(
      (data ?? [])
        .map((row) => row.frontend_vehicle_id as string)
        .filter((id) => id.length > 0),
    );
  } catch (err) {
    warnHolds(err instanceof Error ? err : { message: String(err) }, "listHeldFrontendVehicleIds");
    return new Set();
  }
}

export type HoldInventoryStatus = "on-rent" | "upcoming" | "ended";
export type HoldCustomerType = "account" | "guest" | "unknown";

export function holdInventoryStatus(
  pickupAt: string,
  returnAt: string,
  now = new Date(),
): HoldInventoryStatus {
  const pickup = Date.parse(pickupAt);
  const ret = Date.parse(returnAt);
  const t = now.getTime();
  if (!Number.isFinite(ret) || ret <= t) return "ended";
  if (Number.isFinite(pickup) && pickup > t) return "upcoming";
  return "on-rent";
}

export type AdminBookingHold = {
  bookingReference: string;
  wizardVehicleId: number;
  frontendVehicleId: string;
  vehicleName: string;
  pickupAt: string;
  returnAt: string;
  createdAt: string;
  customerType: HoldCustomerType;
  email: string | null;
  status: HoldInventoryStatus;
  reducingCount: boolean;
};

function vehicleNameFromRow(row: {
  display_name?: string | null;
  brand?: string | null;
  model?: string | null;
}): string {
  const fromParts = [row.brand, row.model].filter(Boolean).join(" ").trim();
  return fromParts || row.display_name?.trim() || "Unknown vehicle";
}

export { vehicleNameFromRow as fleetVehicleLabel };

/** All website booking holds, joined with guest/account identity and fleet name. */
export async function listAdminBookingHolds(): Promise<AdminBookingHold[]> {
  const supabase = getSupabaseAdminClient();
  const { data: holds, error } = await supabase
    .from("vehicle_booking_holds")
    .select(
      "booking_reference, wizard_vehicle_id, frontend_vehicle_id, pickup_at, return_at, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = holds ?? [];
  if (rows.length === 0) return [];

  const refs = rows.map((row) => row.booking_reference as string);
  const wizardIds = [...new Set(rows.map((row) => row.wizard_vehicle_id as number))];

  const usersQuery = supabase
    .from("user_bookings")
    .select("booking_reference, customer_email")
    .in("booking_reference", refs);
  const guestsQuery = supabase
    .from("guest_booking_index")
    .select("booking_reference, email")
    .in("booking_reference", refs);
  const vehiclesQuery = supabase
    .from("wizard_vehicles")
    .select("wizard_vehicle_id, display_name, brand, model")
    .in("wizard_vehicle_id", wizardIds);

  const [usersResult, guestsResult, vehiclesResult] = await Promise.all([
    usersQuery,
    guestsQuery,
    vehiclesQuery,
  ]);

  let userRows = usersResult.data ?? [];
  if (usersResult.error && /customer_email/i.test(usersResult.error.message ?? "")) {
    const fallback = await supabase
      .from("user_bookings")
      .select("booking_reference")
      .in("booking_reference", refs);
    if (fallback.error) throw new Error(fallback.error.message);
    userRows = (fallback.data ?? []).map((row) => ({
      booking_reference: row.booking_reference,
      customer_email: null,
    }));
  } else if (usersResult.error) {
    throw new Error(usersResult.error.message);
  }
  if (guestsResult.error) throw new Error(guestsResult.error.message);
  if (vehiclesResult.error) throw new Error(vehiclesResult.error.message);

  const accountByRef = new Map<string, string | null>();
  for (const row of userRows) {
    const ref = row.booking_reference as string;
    if (!accountByRef.has(ref)) {
      accountByRef.set(ref, (row.customer_email as string | null) ?? null);
    }
  }
  const guestByRef = new Map<string, string>();
  for (const row of guestsResult.data ?? []) {
    const ref = row.booking_reference as string;
    if (!guestByRef.has(ref)) guestByRef.set(ref, row.email as string);
  }
  const vehicleById = new Map(
    (vehiclesResult.data ?? []).map((row) => [
      row.wizard_vehicle_id as number,
      vehicleNameFromRow(row),
    ]),
  );

  const now = new Date();
  return rows.map((row) => {
    const bookingReference = row.booking_reference as string;
    const accountEmail = accountByRef.get(bookingReference);
    const guestEmail = guestByRef.get(bookingReference) ?? null;
    const customerType: HoldCustomerType = accountByRef.has(bookingReference)
      ? "account"
      : guestEmail
        ? "guest"
        : "unknown";
    const status = holdInventoryStatus(row.pickup_at as string, row.return_at as string, now);
    return {
      bookingReference,
      wizardVehicleId: row.wizard_vehicle_id as number,
      frontendVehicleId: row.frontend_vehicle_id as string,
      vehicleName: vehicleById.get(row.wizard_vehicle_id as number) ?? row.frontend_vehicle_id,
      pickupAt: row.pickup_at as string,
      returnAt: row.return_at as string,
      createdAt: row.created_at as string,
      customerType,
      email: (accountEmail && accountEmail.trim()) || guestEmail,
      status,
      reducingCount: status !== "ended",
    };
  });
}

export async function deleteVehicleBookingHold(bookingReference: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("vehicle_booking_holds")
    .delete()
    .eq("booking_reference", bookingReference);
  if (error) throw new Error(error.message);
}
