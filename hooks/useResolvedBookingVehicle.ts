"use client";

import * as React from "react";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { Vehicle } from "@/types/domain";

/**
 * Resolve the selected vehicle for booking steps 2–4.
 *
 * The catalog hook paginates fleet data; the vehicle picked on /vehicles may not
 * appear in the first page. Fall back to GET /api/vehicles/[slug] or by-id.
 */
export function useResolvedBookingVehicle(
  vehicleId: string | undefined,
  vehicleSlug: string | undefined,
  vehicles: Vehicle[],
  catalogReady: boolean,
): { vehicle: Vehicle | undefined; loading: boolean } {
  const [fetchedBySlug, setFetchedBySlug] = React.useState<{
    slug: string;
    vehicle: Vehicle | null;
  } | null>(null);
  const [fetchedById, setFetchedById] = React.useState<{
    id: string;
    vehicle: Vehicle | null;
  } | null>(null);

  const fromCatalog = React.useMemo(
    () => (vehicleId ? vehicles.find((v) => v.id === vehicleId) : undefined),
    [vehicleId, vehicles],
  );

  const slug = vehicleSlug?.trim() ?? "";
  const id = vehicleId?.trim() ?? "";

  const fromSlug =
    fetchedBySlug?.slug === slug && fetchedBySlug.vehicle ? fetchedBySlug.vehicle : null;
  const fromId =
    fetchedById?.id === id && fetchedById.vehicle ? fetchedById.vehicle : null;

  React.useEffect(() => {
    if (fromCatalog || !catalogReady || !slug) return;
    let cancelled = false;
    void api
      .get<Vehicle>(endpoints.vehicleBySlug(slug))
      .then((vehicle) => {
        if (!cancelled) setFetchedBySlug({ slug, vehicle });
      })
      .catch(() => {
        if (!cancelled) setFetchedBySlug({ slug, vehicle: null });
      });
    return () => {
      cancelled = true;
    };
  }, [catalogReady, fromCatalog, slug]);

  React.useEffect(() => {
    if (fromCatalog || fromSlug || !catalogReady || !id) return;
    let cancelled = false;
    void api
      .get<Vehicle>(endpoints.vehicleById(id))
      .then((vehicle) => {
        if (!cancelled) setFetchedById({ id, vehicle });
      })
      .catch(() => {
        if (!cancelled) setFetchedById({ id, vehicle: null });
      });
    return () => {
      cancelled = true;
    };
  }, [catalogReady, fromCatalog, fromSlug, id]);

  const loading =
    !catalogReady ||
    (Boolean(slug) && !fromCatalog && !fromSlug && fetchedBySlug?.slug !== slug) ||
    (Boolean(id) && !fromCatalog && !fromSlug && !fromId && fetchedById?.id !== id);

  return {
    vehicle: fromCatalog ?? fromSlug ?? fromId ?? undefined,
    loading,
  };
}
