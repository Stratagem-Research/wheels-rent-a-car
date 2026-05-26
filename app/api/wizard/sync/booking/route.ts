import { NextResponse } from "next/server";
import { z } from "zod";
import { dispatchWizardSync } from "@/lib/server/wizard-sync";
import type { WebsiteBookingLifecycleState } from "@/lib/api/wheels-public";

const SyncBookingSchema = z.object({
  bookingReference: z.string().min(1),
  lifecycleState: z.enum([
    "pending",
    "confirmed",
    "completed",
    "cancelled",
    "cancel_requested",
    "change_requested",
    "refund_requested",
  ] satisfies [WebsiteBookingLifecycleState, ...WebsiteBookingLifecycleState[]]),
  paymentStatus: z.string().optional(),
  paidAmount: z.number().nonnegative().optional(),
  paymentMethod: z.string().optional(),
  paymentReference: z.string().optional(),
  paymentDate: z.string().optional(),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = SyncBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid sync payload." }, { status: 400 });
  }

  try {
    await dispatchWizardSync(parsed.data.bookingReference, {
      lifecycleState: parsed.data.lifecycleState,
      paymentStatus: parsed.data.paymentStatus,
      paidAmount: parsed.data.paidAmount,
      paymentMethod: parsed.data.paymentMethod,
      paymentReference: parsed.data.paymentReference,
      paymentDate: parsed.data.paymentDate,
      message: parsed.data.message,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Sync failed." },
      { status: 502 },
    );
  }
}
