import { NextResponse } from "next/server";
import { z } from "zod";
import { insertContactEnquiry } from "@/lib/supabase/contact-repository";

const ContactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  mobile: z.string().optional(),
  subject: z.string().min(1),
  bookingRef: z.string().optional(),
  message: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = ContactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid contact payload." }, { status: 400 });
  }
  try {
    const id = await insertContactEnquiry({
      fullName: parsed.data.name.trim(),
      email: parsed.data.email.trim(),
      mobile: parsed.data.mobile?.trim(),
      subject: parsed.data.subject.trim(),
      bookingRef: parsed.data.bookingRef?.trim(),
      message: parsed.data.message.trim(),
    });
    return NextResponse.json({ id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to submit contact form.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
