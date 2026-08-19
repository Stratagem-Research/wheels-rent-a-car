import type { AddOn, CarWashPackage, LongTermTier, ProtectionTier } from "@/types/domain";
import {
  ADD_ONS as FALLBACK_ADDONS,
  CAR_WASH_PACKAGES as FALLBACK_CAR_WASH,
  LONG_TERM_TIERS as FALLBACK_LONG_TERM,
  PROTECTION_TIERS as FALLBACK_PROTECTION,
} from "@/lib/api/fixtures/catalog";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { toLocalizedString } from "@/lib/i18n/localized";

type AddOnRow = {
  id: string;
  name: string;
  description: string;
  category: AddOn["category"];
  pricing: AddOn["pricing"];
  price_cents: number;
  multi_quantity: boolean;
  max_quantity: number | null;
  quantity_unit: "gb" | null;
  icon: string;
  sort_order: number;
  active: boolean;
};

type ProtectionRow = {
  id: string;
  name: string;
  description: string;
  per_day_cents: number;
  deductible_cents: number;
  inclusions: string[];
  popular: boolean;
  sort_order: number;
  active: boolean;
};

type LongTermRow = {
  id: string;
  duration_months: number;
  per_day_cents: number;
  savings_percent: number;
  inclusions: string[];
  popular: boolean;
  sort_order: number;
  active: boolean;
};

type CarWashRow = {
  id: string;
  name: unknown;
  description: unknown;
  duration_minutes: number;
  turnaround_hours: number | null;
  currency: CarWashPackage["currency"];
  pricing_mode: CarWashPackage["pricingMode"];
  price_cents: number | null;
  price_lbp: number | null;
  vehicle_prices: CarWashPackage["vehiclePrices"] | null;
  quote_only: boolean;
  popular: boolean;
  icon: string;
  sort_order: number;
  active: boolean;
};

function coerceLocalizedField(value: unknown): CarWashPackage["name"] {
  return toLocalizedString(value);
}

function toAddOn(row: AddOnRow): AddOn {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    pricing: row.pricing,
    priceCents: row.price_cents,
    multiQuantity: row.multi_quantity,
    maxQuantity: row.max_quantity ?? undefined,
    quantityUnit: row.quantity_unit === "gb" ? "gb" : undefined,
    icon: row.icon,
  };
}

function toProtectionTier(row: ProtectionRow): ProtectionTier {
  return {
    id: row.id,
    name: row.name,
    perDayCents: row.per_day_cents,
    deductibleCents: row.deductible_cents,
    inclusions: row.inclusions ?? [],
    popular: row.popular,
  };
}

function toLongTermTier(row: LongTermRow): LongTermTier {
  return {
    id: row.id,
    durationMonths: row.duration_months as LongTermTier["durationMonths"],
    perDayCents: row.per_day_cents,
    savingsPercent: row.savings_percent,
    inclusions: row.inclusions ?? [],
    popular: row.popular || undefined,
  };
}

function toCarWashPackage(row: CarWashRow): CarWashPackage {
  return {
    id: row.id,
    name: coerceLocalizedField(row.name),
    description: coerceLocalizedField(row.description),
    durationMinutes: row.duration_minutes,
    turnaroundHours: row.turnaround_hours ?? undefined,
    currency: row.currency,
    pricingMode: row.pricing_mode,
    priceCents: row.price_cents ?? undefined,
    priceLbp: row.price_lbp ?? undefined,
    vehiclePrices: row.vehicle_prices ?? undefined,
    quoteOnly: row.quote_only || undefined,
    popular: row.popular || undefined,
    icon: row.icon,
    active: row.active,
  };
}

export async function listAddOnsFromDb(): Promise<AddOn[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("catalog_addons")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as AddOnRow[];
  if (rows.length === 0) return FALLBACK_ADDONS;
  return rows.map(toAddOn);
}

export async function listProtectionTiersFromDb(): Promise<ProtectionTier[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("catalog_protection_tiers")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ProtectionRow[];
  if (rows.length === 0) return FALLBACK_PROTECTION;
  return rows.map(toProtectionTier);
}

export async function listLongTermTiersFromDb(): Promise<LongTermTier[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("catalog_long_term_tiers")
    .select("*")
    .eq("active", true)
    .order("sort_order");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as LongTermRow[];
  if (rows.length === 0) return FALLBACK_LONG_TERM;
  return rows.map(toLongTermTier);
}

export async function listCarWashPackagesFromDb(activeOnly = true): Promise<CarWashPackage[]> {
  const supabase = getSupabaseAdminClient();
  let query = supabase.from("catalog_car_wash_packages").select("*").order("sort_order");
  if (activeOnly) query = query.eq("active", true);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as CarWashRow[];
  if (rows.length === 0) return FALLBACK_CAR_WASH;
  return rows.map(toCarWashPackage);
}

export async function replaceAddOnsInDb(items: AddOn[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase.from("catalog_addons").delete().neq("id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const rows = items.map((item, index) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    pricing: item.pricing,
    price_cents: item.priceCents,
    multi_quantity: item.multiQuantity,
    max_quantity: item.maxQuantity ?? null,
    quantity_unit: item.quantityUnit ?? null,
    icon: item.icon,
    sort_order: index,
    active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("catalog_addons").insert(rows);
  if (error) throw new Error(error.message);
}

export async function replaceProtectionTiersInDb(items: ProtectionTier[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase
    .from("catalog_protection_tiers")
    .delete()
    .neq("id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const rows = items.map((item, index) => ({
    id: item.id,
    name: item.name,
    description: "",
    per_day_cents: item.perDayCents,
    deductible_cents: item.deductibleCents,
    inclusions: item.inclusions,
    popular: item.popular,
    sort_order: index,
    active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("catalog_protection_tiers").insert(rows);
  if (error) throw new Error(error.message);
}

export async function replaceLongTermTiersInDb(items: LongTermTier[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase
    .from("catalog_long_term_tiers")
    .delete()
    .neq("id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const rows = items.map((item, index) => ({
    id: item.id,
    duration_months: item.durationMonths,
    per_day_cents: item.perDayCents,
    savings_percent: item.savingsPercent,
    inclusions: item.inclusions,
    popular: item.popular ?? false,
    sort_order: index,
    active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("catalog_long_term_tiers").insert(rows);
  if (error) throw new Error(error.message);
}

export async function replaceCarWashPackagesInDb(items: CarWashPackage[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase
    .from("catalog_car_wash_packages")
    .delete()
    .neq("id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const rows = items.map((item, index) => ({
    id: item.id,
    name: toLocalizedString(item.name),
    description: toLocalizedString(item.description),
    duration_minutes: item.durationMinutes,
    turnaround_hours: item.turnaroundHours ?? null,
    currency: item.currency,
    pricing_mode: item.pricingMode,
    price_cents: item.priceCents ?? null,
    price_lbp: item.priceLbp ?? null,
    vehicle_prices: item.vehiclePrices ?? null,
    quote_only: item.quoteOnly ?? false,
    popular: item.popular ?? false,
    icon: item.icon,
    sort_order: index,
    active: item.active ?? true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("catalog_car_wash_packages").insert(rows);
  if (error) throw new Error(error.message);
}
