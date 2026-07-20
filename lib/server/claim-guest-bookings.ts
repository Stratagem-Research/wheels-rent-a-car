import { claimGuestBookingsForUser } from "@/lib/supabase/user-bookings-repository";

/**
 * Claim guest bookings indexed under the user's email after auth.
 * Non-blocking: auth succeeds even if claim fails.
 */
export async function claimGuestBookingsAfterAuth(
  userId: string,
  email: string,
): Promise<number> {
  try {
    return await claimGuestBookingsForUser(userId, email);
  } catch (err) {
    console.error("[claim-guest-bookings] failed", err);
    return 0;
  }
}
