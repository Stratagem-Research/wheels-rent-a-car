import type { SupabaseClient } from "@supabase/supabase-js";

export type SavedVehicleRow = {
  vehicleId: string;
  createdAt: string;
};

export async function listSavedVehicles(
  supabase: SupabaseClient,
  userId: string,
): Promise<SavedVehicleRow[]> {
  const { data, error } = await supabase
    .from("saved_vehicles")
    .select("vehicle_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    vehicleId: row.vehicle_id as string,
    createdAt: row.created_at as string,
  }));
}

export async function addSavedVehicle(
  supabase: SupabaseClient,
  userId: string,
  vehicleId: string,
): Promise<void> {
  const { error } = await supabase.from("saved_vehicles").upsert(
    { user_id: userId, vehicle_id: vehicleId },
    { onConflict: "user_id,vehicle_id", ignoreDuplicates: true },
  );
  if (error) throw error;
}

export async function removeSavedVehicle(
  supabase: SupabaseClient,
  userId: string,
  vehicleId: string,
): Promise<void> {
  const { error } = await supabase
    .from("saved_vehicles")
    .delete()
    .eq("user_id", userId)
    .eq("vehicle_id", vehicleId);
  if (error) throw error;
}
