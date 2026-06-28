import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type PromoCodeRow = {
  code: string;
  discount_percent: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

export async function findPromoCode(code: string): Promise<PromoCodeRow | null> {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return null;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("promo_codes")
    .select("code, discount_percent, active, starts_at, ends_at")
    .eq("code", normalized)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PromoCodeRow | null) ?? null;
}
