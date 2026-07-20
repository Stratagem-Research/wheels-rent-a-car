"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBookingDraft } from "@/hooks/useBookingDraft";
import { useBookingCatalog } from "@/hooks/useBookingCatalog";
import { useResolvedBookingVehicle } from "@/hooks/useResolvedBookingVehicle";
import { bookingStepHref, syncDraftFromFunnelParams } from "@/lib/booking/funnel-params";

type BookingFunnelRequirements = {
  /** Redirect to step 1 when draft has no vehicle. Default true. */
  requireVehicle?: boolean;
  /** Redirect to protection when tier not chosen. */
  requireProtection?: boolean;
};

/**
 * Shared state for booking funnel steps 2–4: draft sync from URL, catalog,
 * resolved vehicle (catalog + slug fallback), and step navigation helpers.
 */
export function useBookingFunnelPage(requirements: BookingFunnelRequirements = {}) {
  const { requireVehicle = true, requireProtection = false } = requirements;
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftApi = useBookingDraft();
  const { draft, ready, setDraft } = draftApi;
  const catalog = useBookingCatalog();

  const vehicleId = searchParams.get("vehicleId")?.trim() ?? draft?.vehicle?.vehicleId;
  const vehicleSlug =
    searchParams.get("vehicleSlug")?.trim() ?? draft?.vehicle?.vehicleSlug ?? undefined;

  const { vehicle, loading: vehicleLoading } = useResolvedBookingVehicle(
    vehicleId,
    vehicleSlug,
    catalog.vehicles,
    catalog.ready,
  );

  React.useEffect(() => {
    if (!ready) return;
    syncDraftFromFunnelParams(searchParams, setDraft);
  }, [ready, searchParams, setDraft]);

  React.useEffect(() => {
    if (!ready || !draft) return;
    if (requireVehicle && !draft.vehicle?.vehicleId) {
      if (!searchParams.get("vehicleId")?.trim()) {
        router.replace("/book/select-vehicle");
      }
      return;
    }
    if (requireProtection && !draft.protectionTierId) {
      router.replace(bookingStepHref("/book/protection", draft, searchParams));
    }
  }, [ready, draft, requireProtection, requireVehicle, router, searchParams]);

  const goToStep = React.useCallback(
    (path: string) => {
      if (!draft) return;
      router.push(bookingStepHref(path, draft, searchParams));
    },
    [draft, router, searchParams],
  );

  const showSkeleton =
    !ready ||
    !draft ||
    (requireVehicle && !draft.vehicle?.vehicleId) ||
    (vehicleLoading && !vehicle && Boolean(vehicleSlug || vehicleId));

  return {
    ...draftApi,
    ...catalog,
    draft,
    ready,
    vehicle,
    vehicleLoading,
    showSkeleton,
    goToStep,
  };
}
