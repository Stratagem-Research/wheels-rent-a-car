import { NextResponse } from "next/server";
import { z } from "zod";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { cancelManualBooking, confirmManualBooking } from "@/lib/server/manual-booking-ops";

const BodySchema = z.object({
  bookingReference: z.string().min(1),
  action: z.enum(["confirm", "cancel"]),
});

export async function POST(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const parsed = BodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ message: "bookingReference and action are required." }, { status: 400 });
  }

  try {
    const result =
      parsed.data.action === "confirm"
        ? await confirmManualBooking(parsed.data.bookingReference)
        : await cancelManualBooking(parsed.data.bookingReference);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "website_bookings",
      action: parsed.data.action,
      details: { bookingReference: parsed.data.bookingReference, enqueued: result.enqueued },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update booking.";
    const status = /only available for website-only/.test(message) ? 400 : 500;
    return NextResponse.json({ message }, { status });
  }
}
