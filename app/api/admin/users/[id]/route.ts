import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { toDomainUser } from "@/lib/auth/map-user";
import { requireAdminSession } from "@/lib/server/admin-api";
import { listUserBookings } from "@/lib/supabase/user-bookings-repository";
import { listSavedVehicles } from "@/lib/supabase/saved-vehicles-repository";
import { listUserDocuments } from "@/lib/supabase/user-documents-repository";

/**
 * GET /api/admin/users/[id] — everything one customer has saved: profile
 * (Supabase Auth user_metadata), booking history, saved vehicles, and
 * uploaded documents (with signed scan URLs). Fetched on demand when an
 * admin expands a row, not upfront for the whole paginated list.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;

  const { id } = await context.params;

  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.admin.getUserById(id);
    if (error || !data.user) {
      return NextResponse.json({ message: "Account not found." }, { status: 404 });
    }

    const [bookings, savedVehicles, documents] = await Promise.all([
      listUserBookings(supabase, id),
      listSavedVehicles(supabase, id),
      listUserDocuments(supabase, id),
    ]);

    return NextResponse.json({
      user: toDomainUser(data.user),
      bookings,
      savedVehicles,
      documents,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load account details.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
