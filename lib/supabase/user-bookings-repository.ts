import type { PostgrestError } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type UserBookingRow = {
  bookingReference: string;
  publicToken: string | null;
  customerEmail: string | null;
  createdAt: string;
};

function isMissingWizardBookingIdColumn(error: PostgrestError): boolean {
  return /wizard_booking_id/i.test(error.message ?? "");
}

export async function listUserBookings(
  supabase: import("@supabase/supabase-js").SupabaseClient,
  userId: string,
): Promise<UserBookingRow[]> {
  const { data, error } = await supabase
    .from("user_bookings")
    .select("booking_reference, public_token, customer_email, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error && /customer_email/i.test(error.message ?? "")) {
    const fallback = await supabase
      .from("user_bookings")
      .select("booking_reference, public_token, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (fallback.error) throw fallback.error;
    return (fallback.data ?? []).map((row) => ({
      bookingReference: row.booking_reference as string,
      publicToken: (row.public_token as string | null) ?? null,
      customerEmail: null,
      createdAt: row.created_at as string,
    }));
  }
  if (error) throw error;
  return (data ?? []).map((row) => ({
    bookingReference: row.booking_reference as string,
    publicToken: (row.public_token as string | null) ?? null,
    customerEmail: (row.customer_email as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

/**
 * Best-effort link between an auth user and a Wizard booking reference.
 * Never blocks checkout — callers should catch/log failures after submit.
 */
function isMissingCustomerEmailColumn(error: PostgrestError): boolean {
  return /customer_email/i.test(error.message ?? "");
}

export async function addUserBooking(input: {
  userId: string;
  bookingReference: string;
  publicToken?: string | null;
  wizardBookingId?: number | null;
  customerEmail?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const baseRow = {
    user_id: input.userId,
    booking_reference: input.bookingReference,
    public_token: input.publicToken ?? null,
    ...(input.customerEmail ? { customer_email: input.customerEmail } : {}),
  };

  const withWizardId =
    input.wizardBookingId != null
      ? { ...baseRow, wizard_booking_id: input.wizardBookingId }
      : baseRow;

  const { error } = await supabase
    .from("user_bookings")
    .upsert(withWizardId, { onConflict: "user_id,booking_reference", ignoreDuplicates: true });

  if (!error) return;

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
    .select("booking_reference, public_token, customer_email, created_at")
    .eq("user_id", userId)
    .eq("booking_reference", bookingReference)
    .maybeSingle();
  if (error && /customer_email/i.test(error.message ?? "")) {
    const fallback = await supabase
      .from("user_bookings")
      .select("booking_reference, public_token, created_at")
      .eq("user_id", userId)
      .eq("booking_reference", bookingReference)
      .maybeSingle();
    if (fallback.error) throw fallback.error;
    if (!fallback.data) return null;
    return {
      bookingReference: fallback.data.booking_reference as string,
      publicToken: (fallback.data.public_token as string | null) ?? null,
      customerEmail: null,
      createdAt: fallback.data.created_at as string,
    };
  }
  if (error) throw error;
  if (!data) return null;
  return {
    bookingReference: data.booking_reference as string,
    publicToken: (data.public_token as string | null) ?? null,
    customerEmail: (data.customer_email as string | null) ?? null,
    createdAt: data.created_at as string,
  };
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
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("guest_booking_index").upsert(
    {
      email: input.email.trim().toLowerCase(),
      booking_reference: input.bookingReference,
      public_token: input.publicToken ?? null,
      wizard_booking_id: input.wizardBookingId ?? null,
    },
    { onConflict: "email,booking_reference", ignoreDuplicates: false },
  );
  if (error) throw error;
}

export async function claimGuestBookingsForUser(userId: string, email: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const normalizedEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from("guest_booking_index")
    .select("booking_reference, public_token, wizard_booking_id")
    .eq("email", normalizedEmail);
  if (error) throw error;
  if (!data?.length) return 0;

  for (const row of data) {
    await addUserBooking({
      userId,
      bookingReference: row.booking_reference as string,
      publicToken: (row.public_token as string | null) ?? null,
      wizardBookingId: (row.wizard_booking_id as number | null) ?? null,
      customerEmail: normalizedEmail,
    });
  }

  return data.length;
}
