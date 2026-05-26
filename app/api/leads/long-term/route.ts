import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const LongTermEnquirySchema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  durationMonths: z.number().int().positive(),
  vehicleCategory: z.string().optional(),
  notes: z.string().optional(),
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
