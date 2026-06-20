import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function insertContactEnquiry(input: {
  fullName: string;
  email: string;
  mobile?: string;
  subject: string;
  bookingRef?: string;
  message: string;
}): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("contact_enquiries")
    .insert({
      full_name: input.fullName,
      email: input.email.toLowerCase(),
      mobile: input.mobile ?? null,
      subject: input.subject,
      booking_ref: input.bookingRef ?? null,
      message: input.message,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export type ContactLeadRow = {
  id: string;
  kind: "contact";
  status: string;
  payload: Record<string, unknown>;
  submittedAt: string;
};

export async function listContactLeads(): Promise<ContactLeadRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("contact_enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id as string,
    kind: "contact" as const,
    status: row.status as string,
    payload: {
      fullName: row.full_name,
      email: row.email,
      mobile: row.mobile,
      subject: row.subject,
      bookingRef: row.booking_ref,
      message: row.message,
    },
    submittedAt: row.created_at as string,
  }));
}

export async function updateContactLeadStatus(
  id: string,
  status: string,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("contact_enquiries").update({ status }).eq("id", id);
  if (error) throw new Error(error.message);
}
