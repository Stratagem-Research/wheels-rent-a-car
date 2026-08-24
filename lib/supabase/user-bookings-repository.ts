import type { PostgrestError } from "@supabase/supabase-js";
import {
  compactStoredBookingToDb,
  emptyStoredBookingFields,
  hasStoredBookingDetails,
  mapStoredBookingFields,
  omitStoredBookingDb,
  STORED_BOOKING_SELECT,
  type StoredBookingFields,
} from "@/lib/booking/stored-booking";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { toHoldIso } from "@/lib/supabase/vehicle-booking-holds-repository";

export type UserBookingRow = StoredBookingFields & {
  bookingReference: string;
  publicToken: string | null;
  customerEmail: string | null;
  createdAt: string;
  pickupAt: string | null;
  returnAt: string | null;
  frontendVehicleId: string | null;
  wizardVehicleId: number | null;
};

const USER_BOOKING_SELECT = `booking_reference, public_token, customer_email, created_at, pickup_at, return_at, frontend_vehicle_id, wizard_vehicle_id, ${STORED_BOOKING_SELECT}`;
const USER_BOOKING_SELECT_BASIC = "booking_reference, public_token, customer_email, created_at";
const GUEST_BOOKING_SELECT = `email, created_at, booking_reference, public_token, wizard_booking_id, pickup_at, return_at, frontend_vehicle_id, wizard_vehicle_id, ${STORED_BOOKING_SELECT}`;

function mapUserBookingRow(row: Record<string, unknown>): UserBookingRow {
  return {
    ...emptyStoredBookingFields(),
    ...mapStoredBookingFields(row),
    bookingReference: row.booking_reference as string,
    publicToken: (row.public_token as string | null) ?? null,
    customerEmail: (row.customer_email as string | null) ?? null,
    createdAt: row.created_at as string,
    pickupAt: (row.pickup_at as string | null) ?? null,
    returnAt: (row.return_at as string | null) ?? null,
    frontendVehicleId: (row.frontend_vehicle_id as string | null) ?? null,
    wizardVehicleId: (row.wizard_vehicle_id as number | null) ?? null,
  };
}

function isMissingWizardBookingIdColumn(error: PostgrestError): boolean {
  return /wizard_booking_id/i.test(error.message ?? "");
}

function withoutLicencePathColumns(row: Record<string, unknown>): Record<string, unknown> {
  const {
    driver_licence_front_path: _f,
    driver_licence_back_path: _b,
    additional_driver_front_path: _af,
    additional_driver_back_path: _ab,
    additional_driver_first_name: _an,
    additional_driver_last_name: _al,
    ...rest
  } = row;
  return rest;
}

function isMissingLicencePathColumn(error: PostgrestError): boolean {
  return /driver_licence_(front|back)_path|additional_driver_(front|back)_path|additional_driver_(first|last)_name/i.test(
    error.message ?? "",
  );
}

function isMissingStoredBookingColumn(error: PostgrestError): boolean {
  return /pickup_at|return_at|frontend_vehicle_id|wizard_vehicle_id|total_cents|vehicle_make|driver_first_name|driver_licence|additional_driver|base_rate_cents|extras|snapshot/i.test(
    error.message ?? "",
  );
}

function isMissingCustomerEmailColumn(error: PostgrestError): boolean {
  return /customer_email/i.test(error.message ?? "");
}

function preferStoredState(a: string | null, b: string | null): string | null {
  const rank = (state: string | null): number => {
    if (state === "cancelled" || state === "completed" || state === "expired") return 3;
    if (state === "confirmed") return 2;
    if (state === "pending" || state === "draft") return 1;
    return 0;
  };
  return rank(a) >= rank(b) ? a : b;
}

function mergeIndexedDetails(user: UserBookingRow, indexed: UserBookingRow): UserBookingRow {
  const indexedRicher = hasStoredBookingDetails(indexed) && !hasStoredBookingDetails(user);
  const base = indexedRicher ? indexed : user;
  const other = indexedRicher ? user : indexed;
  return {
    ...other,
    ...base,
    customerEmail: user.customerEmail ?? indexed.customerEmail,
    publicToken: user.publicToken ?? indexed.publicToken,
    createdAt: user.createdAt,
    pickupAt: user.pickupAt ?? indexed.pickupAt,
    returnAt: user.returnAt ?? indexed.returnAt,
    frontendVehicleId: user.frontendVehicleId ?? indexed.frontendVehicleId,
    wizardVehicleId: user.wizardVehicleId ?? indexed.wizardVehicleId,
    state: preferStoredState(user.state, indexed.state),
  };
}

async function fillMissingDetailsFromGuestIndex(rows: UserBookingRow[]): Promise<UserBookingRow[]> {
  const needsFill = rows.filter(
    (row) => !hasStoredBookingDetails(row) || !row.returnAt || !row.state,
  );
  if (needsFill.length === 0) return rows;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guest_booking_index")
    .select("*")
    .in(
      "booking_reference",
      needsFill.map((row) => row.bookingReference),
    );
  if (error || !data?.length) return rows;
  const byRef = new Map<string, UserBookingRow>();
  for (const raw of data) {
    const mapped = mapGuestBookingRow(raw as unknown as Record<string, unknown>);
    const existing = byRef.get(mapped.bookingReference);
    if (!existing || hasStoredBookingDetails(mapped)) {
      byRef.set(mapped.bookingReference, mapped);
    }
  }
  return rows.map((row) => {
    const guest = byRef.get(row.bookingReference);
    return guest ? mergeIndexedDetails(row, guest) : row;
  });
}

async function queryUserBookingRows(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  bookingReference?: string,
): Promise<UserBookingRow[]> {
  const run = (select: string) => {
    let query = supabase.from("user_bookings").select(select).eq("user_id", userId);
    if (bookingReference) query = query.eq("booking_reference", bookingReference);
    return query.order("created_at", { ascending: false });
  };

  const full = await run(USER_BOOKING_SELECT);
  let mapped: UserBookingRow[] | null = null;
  if (!full.error) {
    mapped = (full.data ?? []).map((row) => mapUserBookingRow(row as unknown as Record<string, unknown>));
  } else if (isMissingCustomerEmailColumn(full.error) || isMissingStoredBookingColumn(full.error)) {
    const star = await run("*");
    if (!star.error) {
      mapped = (star.data ?? []).map((row) => mapUserBookingRow(row as unknown as Record<string, unknown>));
    } else {
      const basic = await run(USER_BOOKING_SELECT_BASIC);
      if (basic.error) throw basic.error;
      mapped = (basic.data ?? []).map((row) =>
        mapUserBookingRow(row as unknown as Record<string, unknown>),
      );
    }
  } else {
    throw full.error;
  }

  return fillMissingDetailsFromGuestIndex(mapped);
}

export type UserBookingWrite = {
  userId: string;
  bookingReference: string;
  publicToken?: string | null;
  wizardBookingId?: number | null;
  customerEmail?: string | null;
  pickupAt?: string | null;
  returnAt?: string | null;
  frontendVehicleId?: string | null;
  wizardVehicleId?: number | null;
  replace?: boolean;
} & Partial<StoredBookingFields>;

function detailsDb(input: Partial<StoredBookingFields>): Record<string, unknown> {
  return compactStoredBookingToDb({ ...emptyStoredBookingFields(), ...input });
}

export async function listUserBookings(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
): Promise<UserBookingRow[]> {
  return queryUserBookingRows(supabase, userId);
}

/**
 * Best-effort link between an auth user and a booking reference.
 * Never blocks checkout — callers should catch/log failures after submit.
 */
export async function addUserBooking(input: UserBookingWrite): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const rentalWindow = {
    ...(input.pickupAt ? { pickup_at: toHoldIso(input.pickupAt) } : {}),
    ...(input.returnAt ? { return_at: toHoldIso(input.returnAt) } : {}),
    ...(input.frontendVehicleId ? { frontend_vehicle_id: input.frontendVehicleId } : {}),
    ...(input.wizardVehicleId != null ? { wizard_vehicle_id: input.wizardVehicleId } : {}),
    ...detailsDb(input),
  };
  const baseRow = {
    user_id: input.userId,
    booking_reference: input.bookingReference,
    public_token: input.publicToken ?? null,
    ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
    ...rentalWindow,
  };

  const withWizardId =
    input.wizardBookingId != null
      ? { ...baseRow, wizard_booking_id: input.wizardBookingId }
      : baseRow;

  const { error } = await supabase
    .from("user_bookings")
    .upsert(withWizardId, { onConflict: "user_id,booking_reference", ignoreDuplicates: !input.replace });

  if (!error) return;

  if (isMissingLicencePathColumn(error)) {
    const { error: retryError } = await supabase.from("user_bookings").upsert(
      withoutLicencePathColumns(withWizardId as Record<string, unknown>),
      { onConflict: "user_id,booking_reference", ignoreDuplicates: !input.replace },
    );
    if (!retryError) return;
    throw retryError;
  }

  if (isMissingStoredBookingColumn(error)) {
    const withoutDetails = omitStoredBookingDb(withWizardId as Record<string, unknown>);
    delete withoutDetails.pickup_at;
    delete withoutDetails.return_at;
    delete withoutDetails.frontend_vehicle_id;
    delete withoutDetails.wizard_vehicle_id;
    const { error: retryError } = await supabase.from("user_bookings").upsert(withoutDetails, {
      onConflict: "user_id,booking_reference",
      ignoreDuplicates: true,
    });
    if (!retryError) return;
    throw retryError;
  }

  if (input.wizardBookingId != null && isMissingWizardBookingIdColumn(error)) {
    const { error: retryError } = await supabase.from("user_bookings").upsert(baseRow, {
      onConflict: "user_id,booking_reference",
      ignoreDuplicates: true,
    });
    if (!retryError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[user_bookings] wizard_booking_id column missing — saved link without it. Run supabase migration 20260720_000001_user_bookings_wizard_id.sql",
        );
      }
      return;
    }
    throw retryError;
  }

  if (input.customerEmail && isMissingCustomerEmailColumn(error)) {
    const { customer_email: _omit, ...withoutEmail } = baseRow;
    const { error: retryError } = await supabase.from("user_bookings").upsert(withoutEmail, {
      onConflict: "user_id,booking_reference",
      ignoreDuplicates: true,
    });
    if (!retryError) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[user_bookings] customer_email column missing — saved link without it. Run supabase migration 20260720_000002_user_bookings_customer_email.sql",
        );
      }
      return;
    }
    throw retryError;
  }

  throw error;
}

export async function getUserBookingRow(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  bookingReference: string,
): Promise<UserBookingRow | null> {
  const rows = await queryUserBookingRows(supabase, userId, bookingReference);
  return rows[0] ?? null;
}

export async function userOwnsBooking(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
  bookingReference: string,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_bookings")
    .select("booking_reference")
    .eq("user_id", userId)
    .eq("booking_reference", bookingReference)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

export type GuestBookingWrite = {
  email: string;
  bookingReference: string;
  publicToken?: string | null;
  wizardBookingId?: number | null;
  pickupAt?: string | null;
  returnAt?: string | null;
  frontendVehicleId?: string | null;
  wizardVehicleId?: number | null;
} & Partial<StoredBookingFields>;

export async function indexGuestBooking(input: GuestBookingWrite): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const row = {
    email: input.email.trim().toLowerCase(),
    booking_reference: input.bookingReference,
    public_token: input.publicToken ?? null,
    wizard_booking_id: input.wizardBookingId ?? null,
    ...(input.pickupAt ? { pickup_at: toHoldIso(input.pickupAt) } : {}),
    ...(input.returnAt ? { return_at: toHoldIso(input.returnAt) } : {}),
    ...(input.frontendVehicleId ? { frontend_vehicle_id: input.frontendVehicleId } : {}),
    ...(input.wizardVehicleId != null ? { wizard_vehicle_id: input.wizardVehicleId } : {}),
    ...detailsDb(input),
  };
  const { error } = await supabase.from("guest_booking_index").upsert(row, {
    onConflict: "email,booking_reference",
    ignoreDuplicates: false,
  });
  if (error && isMissingLicencePathColumn(error)) {
    const { error: retryError } = await supabase.from("guest_booking_index").upsert(
      withoutLicencePathColumns(row as Record<string, unknown>),
      { onConflict: "email,booking_reference", ignoreDuplicates: false },
    );
    if (!retryError) return;
    throw retryError;
  }
  if (error && isMissingStoredBookingColumn(error)) {
    const withoutDetails = omitStoredBookingDb(row as Record<string, unknown>);
    delete withoutDetails.pickup_at;
    delete withoutDetails.return_at;
    delete withoutDetails.frontend_vehicle_id;
    delete withoutDetails.wizard_vehicle_id;
    const { error: retryError } = await supabase.from("guest_booking_index").upsert(withoutDetails, {
      onConflict: "email,booking_reference",
      ignoreDuplicates: false,
    });
    if (retryError) throw retryError;
    return;
  }
  if (error) throw error;
}

function mapGuestBookingRow(row: Record<string, unknown>): UserBookingRow {
  return mapUserBookingRow({
    ...row,
    customer_email: row.email,
  });
}

/** Guest checkout index by ref + email (confirmation / manage-booking). */
export async function getIndexedGuestBooking(
  bookingReference: string,
  email: string,
): Promise<UserBookingRow | null> {
  const ref = bookingReference.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!ref || !normalizedEmail) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("guest_booking_index")
    .select(GUEST_BOOKING_SELECT)
    .eq("email", normalizedEmail)
    .eq("booking_reference", ref)
    .maybeSingle();
  if (error && isMissingStoredBookingColumn(error)) {
    const fallback = await supabase
      .from("guest_booking_index")
      .select("email, created_at, booking_reference, public_token, wizard_booking_id")
      .eq("email", normalizedEmail)
      .eq("booking_reference", ref)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    if (!fallback.data) return null;
    return mapGuestBookingRow(fallback.data as unknown as Record<string, unknown>);
  }
  if (error) throw error;
  if (!data) return null;
  return mapGuestBookingRow(data as unknown as Record<string, unknown>);
}

/** Guest index first, then account row for the same ref + email (confirmation / manage-booking). */
export async function findIndexedBookingByRefAndEmail(
  bookingReference: string,
  email: string,
): Promise<UserBookingRow | null> {
  const guest = await getIndexedGuestBooking(bookingReference, email);
  if (guest) return guest;

  const ref = bookingReference.trim();
  const normalizedEmail = email.trim().toLowerCase();
  if (!ref || !normalizedEmail) return null;
  const supabase = getSupabaseAdminClient();
  const full = await supabase
    .from("user_bookings")
    .select(USER_BOOKING_SELECT)
    .eq("booking_reference", ref)
    .eq("customer_email", normalizedEmail)
    .limit(1)
    .maybeSingle();
  if (!full.error && full.data) {
    return mapUserBookingRow(full.data as unknown as Record<string, unknown>);
  }
  if (full.error && (isMissingCustomerEmailColumn(full.error) || isMissingStoredBookingColumn(full.error))) {
    const star = await supabase
      .from("user_bookings")
      .select("*")
      .eq("booking_reference", ref)
      .limit(5);
    if (star.error) return null;
    const match = (star.data ?? []).find((row) => {
      const mapped = mapUserBookingRow(row as unknown as Record<string, unknown>);
      return (mapped.customerEmail ?? mapped.driverEmail ?? "").trim().toLowerCase() === normalizedEmail;
    });
    return match ? mapUserBookingRow(match as unknown as Record<string, unknown>) : null;
  }
  return null;
}

/** First guest index row for this ref, else a linked user_bookings row. */
export async function findIndexedBookingByReference(
  bookingReference: string,
): Promise<UserBookingRow | null> {
  const ref = bookingReference.trim();
  if (!ref) return null;
  const supabase = getSupabaseAdminClient();
  const guest = await supabase
    .from("guest_booking_index")
    .select(GUEST_BOOKING_SELECT)
    .eq("booking_reference", ref)
    .limit(1);
  if (!guest.error && guest.data?.[0]) {
    return mapGuestBookingRow(guest.data[0] as unknown as Record<string, unknown>);
  }
  if (guest.error && isMissingStoredBookingColumn(guest.error)) {
    const fallback = await supabase
      .from("guest_booking_index")
      .select("*")
      .eq("booking_reference", ref)
      .limit(1);
    if (fallback.error) throw fallback.error;
    if (fallback.data?.[0]) {
      return mapGuestBookingRow(fallback.data[0] as unknown as Record<string, unknown>);
    }
  } else if (guest.error) {
    throw guest.error;
  }

  const user = await supabase
    .from("user_bookings")
    .select(USER_BOOKING_SELECT)
    .eq("booking_reference", ref)
    .limit(1);
  if (user.error && (isMissingCustomerEmailColumn(user.error) || isMissingStoredBookingColumn(user.error))) {
    const fallback = await supabase
      .from("user_bookings")
      .select("*")
      .eq("booking_reference", ref)
      .limit(1);
    if (fallback.error) {
      const basic = await supabase
        .from("user_bookings")
        .select(USER_BOOKING_SELECT_BASIC)
        .eq("booking_reference", ref)
        .limit(1);
      if (basic.error) throw basic.error;
      if (!basic.data?.[0]) return null;
      return mapUserBookingRow(basic.data[0] as unknown as Record<string, unknown>);
    }
    if (!fallback.data?.[0]) return null;
    return mapUserBookingRow(fallback.data[0] as unknown as Record<string, unknown>);
  }
  if (user.error) throw user.error;
  if (!user.data?.[0]) return null;
  return mapUserBookingRow(user.data[0] as unknown as Record<string, unknown>);
}

export async function updateStoredBookingState(bookingReference: string, state: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const ref = bookingReference.trim();
  const [guest, user] = await Promise.all([
    supabase.from("guest_booking_index").update({ state }).eq("booking_reference", ref),
    supabase.from("user_bookings").update({ state }).eq("booking_reference", ref),
  ]);
  if (guest.error && user.error) {
    throw guest.error;
  }
}

export async function claimGuestBookingsForUser(userId: string, email: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("guest_booking_index")
    .select(GUEST_BOOKING_SELECT)
    .eq("email", normalizedEmail);
  const rows = await (async () => {
    if (!error) return data ?? [];
    if (!isMissingStoredBookingColumn(error) && !isMissingLicencePathColumn(error)) throw error;
    const fallback = await supabase.from("guest_booking_index").select("*").eq("email", normalizedEmail);
    if (fallback.error) throw fallback.error;
    return fallback.data ?? [];
  })();
  if (!rows.length) return 0;

  const refs = rows
    .map((row) => (row as Record<string, unknown>).booking_reference as string)
    .filter(Boolean);
  const { data: existing, error: existingError } = await supabase
    .from("user_bookings")
    .select("*")
    .in("booking_reference", refs);
  if (existingError) throw existingError;
  const existingByRef = new Map(
    (existing ?? []).map((row) => [
      row.booking_reference as string,
      mapUserBookingRow(row as unknown as Record<string, unknown>),
    ]),
  );
  const ownerByRef = new Map(
    (existing ?? []).map((row) => [row.booking_reference as string, row.user_id as string | null]),
  );

  let claimed = 0;
  for (const row of rows) {
    const record = row as Record<string, unknown>;
    const bookingReference = record.booking_reference as string;
    const owner = ownerByRef.get(bookingReference);
    if (owner && owner !== userId) continue;
    if (owner === null) continue;
    const linked = existingByRef.get(bookingReference);
    if (linked && hasStoredBookingDetails(linked) && linked.returnAt) continue;
    await addUserBooking({
      userId,
      bookingReference,
      publicToken: (record.public_token as string | null) ?? null,
      wizardBookingId: (record.wizard_booking_id as number | null) ?? null,
      pickupAt: (record.pickup_at as string | null) ?? null,
      returnAt: (record.return_at as string | null) ?? null,
      frontendVehicleId: (record.frontend_vehicle_id as string | null) ?? null,
      wizardVehicleId: (record.wizard_vehicle_id as number | null) ?? null,
      customerEmail: normalizedEmail,
      replace: true,
      ...mapStoredBookingFields(record),
    });
    claimed += 1;
  }

  return claimed;
}

/**
 * Frontend vehicle ids booked in the last `days`, most recent first and
 * deduplicated — feeds the homepage "Driver favourites" pick (recent
 * bookings, ranked by price, falling back to the general catalog when
 * there's no recent activity). Pulls from both user_bookings and the guest
 * index since either can hold a booking's frontend_vehicle_id.
 */
export async function listRecentlyBookedVehicleIds(
  options: { days?: number; limit?: number } = {},
): Promise<string[]> {
  const { days = 30, limit = 200 } = options;
  const supabase = getSupabaseAdminClient();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const [userRows, guestRows] = await Promise.all([
    supabase
      .from("user_bookings")
      .select("frontend_vehicle_id, created_at")
      .gte("created_at", since)
      .not("frontend_vehicle_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("guest_booking_index")
      .select("frontend_vehicle_id, created_at")
      .gte("created_at", since)
      .not("frontend_vehicle_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);
  if (userRows.error) throw userRows.error;
  if (guestRows.error) throw guestRows.error;

  const merged = [
    ...((userRows.data ?? []) as Array<{ frontend_vehicle_id: string | null; created_at: string }>),
    ...((guestRows.data ?? []) as Array<{ frontend_vehicle_id: string | null; created_at: string }>),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const ids: string[] = [];
  const seen = new Set<string>();
  for (const row of merged) {
    if (!row.frontend_vehicle_id || seen.has(row.frontend_vehicle_id)) continue;
    seen.add(row.frontend_vehicle_id);
    ids.push(row.frontend_vehicle_id);
  }
  return ids;
}
