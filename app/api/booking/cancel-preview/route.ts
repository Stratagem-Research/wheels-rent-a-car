import { NextResponse } from "next/server";
import { z } from "zod";
import { handleBookingCancelPreview } from "@/lib/server/booking-service";

const CancelPreviewSchema = z.object({
  ref: z.string().min(1),
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CancelPreviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid cancel preview payload." }, { status: 400 });
  }
  try {
    const result = await handleBookingCancelPreview(parsed.data);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ message: "Booking not found." }, { status: 404 });
  }
}
