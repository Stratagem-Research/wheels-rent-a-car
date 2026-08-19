import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import {
  deleteVehicleBookingHold,
  listAdminBookingHolds,
} from "@/lib/supabase/vehicle-booking-holds-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

const ReleaseSchema = z.object({
  bookingReference: z.string().min(1),
});

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listAdminBookingHolds();
    const counters = {
      total: items.length,
      reducing: items.filter((item) => item.reducingCount).length,
      onRent: items.filter((item) => item.status === "on-rent").length,
      upcoming: items.filter((item) => item.status === "upcoming").length,
      ended: items.filter((item) => item.status === "ended").length,
      account: items.filter((item) => item.customerType === "account").length,
      guest: items.filter((item) => item.customerType === "guest").length,
    };
    return NextResponse.json({ items, counters });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load booking holds.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const body = await request.json().catch(() => null);
  const parsed = ReleaseSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "bookingReference is required." }, { status: 400 });
  }
  try {
    await deleteVehicleBookingHold(parsed.data.bookingReference);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "vehicle_booking_holds",
      action: "release",
      details: { bookingReference: parsed.data.bookingReference },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to release hold.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
