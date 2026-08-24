import { NextResponse } from "next/server";
import { getAdminBookingDetail } from "@/lib/supabase/admin-bookings-repository";
import { requireAdminSession } from "@/lib/server/admin-api";

export async function GET(
  request: Request,
  context: { params: Promise<{ ref: string }> },
) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const { ref } = await context.params;
    const detail = await getAdminBookingDetail(decodeURIComponent(ref));
    if (!detail) {
      return NextResponse.json({ message: "Booking not found." }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" &&
            error &&
            "message" in error &&
            typeof error.message === "string"
          ? error.message
          : "Failed to load booking.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
