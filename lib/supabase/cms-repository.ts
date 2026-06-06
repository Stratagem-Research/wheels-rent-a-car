import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { CorporateTier, FaqGroup, Itinerary, Trip } from "@/types/domain";

type TripRow = {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: Trip["coverImage"];
  meta: string;
  region: string;
  body: string;
  suggested_vehicle_category: string;
  tags: string[];
  published_at: string;
  updated_at: string;
};

type ItineraryRow = {
  slug: string;
  title: string;
  excerpt: string;
  cover_image: Itinerary["coverImage"];
  category: string;
  duration: string;
  price_from_cents: number;
  highlights: string[];
  schedule: Itinerary["schedule"];
  vehicle_class: string;
  updated_at: string;
};

type FaqGroupRow = { id: string; title: string; sort_order: number };
type FaqEntryRow = {
  id: string;
  group_id: string;
  question: string;
  answer: string;
  sort_order: number;
};

type CorporateRow = {
  id: string;
  name: string;
  tagline: string;
  per_day_cents: number | null;
  fleet_size: string;
  inclusions: string[];
  popular: boolean;
  cta_label: string | null;
  sort_order: number;
};

function tripFromRow(row: TripRow): Trip {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    meta: row.meta,
    region: row.region as Trip["region"],
    body: row.body,
    suggestedVehicleCategory: row.suggested_vehicle_category as Trip["suggestedVehicleCategory"],
    tags: row.tags ?? [],
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

function tripToRow(trip: Trip): TripRow {
  return {
    slug: trip.slug,
    title: trip.title,
    excerpt: trip.excerpt,
    cover_image: trip.coverImage,
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
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    category: row.category as Itinerary["category"],
    duration: row.duration,
    priceFromCents: row.price_from_cents,
    highlights: row.highlights ?? [],
    schedule: row.schedule ?? [],
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
    schedule: itinerary.schedule,
    vehicle_class: itinerary.vehicleClass,
    updated_at: itinerary.updatedAt,
  };
}

function corporateFromRow(row: CorporateRow): CorporateTier {
  return {
    id: row.id,
    name: row.name,
    tagline: row.tagline,
    perDayCents: row.per_day_cents,
    fleetSize: row.fleet_size,
    inclusions: row.inclusions ?? [],
    popular: row.popular || undefined,
    ctaLabel: row.cta_label ?? undefined,
  };
}

function corporateToRow(tier: CorporateTier, sortOrder: number): CorporateRow {
  return {
    id: tier.id,
    name: tier.name,
    tagline: tier.tagline,
    per_day_cents: tier.perDayCents,
    fleet_size: tier.fleetSize,
    inclusions: tier.inclusions,
    popular: tier.popular ?? false,
    cta_label: tier.ctaLabel ?? null,
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
      question: row.question,
      answer: row.answer,
    });
    entriesByGroup.set(row.group_id, list);
  }

  return ((groups ?? []) as FaqGroupRow[]).map((group) => ({
    id: group.id,
    title: group.title,
    entries: entriesByGroup.get(group.id) ?? [],
  }));
}

export async function replaceFaqsInDb(items: FaqGroup[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const groupRows: FaqGroupRow[] = items.map((group, index) => ({
    id: group.id,
    title: group.title,
    sort_order: index,
  }));
  const entryRows: FaqEntryRow[] = items.flatMap((group) =>
    group.entries.map((entry, index) => ({
      id: entry.id,
      group_id: group.id,
      question: entry.question,
      answer: entry.answer,
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
