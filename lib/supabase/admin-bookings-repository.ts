import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { isManualIndexedBooking } from "@/lib/server/manual-booking-ops";
import {
  fleetVehicleLabel,
  holdInventoryStatus,
  websiteVehicleLabels,
  type HoldCustomerType,
  type HoldInventoryStatus,
} from "@/lib/supabase/vehicle-booking-holds-repository";
import { frontendVehicleIdFromWizard } from "@/lib/booking/wizard-vehicle-id";

export type AdminWebsiteBooking = {
  bookingReference: string;
  wizardBookingId: number | null;
  customerType: HoldCustomerType;
  email: string | null;
  customerName: string | null;
  createdAt: string;
  vehicleName: string | null;
  frontendVehicleId: string | null;
  pickupAt: string | null;
  returnAt: string | null;
  holdStatus: HoldInventoryStatus | null;
  reducingCount: boolean;
  lifecycleState: string | null;
  paymentStatus: string | null;
  isManual: boolean;
};

function earlierIso(a: string, b: string): string {
  const aMs = Date.parse(a);
  const bMs = Date.parse(b);
  if (!Number.isFinite(aMs)) return b;
  if (!Number.isFinite(bMs)) return a;
  return aMs <= bMs ? a : b;
}

/** Guest + account website bookings, with hold/fleet-count and latest ops state. */
export async function listAdminWebsiteBookings(): Promise<AdminWebsiteBooking[]> {
  const supabase = getSupabaseAdminClient();

  const usersSelect =
    "booking_reference, user_id, public_token, wizard_booking_id, customer_email, created_at, pickup_at, return_at, frontend_vehicle_id, wizard_vehicle_id";
  const guestsSelect =
    "booking_reference, email, wizard_booking_id, created_at, pickup_at, return_at, frontend_vehicle_id, wizard_vehicle_id";
  const [usersResult, guestsResult, holdsResult, timelineResult, paymentsResult] = await Promise.all([
    supabase.from("user_bookings").select(usersSelect).order("created_at", { ascending: false }),
    supabase.from("guest_booking_index").select(guestsSelect).order("created_at", { ascending: false }),
    supabase
      .from("vehicle_booking_holds")
      .select(
        "booking_reference, wizard_vehicle_id, frontend_vehicle_id, pickup_at, return_at, created_at",
      ),
    supabase
      .from("booking_state_timeline")
      .select("booking_reference, state, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("payment_events")
      .select("booking_reference, status, created_at")
      .order("created_at", { ascending: false })
      .limit(500),
  ]);

  let userRows = usersResult.data ?? [];
  if (usersResult.error && /customer_email|wizard_booking_id|pickup_at|return_at|frontend_vehicle_id|wizard_vehicle_id/i.test(usersResult.error.message ?? "")) {
    const fallback = await supabase
      .from("user_bookings")
      .select("booking_reference, user_id, public_token, created_at")
      .order("created_at", { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    userRows = (fallback.data ?? []).map((row) => ({
      ...row,
      customer_email: null,
      wizard_booking_id: null,
      pickup_at: null,
      return_at: null,
      frontend_vehicle_id: null,
      wizard_vehicle_id: null,
    }));
  } else if (usersResult.error) {
    throw new Error(usersResult.error.message);
  }
  let guestRows = guestsResult.data ?? [];
  if (guestsResult.error && /pickup_at|return_at|frontend_vehicle_id|wizard_vehicle_id/i.test(guestsResult.error.message ?? "")) {
    const fallback = await supabase
      .from("guest_booking_index")
      .select("booking_reference, email, wizard_booking_id, created_at")
      .order("created_at", { ascending: false });
    if (fallback.error) throw new Error(fallback.error.message);
    guestRows = (fallback.data ?? []).map((row) => ({
      ...row,
      pickup_at: null,
      return_at: null,
      frontend_vehicle_id: null,
      wizard_vehicle_id: null,
    }));
  } else if (guestsResult.error) {
    throw new Error(guestsResult.error.message);
  }
  if (holdsResult.error) throw new Error(holdsResult.error.message);

  const timelineByRef = new Map<string, string>();
  for (const row of timelineResult.data ?? []) {
    const ref = row.booking_reference as string;
    if (ref && !timelineByRef.has(ref)) timelineByRef.set(ref, String(row.state ?? ""));
  }
  const paymentByRef = new Map<string, string>();
  for (const row of paymentsResult.data ?? []) {
    const ref = row.booking_reference as string;
    if (ref && !paymentByRef.has(ref)) paymentByRef.set(ref, String(row.status ?? ""));
  }

  const holds = holdsResult.data ?? [];
  const wizardIds = [
    ...new Set(
      [
        ...holds.map((row) => row.wizard_vehicle_id as number),
        ...userRows.map((row) => row.wizard_vehicle_id as number),
        ...guestRows.map((row) => row.wizard_vehicle_id as number),
      ].filter((id) => Number.isFinite(id) && id > 0),
    ),
  ];
  const frontendIds = [
    ...new Set(
      [
        ...holds.map((row) => row.frontend_vehicle_id as string | null),
        ...userRows.map((row) => row.frontend_vehicle_id as string | null),
        ...guestRows.map((row) => row.frontend_vehicle_id as string | null),
        ...wizardIds.map((id) => frontendVehicleIdFromWizard(id)),
      ].filter((id): id is string => Boolean(id)),
    ),
  ];
  const [vehiclesResult, websiteByFrontend] = await Promise.all([
    wizardIds.length > 0
      ? supabase
          .from("wizard_vehicles")
          .select("wizard_vehicle_id, display_name, brand, model")
          .in("wizard_vehicle_id", wizardIds)
      : Promise.resolve({ data: [] as { wizard_vehicle_id: number; display_name: string | null; brand: string | null; model: string | null }[], error: null }),
    websiteVehicleLabels(supabase, frontendIds),
  ]);
  if (vehiclesResult.error) throw new Error(vehiclesResult.error.message);
  const vehicleById = new Map(
    (vehiclesResult.data ?? []).map((row) => [
      row.wizard_vehicle_id as number,
      fleetVehicleLabel(row),
    ]),
  );

  const userIds = [
    ...new Set(userRows.map((row) => row.user_id as string).filter((id): id is string => Boolean(id))),
  ];
  const profilesResult =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, first_name, last_name").in("id", userIds)
      : { data: [], error: null };
  const nameByUserId = new Map<string, string>();
  for (const row of profilesResult.data ?? []) {
    const name = [row.first_name, row.last_name].filter(Boolean).join(" ").trim();
    if (name) nameByUserId.set(row.id as string, name);
  }

  type Acc = {
    bookingReference: string;
    wizardBookingId: number | null;
    hasAccount: boolean;
    accountEmail: string | null;
    guestEmail: string | null;
    customerName: string | null;
    createdAt: string;
    wizardVehicleId: number | null;
    frontendVehicleId: string | null;
    pickupAt: string | null;
    returnAt: string | null;
  };

  const byRef = new Map<string, Acc>();
  const upsert = (partial: Partial<Acc> & { bookingReference: string; createdAt: string }) => {
    const existing = byRef.get(partial.bookingReference);
    if (!existing) {
      byRef.set(partial.bookingReference, {
        bookingReference: partial.bookingReference,
        wizardBookingId: partial.wizardBookingId ?? null,
        hasAccount: partial.hasAccount ?? false,
        accountEmail: partial.accountEmail ?? null,
        guestEmail: partial.guestEmail ?? null,
        customerName: partial.customerName ?? null,
        createdAt: partial.createdAt,
        wizardVehicleId: partial.wizardVehicleId ?? null,
        frontendVehicleId: partial.frontendVehicleId ?? null,
        pickupAt: partial.pickupAt ?? null,
        returnAt: partial.returnAt ?? null,
      });
      return;
    }
    existing.createdAt = earlierIso(existing.createdAt, partial.createdAt);
    if (partial.wizardBookingId != null) existing.wizardBookingId = partial.wizardBookingId;
    if (partial.hasAccount) existing.hasAccount = true;
    if (partial.accountEmail) existing.accountEmail = partial.accountEmail;
    if (partial.guestEmail) existing.guestEmail = partial.guestEmail;
    if (partial.customerName) existing.customerName = partial.customerName;
    if (partial.wizardVehicleId != null) existing.wizardVehicleId = partial.wizardVehicleId;
    if (partial.frontendVehicleId) existing.frontendVehicleId = partial.frontendVehicleId;
    if (partial.pickupAt) existing.pickupAt = partial.pickupAt;
    if (partial.returnAt) existing.returnAt = partial.returnAt;
  };

  for (const row of userRows) {
    const userId = row.user_id as string | undefined;
    upsert({
      bookingReference: row.booking_reference as string,
      wizardBookingId: (row.wizard_booking_id as number | null) ?? null,
      hasAccount: true,
      accountEmail: (row.customer_email as string | null) ?? null,
      customerName: userId ? nameByUserId.get(userId) ?? null : null,
      createdAt: row.created_at as string,
      wizardVehicleId: (row.wizard_vehicle_id as number | null) ?? null,
      frontendVehicleId: (row.frontend_vehicle_id as string | null) ?? null,
      pickupAt: (row.pickup_at as string | null) ?? null,
      returnAt: (row.return_at as string | null) ?? null,
    });
  }
  for (const row of guestRows) {
    upsert({
      bookingReference: row.booking_reference as string,
      wizardBookingId: (row.wizard_booking_id as number | null) ?? null,
      guestEmail: (row.email as string | null) ?? null,
      createdAt: row.created_at as string,
      wizardVehicleId: (row.wizard_vehicle_id as number | null) ?? null,
      frontendVehicleId: (row.frontend_vehicle_id as string | null) ?? null,
      pickupAt: (row.pickup_at as string | null) ?? null,
      returnAt: (row.return_at as string | null) ?? null,
    });
  }
  for (const row of holds) {
    upsert({
      bookingReference: row.booking_reference as string,
      wizardVehicleId: (row.wizard_vehicle_id as number | null) ?? null,
      frontendVehicleId: (row.frontend_vehicle_id as string | null) ?? null,
      pickupAt: (row.pickup_at as string | null) ?? null,
      returnAt: (row.return_at as string | null) ?? null,
      createdAt: row.created_at as string,
    });
  }

  const now = new Date();
  return [...byRef.values()]
    .map((row) => {
      const holdStatus =
        row.pickupAt && row.returnAt ? holdInventoryStatus(row.pickupAt, row.returnAt, now) : null;
      const customerType: HoldCustomerType = row.hasAccount
        ? "account"
        : row.guestEmail
          ? "guest"
          : "unknown";
      const frontendId =
        row.frontendVehicleId ||
        (row.wizardVehicleId != null ? frontendVehicleIdFromWizard(row.wizardVehicleId) : null);
      return {
        bookingReference: row.bookingReference,
        wizardBookingId: row.wizardBookingId,
        customerType,
        email: (row.accountEmail && row.accountEmail.trim()) || row.guestEmail,
        customerName: row.customerName,
        createdAt: row.createdAt,
        vehicleName:
          (frontendId ? websiteByFrontend.get(frontendId) : undefined) ??
          (row.wizardVehicleId != null ? vehicleById.get(row.wizardVehicleId) : undefined) ??
          frontendId,
        frontendVehicleId: row.frontendVehicleId,
        pickupAt: row.pickupAt,
        returnAt: row.returnAt,
        holdStatus,
        reducingCount: holdStatus != null && holdStatus !== "ended",
        lifecycleState: timelineByRef.get(row.bookingReference) || null,
        paymentStatus: paymentByRef.get(row.bookingReference) || null,
        isManual: isManualIndexedBooking({
          frontendVehicleId: row.frontendVehicleId,
          wizardVehicleId: row.wizardVehicleId,
        }),
      };
    })
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}
