import { NextResponse } from "next/server";
import { createRouteHandlerSupabaseClient } from "@/lib/supabase/route-handler";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { deleteAllUserDocuments } from "@/lib/supabase/user-documents-repository";
import { removeAllSavedVehicles } from "@/lib/supabase/saved-vehicles-repository";

/**
 * DELETE /api/account — permanently deletes the caller's own account.
 *
 * This is a hard delete for personal/profile data but a *soft* detach for
 * bookings, matching the account page's own copy ("past bookings stay in
 * our records for tax and insurance compliance"):
 *
 * - `profiles` cascades (its `id` references `auth.users(id) on delete
 *   cascade`); `saved_vehicles` and `user_documents` were provisioned
 *   outside the tracked migrations, so cleaned up explicitly here —
 *   including the underlying storage files — before deleting the auth user.
 * - `user_bookings` rows are deliberately kept: its FK is `on delete set
 *   null` (see migration 20260821_000001), so the booking survives with
 *   `user_id = null` — still visible in the admin bookings dashboard,
 *   still carrying its own `customer_email`/vehicle/date snapshot, but no
 *   longer reachable from any account's own booking list.
 * - `guest_booking_index` is left alone too — `claimGuestBookingsForUser`
 *   now skips any reference already present in `user_bookings` (regardless
 *   of user_id), so a booking claimed once never gets silently re-claimed
 *   into a new account that happens to share the deleted account's email.
 */
export async function DELETE() {
  const { supabase, applySupabaseCookies } = await createRouteHandlerSupabaseClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  const userId = data.user.id;

  try {
    await deleteAllUserDocuments(supabase, userId);
    await removeAllSavedVehicles(supabase, userId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to clean up account data.";
    return NextResponse.json({ message }, { status: 500 });
  }

  const admin = getSupabaseAdminClient();
  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    return NextResponse.json(
      { message: deleteError.message || "Failed to delete account." },
      { status: 500 },
    );
  }

  await supabase.auth.signOut();

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 0,
    path: "/",
  });
  return applySupabaseCookies(response);
}
