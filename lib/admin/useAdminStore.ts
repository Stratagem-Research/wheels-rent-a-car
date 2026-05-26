"use client";

import * as React from "react";
import type { CorporateTier, FaqGroup, Itinerary, Trip } from "@/types/domain";
import {
  ADMIN_STORE_KEYS,
  readCorporateTiers,
  readFaqs,
  readItineraries,
  readTrips,
} from "@/lib/admin/store";

/**
 * `useAdminStore` — subscribe a client component to a single admin-managed
 * resource so it re-renders when the admin saves a change.
 *
 * Listens to the `storage` event (cross-tab + the same-tab event we
 * dispatch from `writeJSON()` in `lib/admin/store.ts`). The reader fn
 * decides which slice this hook returns; the key tells us which writes
 * to react to.
 */
function useAdminResource<T>(key: string, reader: () => T): T {
  const [value, setValue] = React.useState<T>(() => reader());

  // We deliberately setValue inside the effect: the reader reads from
  // localStorage (browser-only), and the post-mount sync IS the point —
  // it overrides the server-rendered fixture with any admin overlay
  // saved in this browser. The lint exception is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const refresh = (e: StorageEvent) => {
      if (e.key === key || e.key === null) {
        setValue(reader());
      }
    };
    window.addEventListener("storage", refresh);
    setValue(reader());
    return () => window.removeEventListener("storage", refresh);
  }, [key, reader]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return value;
}

export function useTrips(): Trip[] {
  return useAdminResource<Trip[]>(ADMIN_STORE_KEYS.trips, readTrips);
}

export function useItineraries(): Itinerary[] {
  return useAdminResource<Itinerary[]>(ADMIN_STORE_KEYS.itineraries, readItineraries);
}

export function useFaqs(): FaqGroup[] {
  return useAdminResource<FaqGroup[]>(ADMIN_STORE_KEYS.faqs, readFaqs);
}

export function useCorporateTiers(): CorporateTier[] {
  return useAdminResource<CorporateTier[]>(ADMIN_STORE_KEYS.corporate, readCorporateTiers);
}
