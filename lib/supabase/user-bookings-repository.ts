import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { toHoldIso } from "@/lib/supabase/vehicle-booking-holds-repository";

export type UserBookingRow = {
  bookingReference: string;
  publicToken: string | null;
  customerEmail: string | null;
  createdAt: string;
  pickupAt: string | null;
  returnAt: string | null;
  frontendVehicleId: string | null;
  wizardVehicleId: number | null;
};

const USER_BOOKING_SELECT =
  "booking_reference, public_token, customer_email, created_at, pickup_at, return_at, frontend_vehicle_id, wizard_vehicle_id";
const USER_BOOKING_SELECT_BASIC = "booking_reference, public_token, customer_email, created_at";

function mapUserBookingRow(row: Record<string, unknown>): UserBookingRow {
  return {
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

function isMissingRentalWindowColumn(error: PostgrestError): boolean {
  return /pickup_at|return_at|frontend_vehicle_id|wizard_vehicle_id/i.test(error.message ?? "");
}

function isMissingCustomerEmailColumn(error: PostgrestError): boolean {
  return /customer_email/i.test(error.message ?? "");
}

export async function listUserBookings(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
): Promise<UserBookingRow[]> {
  const { data, error } = await supabase
    .from("user_bookings")
    .select(USER_BOOKING_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error && (isMissingCustomerEmailColumn(error) || isMissingRentalWindowColumn(error))) {
    const fallback = await supabase
      .from("user_bookings")
      .select(USER_BOOKING_SELECT_BASIC)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (fallback.error) {
      if (isMissingCustomerEmailColumn(fallback.error)) {
        const minimal = await supabase
          .from("user_bookings")
          .select("booking_reference, public_token, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });
        if (minimal.error) throw minimal.error;
        return (minimal.data ?? []).map((row) => mapUserBookingRow(row as Record<string, unknown>));
      }
      throw fallback.error;
    }
    return (fallback.data ?? []).map((row) => mapUserBookingRow(row as Record<string, unknown>));
  }
  if (error) throw error;
  return (data ?? []).map((row) => mapUserBookingRow(row as Record<string, unknown>));
}

/**
 * Best-effort link between an auth user and a Wizard booking reference.
 * Never blocks checkout — callers should catch/log failures after submit.
 */
export async function addUserBooking(input: {
  userId: string;
  bookingReference: string;
  publicToken?: string | null;
  wizardBookingId?: number | null;
  customerEmail?: string | null;
  pickupAt?: string | null;
  returnAt?: string | null;
  frontendVehicleId?: string | null;
  wizardVehicleId?: number | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const rentalWindow = {
    ...(input.pickupAt ? { pickup_at: toHoldIso(input.pickupAt) } : {}),
    ...(input.returnAt ? { return_at: toHoldIso(input.returnAt) } : {}),
    ...(input.frontendVehicleId ? { frontend_vehicle_id: input.frontendVehicleId } : {}),
    ...(input.wizardVehicleId != null ? { wizard_vehicle_id: input.wizardVehicleId } : {}),
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
    .upsert(withWizardId, { onConflict: "user_id,booking_reference", ignoreDuplicates: true });

  if (!error) return;

  if (isMissingRentalWindowColumn(error)) {
    const {
      pickup_at: _pickup,
      return_at: _return,
      frontend_vehicle_id: _frontend,
      wizard_vehicle_id: _vehicle,
      ...withoutWindow
    } = withWizardId as Record<string, unknown>;
    const { error: retryError } = await supabase.from("user_bookings").upsert(withoutWindow, {
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
  const { data, error } = await supabase
    .from("user_bookings")
    .select(USER_BOOKING_SELECT)
    .eq("user_id", userId)
    .eq("booking_reference", bookingReference)
    .maybeSingle();
  if (error && (isMissingCustomerEmailColumn(error) || isMissingRentalWindowColumn(error))) {
    const fallback = await supabase
      .from("user_bookings")
      .select(USER_BOOKING_SELECT_BASIC)
      .eq("user_id", userId)
      .eq("booking_reference", bookingReference)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    if (!fallback.data) return null;
    return mapUserBookingRow(fallback.data as Record<string, unknown>);
  }
  if (error) throw error;
  if (!data) return null;
  return mapUserBookingRow(data as Record<string, unknown>);
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

export async function indexGuestBooking(input: {
  email: string;
  bookingReference: string;
  publicToken?: string | null;
  wizardBookingId?: number | null;
  pickupAt?: string | null;
  returnAt?: string | null;
  frontendVehicleId?: string | null;
  wizardVehicleId?: number | null;
}): Promise<void> {
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
  };
  const { error } = await supabase.from("guest_booking_index").upsert(row, {
    onConflict: "email,booking_reference",
    ignoreDuplicates: false,
  });
  if (error && /pickup_at|return_at|frontend_vehicle_id|wizard_vehicle_id/i.test(error.message ?? "")) {
    const { pickup_at: _p, return_at: _r, frontend_vehicle_id: _f, wizard_vehicle_id: _w, ...withoutWindow } = row;
    const { error: retryError } = await supabase.from("guest_booking_index").upsert(withoutWindow, {
      onConflict: "email,booking_reference",
      ignoreDuplicates: false,
    });
    if (retryError) throw retryError;
    return;
  }
  if (error) throw error;
}

export async function claimGuestBookingsForUser(userId: string, email: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("guest_booking_index")
    .select("booking_reference, public_token, wizard_booking_id, pickup_at, return_at, frontend_vehicle_id, wizard_vehicle_id")
    .eq("email", normalizedEmail);
  const rows = await (async () => {
    if (!error) return data ?? [];
    if (!isMissingRentalWindowColumn(error)) throw error;
    const fallback = await supabase
      .from("guest_booking_index")
      .select("booking_reference, public_token, wizard_booking_id")
      .eq("email", normalizedEmail);
    if (fallback.error) throw fallback.error;
    return fallback.data ?? [];
  })();
  if (!rows.length) return 0;

  for (const row of rows) {
    await addUserBooking({
      userId,
      bookingReference: row.booking_reference as string,
      publicToken: (row.public_token as string | null) ?? null,
      wizardBookingId: (row.wizard_booking_id as number | null) ?? null,
      pickupAt: (row.pickup_at as string | null) ?? null,
      returnAt: (row.return_at as string | null) ?? null,
      frontendVehicleId: (row.frontend_vehicle_id as string | null) ?? null,
      wizardVehicleId: (row.wizard_vehicle_id as number | null) ?? null,
      customerEmail: normalizedEmail,
    });
  }

  return data.length;
}
