import { NextResponse } from "next/server";
import { z } from "zod";
import { insertCorporateLead } from "@/lib/supabase/admin-repository";

const CorporateLeadSchema = z.object({
  company: z.string().min(1),
  name: z.string().min(1),
  jobTitle: z.string().optional(),
  email: z.string().email(),
  mobile: z.string().min(6),
  tier: z.string().optional(),
  urgency: z.string().optional(),
  notes: z.string().optional(),
  marketing: z.boolean().optional().default(false),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CorporateLeadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid corporate enquiry payload." }, { status: 400 });
  }
  try {
    const id = await insertCorporateLead({
      company: parsed.data.company.trim(),
      fullName: parsed.data.name.trim(),
      jobTitle: parsed.data.jobTitle?.trim(),
      email: parsed.data.email.trim().toLowerCase(),
      mobile: parsed.data.mobile.trim(),
      tier: parsed.data.tier?.trim(),
      urgency: parsed.data.urgency?.trim(),
      notes: parsed.data.notes?.trim(),
      marketing: parsed.data.marketing ?? false,
    });
    return NextResponse.json({ id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to submit corporate enquiry.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
