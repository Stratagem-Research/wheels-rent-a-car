"use client";

import * as React from "react";
import type { CorporateTier, FaqGroup, HelpArticle, Itinerary, Trip } from "@/types/domain";
import { CMS_UPDATED_EVENT, type CmsResource } from "@/lib/admin/cms-events";
import {
  deleteHelpArticle,
  fetchCorporateTiers,
  fetchFaqs,
  fetchHelpArticles,
  fetchItineraries,
  fetchTrips,
} from "@/lib/admin/store";

function useCmsResource<T>(resource: CmsResource, fetcher: () => Promise<T[]>): T[] {
  const [value, setValue] = React.useState<T[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      try {
        const next = await fetcher();
        if (!cancelled) setValue(next);
      } catch {
        if (!cancelled) setValue([]);
      }
    };
    void refresh();

    const onUpdated = (event: Event) => {
      const detail = (event as CustomEvent<CmsResource>).detail;
      if (detail === resource) void refresh();
    };
    window.addEventListener(CMS_UPDATED_EVENT, onUpdated);
    return () => {
      cancelled = true;
      window.removeEventListener(CMS_UPDATED_EVENT, onUpdated);
    };
  }, [fetcher, resource]);

  return value;
}

export function useTrips(): Trip[] {
  return useCmsResource("trips", fetchTrips);
}

export function useItineraries(): Itinerary[] {
  return useCmsResource("itineraries", fetchItineraries);
}

export function useFaqs(): FaqGroup[] {
  return useCmsResource("faqs", fetchFaqs);
}

export function useCorporateTiers(): CorporateTier[] {
  return useCmsResource("corporate", fetchCorporateTiers);
}

export function useHelpArticles(): HelpArticle[] {
  return useCmsResource("help-articles", fetchHelpArticles);
}
