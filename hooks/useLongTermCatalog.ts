"use client";

import * as React from "react";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { LONG_TERM_TIERS as FALLBACK_TIERS } from "@/lib/api/fixtures/catalog";
import { VEHICLES as FALLBACK_VEHICLES } from "@/lib/api/fixtures/vehicles";
import type { LongTermTier, Vehicle } from "@/types/domain";

export function useLongTermCatalog() {
  const [tiers, setTiers] = React.useState<LongTermTier[]>(FALLBACK_TIERS);
  const [vehicles, setVehicles] = React.useState<Vehicle[]>(
    FALLBACK_VEHICLES.filter((v) => ["sedan", "suv"].includes(v.category)).slice(0, 6),
  );

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [tiersRes, vehiclesRes] = await Promise.all([
          api.get<{ items: LongTermTier[] }>(endpoints.longTermTiers),
          api.get<{ items: Vehicle[] }>(endpoints.vehiclesLongTermPopular),
        ]);
        if (cancelled) return;
        setTiers(tiersRes.items);
        setVehicles(vehiclesRes.items);
      } catch {
        /* keep fallbacks */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { tiers, vehicles };
}
