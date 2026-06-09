import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CorporateTier, FaqGroup, Itinerary, Trip } from "@/types/domain";
import {
  toLocalizedString,
  toLocalizedStringArray,
  isLocalizedString,
  isLocalizedStringArray,
  type LocalizedValue,
  type LocalizedArrayValue,
} from "@/lib/i18n/localized";

/**
 * Coerce a raw jsonb column into a value the localized renderer understands.
 *
 * Guards the "raw JSON on screen" failure mode: if a localized object was
 * accidentally persisted as a JSON *string* (e.g. '{"en":"…","ar":"…"}'), the
 * renderer would otherwise print it verbatim. We parse such strings back into
 * an object; anything else falls back to a plain string (wrapped as `en`).
 */
function coerceLocalized(value: unknown): LocalizedValue {
  if (isLocalizedString(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (isLocalizedString(parsed)) return parsed;
      } catch {
        // Not JSON — treat as a plain English string below.
      }
    }
    return value;
  }
  return "";
}

function coerceLocalizedArray(value: unknown): LocalizedArrayValue {
  if (isLocalizedStringArray(value)) return value;
  if (Array.isArray(value)) return value as string[];
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (isLocalizedStringArray(parsed)) return parsed;
        if (Array.isArray(parsed)) return parsed as string[];
      } catch {
        // Not JSON — fall through to empty.
      }
    }
  }
  return [];
}

type TripRow = {
  slug: string;
  title: unknown;
  excerpt: unknown;
  cover_image: Trip["coverImage"];
  meta: unknown;
  region: string;
  body: unknown;
  suggested_vehicle_category: string;
  tags: unknown;
  published_at: string;
  updated_at: string;
};

type ItineraryRow = {
  slug: string;
  title: unknown;
  excerpt: unknown;
  cover_image: Itinerary["coverImage"];
  category: string;
  duration: unknown;
  price_from_cents: number;
  highlights: unknown;
  schedule: Itinerary["schedule"];
  vehicle_class: string;
  updated_at: string;
};

type FaqGroupRow = { id: string; title: unknown; sort_order: number };
type FaqEntryRow = {
  id: string;
  group_id: string;
  question: unknown;
  answer: unknown;
  sort_order: number;
};

type CorporateRow = {
  id: string;
  name: unknown;
  tagline: unknown;
  per_day_cents: number | null;
  fleet_size: unknown;
  inclusions: unknown;
  popular: boolean;
  cta_label: unknown;
  sort_order: number;
};

function tripFromRow(row: TripRow): Trip {
  return {
    slug: row.slug,
    title: toLocalizedString(coerceLocalized(row.title)),
    excerpt: toLocalizedString(coerceLocalized(row.excerpt)),
    coverImage: {
      ...row.cover_image,
      alt: toLocalizedString(coerceLocalized(row.cover_image?.alt)),
    },
    meta: toLocalizedString(coerceLocalized(row.meta)),
    region: row.region as Trip["region"],
    body: toLocalizedString(coerceLocalized(row.body)),
    suggestedVehicleCategory: row.suggested_vehicle_category as Trip["suggestedVehicleCategory"],
    tags: toLocalizedStringArray(coerceLocalizedArray(row.tags)),
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

function tripToRow(trip: Trip): TripRow {
  return {
    slug: trip.slug,
    title: trip.title,
    excerpt: trip.excerpt,
    cover_image: { ...trip.coverImage, alt: toLocalizedString(trip.coverImage.alt) },
    meta: trip.meta,
    region: trip.region,
    body: trip.body,
    suggested_vehicle_category: trip.suggestedVehicleCategory,
    tags: trip.tags,
    published_at: trip.publishedAt,
    updated_at: trip.updatedAt,
  };
}

function itineraryFromRow(row: ItineraryRow): Itinerary {
  return {
    slug: row.slug,
    title: toLocalizedString(coerceLocalized(row.title)),
    excerpt: toLocalizedString(coerceLocalized(row.excerpt)),
    coverImage: {
      ...row.cover_image,
      alt: toLocalizedString(coerceLocalized(row.cover_image?.alt)),
    },
    category: row.category as Itinerary["category"],
    duration: toLocalizedString(coerceLocalized(row.duration)),
    priceFromCents: row.price_from_cents,
    highlights: toLocalizedStringArray(coerceLocalizedArray(row.highlights)),
    schedule: (row.schedule ?? []).map((step) => ({
      ...step,
      title: toLocalizedString(coerceLocalized(step.title)),
      body: step.body === undefined ? undefined : toLocalizedString(coerceLocalized(step.body)),
    })),
    vehicleClass: row.vehicle_class as Itinerary["vehicleClass"],
    updatedAt: row.updated_at,
  };
}

function itineraryToRow(itinerary: Itinerary): ItineraryRow {
  return {
    slug: itinerary.slug,
    title: itinerary.title,
    excerpt: itinerary.excerpt,
    cover_image: itinerary.coverImage,
    category: itinerary.category,
    duration: itinerary.duration,
    price_from_cents: itinerary.priceFromCents,
    highlights: itinerary.highlights,
    schedule: itinerary.schedule.map((step) => ({
      ...step,
      title: toLocalizedString(step.title),
      body: step.body ? toLocalizedString(step.body) : undefined,
    })),
    vehicle_class: itinerary.vehicleClass,
    updated_at: itinerary.updatedAt,
  };
}

function corporateFromRow(row: CorporateRow): CorporateTier {
  return {
    id: row.id,
    name: toLocalizedString(coerceLocalized(row.name)),
    tagline: toLocalizedString(coerceLocalized(row.tagline)),
    perDayCents: row.per_day_cents,
    fleetSize: toLocalizedString(coerceLocalized(row.fleet_size)),
    inclusions: toLocalizedStringArray(coerceLocalizedArray(row.inclusions)),
    popular: row.popular || undefined,
    ctaLabel:
      row.cta_label === null || row.cta_label === undefined
        ? undefined
        : toLocalizedString(coerceLocalized(row.cta_label)),
  };
}

function corporateToRow(tier: CorporateTier, sortOrder: number): CorporateRow {
  return {
    id: tier.id,
    name: toLocalizedString(tier.name),
    tagline: toLocalizedString(tier.tagline),
    per_day_cents: tier.perDayCents,
    fleet_size: toLocalizedString(tier.fleetSize),
    inclusions: toLocalizedStringArray(tier.inclusions),
    popular: tier.popular ?? false,
    cta_label: tier.ctaLabel ? toLocalizedString(tier.ctaLabel) : null,
    sort_order: sortOrder,
  };
}

export async function listTripsFromDb(): Promise<Trip[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_trips")
    .select("*")
    .order("published_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as TripRow[]).map(tripFromRow);
}

export async function replaceTripsInDb(items: Trip[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase.from("cms_trips").delete().neq("slug", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const { error } = await supabase.from("cms_trips").insert(items.map(tripToRow));
  if (error) throw new Error(error.message);
}

export async function listItinerariesFromDb(): Promise<Itinerary[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("cms_itineraries").select("*").order("slug");
  if (error) throw new Error(error.message);
  return ((data ?? []) as ItineraryRow[]).map(itineraryFromRow);
}

export async function replaceItinerariesInDb(items: Itinerary[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase.from("cms_itineraries").delete().neq("slug", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const { error } = await supabase.from("cms_itineraries").insert(items.map(itineraryToRow));
  if (error) throw new Error(error.message);
}

export async function listFaqsFromDb(): Promise<FaqGroup[]> {
  const supabase = getSupabaseAdminClient();
  const { data: groups, error: groupError } = await supabase
    .from("cms_faq_groups")
    .select("*")
    .order("sort_order");
  if (groupError) throw new Error(groupError.message);

  const { data: entries, error: entryError } = await supabase
    .from("cms_faq_entries")
    .select("*")
    .order("sort_order");
  if (entryError) throw new Error(entryError.message);

  const entriesByGroup = new Map<string, FaqGroup["entries"]>();
  for (const row of (entries ?? []) as FaqEntryRow[]) {
    const list = entriesByGroup.get(row.group_id) ?? [];
    list.push({
      id: row.id,
      group: row.group_id,
      question: toLocalizedString(coerceLocalized(row.question)),
      answer: toLocalizedString(coerceLocalized(row.answer)),
    });
    entriesByGroup.set(row.group_id, list);
  }

  return ((groups ?? []) as FaqGroupRow[]).map((group) => ({
    id: group.id,
    title: toLocalizedString(coerceLocalized(group.title)),
    entries: entriesByGroup.get(group.id) ?? [],
  }));
}

export async function replaceFaqsInDb(items: FaqGroup[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const groupRows: FaqGroupRow[] = items.map((group, index) => ({
    id: group.id,
    title: toLocalizedString(group.title),
    sort_order: index,
  }));
  const entryRows: FaqEntryRow[] = items.flatMap((group) =>
    group.entries.map((entry, index) => ({
      id: entry.id,
      group_id: group.id,
      question: toLocalizedString(entry.question),
      answer: toLocalizedString(entry.answer),
      sort_order: index,
    })),
  );

  const { error: clearEntriesError } = await supabase
    .from("cms_faq_entries")
    .delete()
    .neq("id", "");
  if (clearEntriesError) throw new Error(clearEntriesError.message);
  const { error: clearGroupsError } = await supabase.from("cms_faq_groups").delete().neq("id", "");
  if (clearGroupsError) throw new Error(clearGroupsError.message);

  if (groupRows.length > 0) {
    const { error } = await supabase.from("cms_faq_groups").upsert(groupRows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }
  if (entryRows.length > 0) {
    const { error } = await supabase
      .from("cms_faq_entries")
      .upsert(entryRows, { onConflict: "id" });
    if (error) throw new Error(error.message);
  }
}

export async function listCorporateTiersFromDb(): Promise<CorporateTier[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_corporate_tiers")
    .select("*")
    .order("sort_order");
  if (error) throw new Error(error.message);
  return ((data ?? []) as CorporateRow[]).map(corporateFromRow);
}

export async function replaceCorporateTiersInDb(items: CorporateTier[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase.from("cms_corporate_tiers").delete().neq("id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const { error } = await supabase
    .from("cms_corporate_tiers")
    .insert(items.map((tier, index) => corporateToRow(tier, index)));
  if (error) throw new Error(error.message);
}
