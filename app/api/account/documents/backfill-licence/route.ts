import { NextResponse } from "next/server";
import { requireAccountUser } from "@/lib/server/account-auth";
import { backfillLicenceFromBooking } from "@/lib/supabase/user-documents-repository";

/**
 * POST /api/account/documents/backfill-licence — called on the
 * account/documents page load. If the account has no licence document yet,
 * pulls the scan storage paths off the customer's own booking history
 * (captured during guest checkout, see lib/booking/stored-booking.ts) and
 * saves them as a real document, so the profile is filled in even if the
 * one-shot register-page handoff (lib/booking/pending-licence.ts) was
 * missed.
 */
export async function POST() {
  const auth = await requireAccountUser();
  if (!auth.ok) return auth.response;

  try {
    const document = await backfillLicenceFromBooking(
      auth.supabase,
      auth.user.id,
      auth.user.email ?? undefined,
    );
    return NextResponse.json({ document });
  } catch {
    return NextResponse.json({ document: null });
  }
}
