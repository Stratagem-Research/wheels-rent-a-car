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

export async function listWizardVehicles(): Promise<WizardVehicleRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wizard_vehicles")
    .select("*")
    .order("display_name");
  if (error) throw new Error(error.message);
  return (data ?? []) as WizardVehicleRow[];
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

/**
 * Full-sync prune: drop mirror rows whose Wizard ids are no longer in the payload.
 * No-op when `keepIds` is empty (guards against a bad empty API response wiping the fleet).
 */
export async function deleteWizardVehiclesNotIn(keepIds: number[]): Promise<number> {
  if (keepIds.length === 0) return 0;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("wizard_vehicles")
    .delete()
    .not("wizard_vehicle_id", "in", `(${keepIds.join(",")})`)
    .select("wizard_vehicle_id");
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

/**
 * Drop website metadata for cars no longer returned by vehicles/sync.
 * Keeps only `frontend_vehicle_id`s in `keepFrontendIds`. Empty keep list is a no-op.
 */
export async function deleteVehicleMetadataNotIn(keepFrontendIds: string[]): Promise<number> {
  if (keepFrontendIds.length === 0) return 0;
  const supabase = getSupabaseAdminClient();
  // Supabase `.in` max is fine for ~hundreds of fleet ids; delete everything not in keep set.
  const { data: existing, error: listError } = await supabase
    .from("vehicle_metadata")
    .select("frontend_vehicle_id");
  if (listError) throw new Error(listError.message);

  const keep = new Set(keepFrontendIds);
  const toDelete = (existing ?? [])
    .map((row) => row.frontend_vehicle_id as string)
    .filter((id) => !keep.has(id));

  if (toDelete.length === 0) return 0;

  const { error } = await supabase
    .from("vehicle_metadata")
    .delete()
    .in("frontend_vehicle_id", toDelete);
  if (error) throw new Error(error.message);
  return toDelete.length;
}

/**
 * Remove the admin `daily_rate` override from `vehicle_metadata.operational`
 * for the given frontend ids. Called by Wizard sync so Wizard's price wins.
 * Returns the number of rows actually changed.
 */
export async function clearDailyRateOverrides(frontendIds: string[]): Promise<number> {
  if (frontendIds.length === 0) return 0;
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.rpc("clear_daily_rate_overrides", {
    p_frontend_ids: frontendIds,
  });
  if (error) throw new Error(error.message);
  return typeof data === "number" ? data : Number(data ?? 0);
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
