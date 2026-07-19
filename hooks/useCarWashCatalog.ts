"use client";

import * as React from "react";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { CAR_WASH_PACKAGES as FALLBACK_PACKAGES } from "@/lib/api/fixtures/catalog";
import type { CarWashPackage } from "@/types/domain";

export function useCarWashCatalog() {
  const [packages, setPackages] = React.useState<CarWashPackage[]>(FALLBACK_PACKAGES);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ items: CarWashPackage[] }>(endpoints.carWashPackages);
        if (cancelled) return;
        setPackages(res.items);
      } catch {
        /* keep fallbacks */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { packages };
}
