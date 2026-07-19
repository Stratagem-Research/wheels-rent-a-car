"use client";

import * as React from "react";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { BRANCHES as FALLBACK_BRANCHES } from "@/lib/api/fixtures/branches";
import {
  ADD_ONS as FALLBACK_ADDONS,
  PROTECTION_TIERS as FALLBACK_TIERS,
} from "@/lib/api/fixtures/catalog";
import { VEHICLES as FALLBACK_VEHICLES } from "@/lib/api/fixtures/vehicles";
import type { AddOn, Branch, ProtectionTier, Vehicle } from "@/types/domain";

type BookingCatalog = {
  addOns: AddOn[];
  protectionTiers: ProtectionTier[];
  vehicles: Vehicle[];
  branches: Branch[];
  ready: boolean;
};

const INITIAL: BookingCatalog = {
  addOns: FALLBACK_ADDONS,
  protectionTiers: FALLBACK_TIERS,
  vehicles: FALLBACK_VEHICLES,
  branches: FALLBACK_BRANCHES,
  ready: false,
};

/** Loads fleet + catalog from real API routes (fixture fallbacks until fetch completes). */
export function useBookingCatalog(): BookingCatalog {
  const [catalog, setCatalog] = React.useState<BookingCatalog>(INITIAL);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [addonsRes, tiersRes, vehiclesRes, locationsRes] = await Promise.all([
          api.get<{ items: AddOn[] }>(endpoints.addons),
          api.get<{ items: ProtectionTier[] }>(endpoints.protectionTiers),
          api.get<{ items: Vehicle[] }>(`${endpoints.vehicles}?perPage=100`),
          api.get<{ items: Branch[] }>(endpoints.locations),
        ]);
        if (cancelled) return;
        setCatalog({
          addOns: addonsRes.items,
          protectionTiers: tiersRes.items,
          vehicles: vehiclesRes.items,
          branches: locationsRes.items,
          ready: true,
        });
      } catch {
        if (!cancelled) setCatalog((prev) => ({ ...prev, ready: true }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return catalog;
}
