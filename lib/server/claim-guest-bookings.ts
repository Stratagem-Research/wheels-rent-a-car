import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { claimGuestBookingsForUser } from "@/lib/supabase/user-bookings-repository";
import { backfillLicenceFromBooking } from "@/lib/supabase/user-documents-repository";

/**
 * Claim guest bookings indexed under the user's email after auth.
 * Non-blocking: auth succeeds even if claim fails.
 */
export async function claimGuestBookingsAfterAuth(
  userId: string,
  email: string,
): Promise<number> {
  try {
    const claimed = await claimGuestBookingsForUser(userId, email);
    await hydrateAccountFromBookings(userId, email);
    return claimed;
  } catch (err) {
    console.error("[claim-guest-bookings] failed", err);
    return 0;
  }
}

function firstText(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

/** Fill name / phone / DOB / licence vault from the guest booking just claimed. */
async function hydrateAccountFromBookings(userId: string, email: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const [userHit, guestHit] = await Promise.all([
    supabase
      .from("user_bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("guest_booking_index")
      .select("*")
      .eq("email", email.trim().toLowerCase())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);
  const row = (userHit.data ?? guestHit.data) as Record<string, unknown> | null;
  if (!row) {
    await backfillLicenceFromBooking(supabase, userId, email).catch(() => undefined);
    return;
  }

  const { data: userData } = await supabase.auth.admin.getUserById(userId);
  const meta = userData.user?.user_metadata ?? {};
  const firstName = firstText(meta.first_name, meta.firstName, row.driver_first_name);
  const lastName = firstText(meta.last_name, meta.lastName, row.driver_last_name);
  const phone = firstText(meta.phone, row.driver_phone);
  const dob = firstText(meta.dob, meta.date_of_birth, row.driver_dob);
  const country = firstText(meta.country, row.driver_country) ?? "LB";

  await supabase.auth.admin.updateUserById(userId, {
    data: {
      ...meta,
      ...(firstName ? { first_name: firstName } : {}),
      ...(lastName ? { last_name: lastName } : {}),
      ...(phone ? { phone } : {}),
      ...(dob ? { dob } : {}),
      country,
    },
  });

  await backfillLicenceFromBooking(supabase, userId, email).catch(() => undefined);
}
