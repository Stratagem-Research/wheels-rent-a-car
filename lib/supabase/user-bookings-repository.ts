import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type UserBookingRow = {
  bookingReference: string;
  publicToken: string | null;
  createdAt: string;
};

export async function listUserBookings(
  supabase: SupabaseClient,
  userId: string,
): Promise<UserBookingRow[]> {
  const { data, error } = await supabase
    .from("user_bookings")
    .select("booking_reference, public_token, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    bookingReference: row.booking_reference as string,
    publicToken: (row.public_token as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
}

export async function addUserBooking(input: {
  userId: string;
  bookingReference: string;
  publicToken?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("user_bookings").upsert(
    {
      user_id: input.userId,
      booking_reference: input.bookingReference,
      public_token: input.publicToken ?? null,
    },
    { onConflict: "user_id,booking_reference", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function userOwnsBooking(
  supabase: SupabaseClient,
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
