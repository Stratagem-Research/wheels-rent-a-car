import { NextResponse } from "next/server";
import { z } from "zod";
import { insertChauffeurLead } from "@/lib/supabase/admin-repository";

const ChauffeurLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(6),
  serviceType: z.string().optional(),
  vehicleClass: z.string().optional(),
  tripDate: z.string().optional(),
  passengers: z.number().int().positive().optional(),
  pickupLocation: z.string().optional(),
  notes: z.string().optional(),
  marketing: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ChauffeurLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid chauffeur enquiry payload." }, { status: 400 });
  }
  try {
    const id = await insertChauffeurLead({
      fullName: parsed.data.name.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      mobile: parsed.data.mobile.trim(),
      serviceType: parsed.data.serviceType?.trim(),
      vehicleClass: parsed.data.vehicleClass?.trim(),
      tripDate: parsed.data.tripDate?.trim(),
      passengers: parsed.data.passengers,
      pickupLocation: parsed.data.pickupLocation?.trim(),
      notes: parsed.data.notes?.trim(),
      marketing: parsed.data.marketing ?? false,
    });
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit chauffeur enquiry.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
