import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { Branch, Vehicle } from "@/types/domain";
import type { Stat, TeamMember } from "@/lib/content/about";

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

type VehicleMetadataRow = {
  frontend_vehicle_id: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  features: unknown;
  badges: unknown;
  media: unknown;
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
  pull_quote: string;
  fleet_heading: string;
  fleet_paragraphs: unknown;
  team_intro: string;
  team_dedication: string;
};

type AboutStatRow = {
  id: string;
  value: string;
  label: string;
  sort_order: number;
};

type AboutTeamRow = {
  id: string;
  name: string;
  role: string;
  photo: string;
  quote: string | null;
  bio: string;
  highlights: unknown;
  sort_order: number;
};

export type AboutContentData = {
  storyParagraphs: string[];
  pullQuote: string;
  fleetPhilosophy: {
    heading: string;
    paragraphs: string[];
  };
  stats: Stat[];
  teamIntro: string;
  teamDedication: string;
  team: TeamMember[];
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

export async function updateLeadStatus(
  table: "long_term_enquiries" | "corporate_enquiries" | "chauffeur_enquiries",
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

export async function listVehicleMetadata(): Promise<VehicleMetadataRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("vehicle_metadata").select("*").order("slug");
  if (error) throw new Error(error.message);
  return (data ?? []) as VehicleMetadataRow[];
}

export async function replaceVehicleMetadata(items: VehicleMetadataRow[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase
    .from("vehicle_metadata")
    .delete()
    .neq("frontend_vehicle_id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const { error } = await supabase
    .from("vehicle_metadata")
    .insert(items.map((item) => ({ ...item, updated_at: new Date().toISOString() })));
  if (error) throw new Error(error.message);
}

export async function listVehicleWizardMap(): Promise<VehicleWizardMapRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("vehicle_wizard_map")
    .select("*")
    .order("frontend_vehicle_id");
  if (error) throw new Error(error.message);
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
  const storyParagraphs = Array.isArray(section.story_paragraphs)
    ? (section.story_paragraphs as string[]).filter((item) => typeof item === "string")
    : [];
  const fleetParagraphs = Array.isArray(section.fleet_paragraphs)
    ? (section.fleet_paragraphs as string[]).filter((item) => typeof item === "string")
    : [];
  const stats = ((statRows ?? []) as AboutStatRow[]).map((row) => ({
    value: row.value,
    label: row.label,
  }));
  const team = ((teamRows ?? []) as AboutTeamRow[]).map((row) => ({
    name: row.name,
    role: row.role,
    photo: row.photo,
    quote: row.quote ?? undefined,
    bio: row.bio,
    highlights: Array.isArray(row.highlights)
      ? row.highlights.filter((item): item is string => typeof item === "string")
      : [],
  }));
  return {
    storyParagraphs,
    pullQuote: section.pull_quote,
    fleetPhilosophy: {
      heading: section.fleet_heading,
      paragraphs: fleetParagraphs,
    },
    stats,
    teamIntro: section.team_intro ?? "",
    teamDedication: section.team_dedication ?? "",
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
    highlights: item.highlights ?? [],
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
  const media =
    Array.isArray(row.media) && row.media.length > 0
      ? (row.media as Vehicle["images"])
      : vehicle.images;
  const features = Array.isArray(row.features) ? (row.features as string[]) : vehicle.features;
  return {
    ...vehicle,
    slug: row.slug || vehicle.slug,
    tagline: row.tagline ?? vehicle.tagline,
    description: row.description ?? vehicle.description,
    features,
    images: media,
  };
}
