import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type {
  Branch,
  DeliveryPricingSettings,
  LocalizedString,
  LocalizedStringArray,
  Vehicle,
} from "@/types/domain";
import { isLocalizedString, isLocalizedStringArray, toLocalizedString } from "@/lib/i18n/localized";
import { parseVehicleMedia, toPublicVehicleImages } from "@/lib/vehicles/vehicle-media";
import { composeVehicleTitle } from "@/lib/vehicles/display-name";
import { deletePageSeoByKeys, ensureVehicleSeoRows, vehiclePageKey } from "@/lib/supabase/seo-repository";

export type AdminLeadStatus = "new" | "in-progress" | "won" | "lost";

export type LongTermLead = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  duration_months: number;
  vehicle_category: string | null;
  notes: string | null;
  status: AdminLeadStatus;
  owner: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CorporateLead = {
  id: string;
  company: string;
  full_name: string;
  job_title: string | null;
  email: string;
  mobile: string;
  tier: string | null;
  urgency: string | null;
  notes: string | null;
  marketing: boolean;
  status: AdminLeadStatus;
  owner: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ChauffeurLead = {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  service_type: string | null;
  vehicle_class: string | null;
  trip_date: string | null;
  passengers: number | null;
  pickup_location: string | null;
  notes: string | null;
  marketing: boolean;
  status: AdminLeadStatus;
  owner: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type CarWashLead = {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  package_id: string | null;
  vehicle_class: string | null;
  preferred_date: string | null;
  preferred_time: string | null;
  vehicle_make_model: string | null;
  notes: string | null;
  marketing: boolean;
  metadata: Record<string, unknown>;
  status: AdminLeadStatus;
  owner: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type FleetPartnershipLead = {
  id: string;
  full_name: string;
  email: string;
  mobile: string;
  company_name: string | null;
  vehicle_count: string | null;
  notes: string | null;
  marketing: boolean;
  status: AdminLeadStatus;
  owner: string | null;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleMetadataRow = {
  frontend_vehicle_id: string;
  slug: string;
  title: string | null;
  brand: string | null;
  model: string | null;
  tagline: string | null;
  description: string | null;
  features: unknown;
  badges: unknown;
  media: unknown;
  operational: unknown;
  updated_at: string;
};

type VehicleWizardMapRow = {
  frontend_vehicle_id: string;
  wizard_vehicle_id: number;
};

type PromotionRow = {
  id: string;
  message: string;
  href: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
};

type AboutSectionRow = {
  id: string;
  story_paragraphs: unknown;
  pull_quote: unknown;
  fleet_heading: unknown;
  fleet_paragraphs: unknown;
  team_intro: unknown;
  team_dedication: unknown;
};

type AboutStatRow = {
  id: string;
  value: string;
  label: unknown;
  sort_order: number;
};

type AboutTeamRow = {
  id: string;
  name: string;
  role: unknown;
  photo: string;
  quote: unknown;
  bio: unknown;
  highlights: unknown;
  sort_order: number;
};

export type AboutStat = {
  value: string;
  label: LocalizedString;
};

export type AboutTeamMember = {
  name: string;
  role: LocalizedString;
  photo: string;
  quote?: LocalizedString;
  bio: LocalizedString;
  highlights?: LocalizedStringArray;
};

export type AboutContentData = {
  storyParagraphs: LocalizedStringArray;
  pullQuote: LocalizedString;
  fleetPhilosophy: {
    heading: LocalizedString;
    paragraphs: LocalizedStringArray;
  };
  stats: AboutStat[];
  teamIntro: LocalizedString;
  teamDedication: LocalizedString;
  team: AboutTeamMember[];
};

export async function listLongTermLeads(): Promise<LongTermLead[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("long_term_enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as LongTermLead[];
}

export async function listCorporateLeads(): Promise<CorporateLead[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("corporate_enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CorporateLead[];
}

export async function listChauffeurLeads(): Promise<ChauffeurLead[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chauffeur_enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as ChauffeurLead[];
}

export async function listCarWashLeads(): Promise<CarWashLead[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("car_wash_enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as CarWashLead[];
}

export async function listFleetPartnershipLeads(): Promise<FleetPartnershipLead[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("fleet_partnership_enquiries")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FleetPartnershipLead[];
}

export async function updateLeadStatus(
  table:
    | "long_term_enquiries"
    | "corporate_enquiries"
    | "chauffeur_enquiries"
    | "car_wash_enquiries"
    | "fleet_partnership_enquiries",
  id: string,
  status: AdminLeadStatus,
  owner: string | null,
  adminNotes: string | null,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from(table)
    .update({
      status,
      owner,
      admin_notes: adminNotes,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function insertCorporateLead(input: {
  company: string;
  fullName: string;
  jobTitle?: string;
  email: string;
  mobile: string;
  tier?: string;
  urgency?: string;
  notes?: string;
  marketing: boolean;
}): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("corporate_enquiries")
    .insert({
      company: input.company,
      full_name: input.fullName,
      job_title: input.jobTitle ?? null,
      email: input.email,
      mobile: input.mobile,
      tier: input.tier ?? null,
      urgency: input.urgency ?? null,
      notes: input.notes ?? null,
      marketing: input.marketing,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function insertChauffeurLead(input: {
  fullName: string;
  email: string;
  mobile: string;
  serviceType?: string;
  vehicleClass?: string;
  tripDate?: string;
  passengers?: number;
  pickupLocation?: string;
  notes?: string;
  marketing: boolean;
}): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chauffeur_enquiries")
    .insert({
      full_name: input.fullName,
      email: input.email,
      mobile: input.mobile,
      service_type: input.serviceType ?? null,
      vehicle_class: input.vehicleClass ?? null,
      trip_date: input.tripDate ?? null,
      passengers: input.passengers ?? null,
      pickup_location: input.pickupLocation ?? null,
      notes: input.notes ?? null,
      marketing: input.marketing,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function insertCarWashLead(input: {
  fullName: string;
  email: string;
  mobile: string;
  packageId?: string;
  vehicleClass?: string;
  preferredDate?: string;
  preferredTime?: string;
  vehicleMakeModel?: string;
  notes?: string;
  marketing: boolean;
  metadata?: Record<string, unknown>;
}): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("car_wash_enquiries")
    .insert({
      full_name: input.fullName,
      email: input.email,
      mobile: input.mobile,
      package_id: input.packageId ?? null,
      vehicle_class: input.vehicleClass ?? null,
      preferred_date: input.preferredDate ?? null,
      preferred_time: input.preferredTime ?? null,
      vehicle_make_model: input.vehicleMakeModel ?? null,
      notes: input.notes ?? null,
      marketing: input.marketing,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function insertFleetPartnershipLead(input: {
  fullName: string;
  email: string;
  mobile: string;
  companyName?: string;
  vehicleCount?: string;
  notes?: string;
  marketing: boolean;
}): Promise<string> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("fleet_partnership_enquiries")
    .insert({
      full_name: input.fullName,
      email: input.email,
      mobile: input.mobile,
      company_name: input.companyName ?? null,
      vehicle_count: input.vehicleCount ?? null,
      notes: input.notes ?? null,
      marketing: input.marketing,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function listVehicleMetadata(): Promise<VehicleMetadataRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("vehicle_metadata").select("*").order("slug");
  if (error) throw new Error(error.message);
  return (data ?? []) as VehicleMetadataRow[];
}

export async function upsertVehicleMetadata(items: VehicleMetadataRow[]): Promise<void> {
  if (items.length === 0) return;
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("vehicle_metadata").upsert(
    items.map((item) => ({ ...item, updated_at: new Date().toISOString() })),
    { onConflict: "frontend_vehicle_id" },
  );
  if (error) throw new Error(error.message);

  // Surface every added/synced vehicle model in /admin/seo without a manual
  // step — one row per slug, since units of the same model share one page.
  // Best-effort: SEO bookkeeping never blocks fleet metadata from saving.
  await ensureVehicleSeoRows(
    items.map((item) => ({
      slug: item.slug,
      label: item.title || [item.brand, item.model].filter(Boolean).join(" ") || item.slug,
    })),
  ).catch(() => undefined);
}

export async function deleteVehicleMetadataByIds(frontendVehicleIds: string[]): Promise<void> {
  if (frontendVehicleIds.length === 0) return;
  const supabase = getSupabaseAdminClient();

  const { data: toDelete } = await supabase
    .from("vehicle_metadata")
    .select("slug")
    .in("frontend_vehicle_id", frontendVehicleIds);
  const candidateSlugs = [...new Set((toDelete ?? []).map((row) => row.slug as string))];

  const { error } = await supabase
    .from("vehicle_metadata")
    .delete()
    .in("frontend_vehicle_id", frontendVehicleIds);
  if (error) throw new Error(error.message);

  // Only drop the page_seo row for a slug once no unit still uses it — a
  // slug is shared across every unit of the same model.
  if (candidateSlugs.length > 0) {
    const { data: stillUsed } = await supabase
      .from("vehicle_metadata")
      .select("slug")
      .in("slug", candidateSlugs);
    const stillUsedSlugs = new Set((stillUsed ?? []).map((row) => row.slug as string));
    const orphanedSlugs = candidateSlugs.filter((slug) => !stillUsedSlugs.has(slug));
    await deletePageSeoByKeys(orphanedSlugs.map(vehiclePageKey)).catch(() => undefined);
  }
}

function isMissingTableError(message: string): boolean {
  return /schema cache|could not find the table|does not exist/i.test(message);
}

export async function listVehicleWizardMap(): Promise<VehicleWizardMapRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vehicle_wizard_map")
    .select("*")
    .order("frontend_vehicle_id");
  if (error) {
    if (isMissingTableError(error.message)) return [];
    throw new Error(error.message);
  }
  return (data ?? []) as VehicleWizardMapRow[];
}

export async function replaceVehicleWizardMap(items: VehicleWizardMapRow[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase
    .from("vehicle_wizard_map")
    .delete()
    .neq("frontend_vehicle_id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const { error } = await supabase.from("vehicle_wizard_map").insert(items);
  if (error) throw new Error(error.message);
}

export async function listLocations(): Promise<Branch[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("locations").select("*").order("name");
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as Array<
    Omit<Branch, "hours" | "isAirport" | "temporarilyClosed" | "closedReason"> & {
      hours: Branch["hours"];
      is_airport: boolean;
      temporarily_closed: boolean;
      closed_reason: string | null;
    }
  >;
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    address: row.address,
    city: row.city,
    lat: Number(row.lat),
    lng: Number(row.lng),
    phone: row.phone,
    whatsapp: row.whatsapp,
    hours: row.hours,
    isAirport: row.is_airport,
    temporarilyClosed: row.temporarily_closed || undefined,
    closedReason: row.closed_reason ?? undefined,
  }));
}

export async function replaceLocations(items: Branch[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase.from("locations").delete().neq("id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const { error } = await supabase.from("locations").insert(
    items.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      address: item.address,
      city: item.city,
      lat: item.lat,
      lng: item.lng,
      phone: item.phone,
      whatsapp: item.whatsapp ?? null,
      hours: item.hours,
      is_airport: item.isAirport,
      temporarily_closed: item.temporarilyClosed ?? false,
      closed_reason: item.closedReason ?? null,
      updated_at: new Date().toISOString(),
    })),
  );
  if (error) throw new Error(error.message);
}

export async function getDeliveryPricingSettings(): Promise<DeliveryPricingSettings | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("delivery_pricing_settings")
    .select("*")
    .eq("id", "default")
    .limit(1);
  if (error) throw new Error(error.message);
  const row = (data ?? [])[0] as
    | { base_fee_cents: number; free_radius_km: number; per_km_cents: number }
    | undefined;
  if (!row) return null;
  return {
    baseFeeCents: row.base_fee_cents,
    freeRadiusKm: Number(row.free_radius_km),
    perKmCents: row.per_km_cents,
  };
}

export async function replaceDeliveryPricingSettings(
  settings: DeliveryPricingSettings,
): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("delivery_pricing_settings").upsert({
    id: "default",
    base_fee_cents: settings.baseFeeCents,
    free_radius_km: settings.freeRadiusKm,
    per_km_cents: settings.perKmCents,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function listPromotions(): Promise<PromotionRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("promotions").select("*").order("id");
  if (error) throw new Error(error.message);
  return (data ?? []) as PromotionRow[];
}

export async function replacePromotions(items: PromotionRow[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase.from("promotions").delete().neq("id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const { error } = await supabase.from("promotions").insert(
    items.map((item) => ({
      ...item,
      updated_at: new Date().toISOString(),
    })),
  );
  if (error) throw new Error(error.message);
}

export async function listAboutContent(): Promise<AboutContentData | null> {
  const supabase = getSupabaseAdminClient();
  const [
    { data: sectionRows, error: sectionError },
    { data: statRows, error: statError },
    { data: teamRows, error: teamError },
  ] = await Promise.all([
    supabase.from("cms_about_sections").select("*").eq("id", "about-main").limit(1),
    supabase.from("cms_about_stats").select("*").order("sort_order"),
    supabase.from("cms_about_team").select("*").order("sort_order"),
  ]);
  if (sectionError) throw new Error(sectionError.message);
  if (statError) throw new Error(statError.message);
  if (teamError) throw new Error(teamError.message);
  const section = ((sectionRows ?? []) as AboutSectionRow[])[0];
  if (!section) return null;
  const storyParagraphs = isLocalizedStringArray(section.story_paragraphs)
    ? section.story_paragraphs
    : {
        en: Array.isArray(section.story_paragraphs)
          ? section.story_paragraphs.filter((item): item is string => typeof item === "string")
          : [],
      };
  const fleetParagraphs = isLocalizedStringArray(section.fleet_paragraphs)
    ? section.fleet_paragraphs
    : {
        en: Array.isArray(section.fleet_paragraphs)
          ? section.fleet_paragraphs.filter((item): item is string => typeof item === "string")
          : [],
      };
  const stats = ((statRows ?? []) as AboutStatRow[]).map((row) => ({
    value: row.value,
    label: toLocalizedString(
      typeof row.label === "string" || isLocalizedString(row.label) ? row.label : "",
    ),
  }));
  const team = ((teamRows ?? []) as AboutTeamRow[]).map((row) => ({
    name: row.name,
    role: toLocalizedString(
      typeof row.role === "string" || isLocalizedString(row.role) ? row.role : "",
    ),
    photo: row.photo,
    quote:
      row.quote === null || row.quote === undefined
        ? undefined
        : toLocalizedString(
            typeof row.quote === "string" || isLocalizedString(row.quote) ? row.quote : "",
          ),
    bio: toLocalizedString(
      typeof row.bio === "string" || isLocalizedString(row.bio) ? row.bio : "",
    ),
    highlights: isLocalizedStringArray(row.highlights)
      ? row.highlights
      : {
          en: Array.isArray(row.highlights)
            ? row.highlights.filter((item): item is string => typeof item === "string")
            : [],
        },
  }));
  return {
    storyParagraphs,
    pullQuote: toLocalizedString(
      typeof section.pull_quote === "string" || isLocalizedString(section.pull_quote)
        ? section.pull_quote
        : "",
    ),
    fleetPhilosophy: {
      heading: toLocalizedString(
        typeof section.fleet_heading === "string" || isLocalizedString(section.fleet_heading)
          ? section.fleet_heading
          : "",
      ),
      paragraphs: fleetParagraphs,
    },
    stats,
    teamIntro: toLocalizedString(
      typeof section.team_intro === "string" || isLocalizedString(section.team_intro)
        ? section.team_intro
        : "",
    ),
    teamDedication: toLocalizedString(
      typeof section.team_dedication === "string" || isLocalizedString(section.team_dedication)
        ? section.team_dedication
        : "",
    ),
    team,
  };
}

export async function replaceAboutContent(content: AboutContentData): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const sectionRow = {
    id: "about-main",
    story_paragraphs: content.storyParagraphs,
    pull_quote: content.pullQuote,
    fleet_heading: content.fleetPhilosophy.heading,
    fleet_paragraphs: content.fleetPhilosophy.paragraphs,
    team_intro: content.teamIntro,
    team_dedication: content.teamDedication,
    updated_at: new Date().toISOString(),
  };
  const statRows: AboutStatRow[] = content.stats.map((item, index) => ({
    id: `stat-${index + 1}`,
    value: item.value,
    label: item.label,
    sort_order: index,
  }));
  const teamRows: AboutTeamRow[] = content.team.map((item, index) => ({
    id: `team-${index + 1}`,
    name: item.name,
    role: item.role,
    photo: item.photo,
    quote: item.quote ?? null,
    bio: item.bio,
    highlights: item.highlights ?? { en: [] },
    sort_order: index,
  }));

  const { error: sectionDeleteError } = await supabase
    .from("cms_about_sections")
    .delete()
    .neq("id", "");
  if (sectionDeleteError) throw new Error(sectionDeleteError.message);
  const { error: statDeleteError } = await supabase.from("cms_about_stats").delete().neq("id", "");
  if (statDeleteError) throw new Error(statDeleteError.message);
  const { error: teamDeleteError } = await supabase.from("cms_about_team").delete().neq("id", "");
  if (teamDeleteError) throw new Error(teamDeleteError.message);

  const { error: sectionInsertError } = await supabase
    .from("cms_about_sections")
    .insert(sectionRow);
  if (sectionInsertError) throw new Error(sectionInsertError.message);
  if (statRows.length > 0) {
    const { error: statsInsertError } = await supabase.from("cms_about_stats").insert(statRows);
    if (statsInsertError) throw new Error(statsInsertError.message);
  }
  if (teamRows.length > 0) {
    const { error: teamInsertError } = await supabase.from("cms_about_team").insert(teamRows);
    if (teamInsertError) throw new Error(teamInsertError.message);
  }
}

export async function listPaymentEvents(): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("payment_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function listBookingStateTimeline(): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("booking_state_timeline")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function listNotificationOutbox(): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_outbox")
    .select("*")
    .order("scheduled_for", { ascending: true })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function listNotificationLogs(): Promise<Array<Record<string, unknown>>> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("notification_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []) as Array<Record<string, unknown>>;
}

export async function retryNotificationOutbox(id: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("notification_outbox")
    .update({
      status: "pending",
      scheduled_for: new Date().toISOString(),
      processed_at: null,
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function writeAdminAuditLog(input: {
  actor: string;
  role: string;
  resource: string;
  action: string;
  details?: Record<string, unknown>;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("admin_audit_logs").insert({
    actor: input.actor,
    role: input.role,
    resource: input.resource,
    action: input.action,
    details: input.details ?? {},
  });
  if (error) throw new Error(error.message);
}

export function toVehicleWithMetadata(
  vehicle: Vehicle,
  metadataRows: VehicleMetadataRow[],
): Vehicle {
  const row = metadataRows.find((item) => item.frontend_vehicle_id === vehicle.id);
  if (!row) return vehicle;
  const parsedMedia = parseVehicleMedia(row.media);
  const images = parsedMedia.length > 0 ? toPublicVehicleImages(parsedMedia) : vehicle.images;
  const features = Array.isArray(row.features) ? (row.features as string[]) : vehicle.features;
  const title = row.title?.trim() || vehicle.title;
  const brand = row.brand?.trim();
  const model = row.model?.trim() || vehicle.model;
  return {
    ...vehicle,
    slug: row.slug || vehicle.slug,
    make: brand || vehicle.make,
    title: title || composeVehicleTitle(brand || vehicle.make, model),
    model,
    tagline: row.tagline ?? vehicle.tagline,
    description: row.description ?? vehicle.description,
    features,
    images,
  };
}
