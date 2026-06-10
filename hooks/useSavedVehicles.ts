"use client";

import { useSavedVehiclesContext, type SavedVehiclesStore } from "@/components/providers/SavedVehiclesProvider";

export type { SavedVehiclesStore };

/** Shared wishlist state — requires `SavedVehiclesProvider` in the layout. */
export function useSavedVehicles(): SavedVehiclesStore {
  return useSavedVehiclesContext();
}
