import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const LongTermEnquirySchema = z
  .object({
    fullName: z.string().min(1).optional(),
    name: z.string().min(1).optional(),
    company: z.string().optional(),
    mobile: z.string().optional(),
    duration: z.string().optional(),
    vehicleClasses: z.array(z.string()).optional(),
    startDate: z.string().optional(),
    deliveryAddress: z.string().optional(),
    marketing: z.boolean().optional(),
    full_name: z.string().min(1).optional(),
    email: z.string().email(),
    phone: z.string().optional(),
    durationMonths: z.number().int().positive().optional(),
    vehicleCategory: z.string().optional(),
    notes: z.string().optional(),
  })
  .transform((value) => {
    const durationFromLegacy = value.duration ? Number.parseInt(value.duration, 10) : null;
    return {
      fullName: value.fullName ?? value.full_name ?? value.name ?? "",
      phone: value.phone ?? value.mobile,
      durationMonths:
        value.durationMonths ??
        (Number.isFinite(durationFromLegacy) && durationFromLegacy && durationFromLegacy > 0
          ? durationFromLegacy
          : 3),
      vehicleCategory: value.vehicleCategory ?? value.vehicleClasses?.[0],
      notes: value.notes,
      email: value.email,
    };
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = LongTermEnquirySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid long-term enquiry payload." }, { status: 400 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("long_term_enquiries")
    .insert({
      full_name: parsed.data.fullName,
      email: parsed.data.email.toLowerCase(),
      phone: parsed.data.phone ?? null,
      duration_months: parsed.data.durationMonths,
      vehicle_category: parsed.data.vehicleCategory ?? null,
      notes: parsed.data.notes ?? null,
      metadata: {},
    })
    .select("id")
    .single();
  if (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
