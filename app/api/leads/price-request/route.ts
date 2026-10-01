import { NextResponse } from "next/server";
import { z } from "zod";
import { insertPriceRequestLead } from "@/lib/supabase/admin-repository";

const PriceRequestSchema = z.object({
  vehicleId: z.string().min(1),
  vehicleTitle: z.string().optional(),
  email: z.string().email(),
  phone: z.string().min(1),
  daysNeeded: z.number().int().min(1).max(365),
  startDate: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = PriceRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid price request payload." }, { status: 400 });
  }
  try {
    const id = await insertPriceRequestLead({
      vehicleId: parsed.data.vehicleId,
      vehicleTitle: parsed.data.vehicleTitle?.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      phone: parsed.data.phone.trim(),
      daysNeeded: parsed.data.daysNeeded,
      startDate: parsed.data.startDate,
      notes: parsed.data.notes?.trim(),
    });
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit price request.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
