import { NextResponse } from "next/server";
import { z } from "zod";
import { insertFleetPartnershipLead } from "@/lib/supabase/admin-repository";

const FleetPartnershipLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(6),
  companyName: z.string().optional(),
  vehicleCount: z.string().optional(),
  notes: z.string().optional(),
  marketing: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = FleetPartnershipLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid fleet partnership enquiry payload." },
      { status: 400 },
    );
  }
  try {
    const id = await insertFleetPartnershipLead({
      fullName: parsed.data.name.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      mobile: parsed.data.mobile.trim(),
      companyName: parsed.data.companyName?.trim(),
      vehicleCount: parsed.data.vehicleCount?.trim(),
      notes: parsed.data.notes?.trim(),
      marketing: parsed.data.marketing ?? false,
    });
    return NextResponse.json({ id });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to submit fleet partnership enquiry.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
