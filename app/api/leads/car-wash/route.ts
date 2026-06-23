import { NextResponse } from "next/server";
import { z } from "zod";
import { insertCarWashLead } from "@/lib/supabase/admin-repository";

const CarWashLeadSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().min(6),
  packageId: z.string().optional(),
  vehicleClass: z.enum(["car", "suv"]).optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  vehicleMakeModel: z.string().optional(),
  notes: z.string().optional(),
  marketing: z.boolean().optional().default(false),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CarWashLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid car wash enquiry payload." }, { status: 400 });
  }
  try {
    const id = await insertCarWashLead({
      fullName: parsed.data.name.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      mobile: parsed.data.mobile.trim(),
      packageId: parsed.data.packageId?.trim(),
      vehicleClass: parsed.data.vehicleClass,
      preferredDate: parsed.data.preferredDate?.trim(),
      preferredTime: parsed.data.preferredTime?.trim(),
      vehicleMakeModel: parsed.data.vehicleMakeModel?.trim(),
      notes: parsed.data.notes?.trim(),
      marketing: parsed.data.marketing ?? false,
      metadata: parsed.data.metadata,
    });
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit car wash enquiry.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
