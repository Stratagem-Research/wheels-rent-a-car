import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type WizardVehicleRow = {
  wizard_vehicle_id: number;
  vehicle_type_id: number | null;
  brand: string | null;
  model: string | null;
  display_name: string;
  category: string | null;
  website_enabled: boolean;
  wizard_updated_at: string | null;
  operational: Record<string, unknown>;
  synced_at: string;
};

export type UpsertWizardVehicleInput = Omit<WizardVehicleRow, "synced_at">;

export async function countWizardVehicles(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("wizard_vehicles")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function listWebsiteEnabledWizardVehicles(): Promise<WizardVehicleRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wizard_vehicles")
    .select("*")
    .eq("website_enabled", true)
    .order("display_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as WizardVehicleRow[];
}

export async function upsertWizardVehicles(items: UpsertWizardVehicleInput[]): Promise<number> {
  if (items.length === 0) return 0;
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase.from("wizard_vehicles").upsert(
    items.map((item) => ({
      ...item,
      synced_at: now,
    })),
    { onConflict: "wizard_vehicle_id" },
  );
  if (error) throw new Error(error.message);
  return items.length;
}

export async function ensureVehicleMetadataStub(input: {
  frontendVehicleId: string;
  slug: string;
  displayName: string;
}): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { data, error: selectError } = await supabase
    .from("vehicle_metadata")
    .select("frontend_vehicle_id")
    .eq("frontend_vehicle_id", input.frontendVehicleId)
    .maybeSingle();
  if (selectError) throw new Error(selectError.message);
  if (data) return;

  const placeholderImage = {
    url: "/images/Car Images/Untitled-design-2025-07-01T030112.627.png",
    alt: input.displayName,
    width: 1080,
    height: 810,
  };

  const { error } = await supabase.from("vehicle_metadata").insert({
    frontend_vehicle_id: input.frontendVehicleId,
    slug: input.slug,
    tagline: null,
    description: null,
    features: [],
    badges: [],
    media: [placeholderImage],
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}
