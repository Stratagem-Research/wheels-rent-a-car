import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export interface RecordPaymentEventInput {
  bookingReference: string;
  provider: "whish" | "manual";
  externalId?: number;
  status: string;
  currency?: string;
  amount?: number;
  payload?: Record<string, unknown>;
}

export async function recordPaymentEvent(input: RecordPaymentEventInput): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("payment_events").upsert(
    {
      booking_reference: input.bookingReference,
      provider: input.provider,
      external_id: input.externalId,
      status: input.status,
      currency: input.currency ?? "USD",
      amount: input.amount ?? null,
      payload: input.payload ?? {},
      processed_at:
        input.status === "success" || input.status === "paid" ? new Date().toISOString() : null,
    },
    { onConflict: "external_id" },
  );
  if (error) throw error;
}

export async function appendBookingState(
  bookingReference: string,
  state: string,
  details: Record<string, unknown> = {},
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("booking_state_timeline").insert({
    booking_reference: bookingReference,
    state,
    source: "website",
    details,
  });
  if (error) throw error;
}

export async function getPaymentEventByExternalId(externalId: number) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_events")
    .select("booking_reference, currency, amount, status, payload")
    .eq("external_id", externalId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}
