"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { toast } from "@/components/ui/Toast";
import { useSavedVehicles } from "@/hooks/useSavedVehicles";
import { fetchVehiclesByIds } from "@/lib/vehicles/fetch-by-ids";
import type { Vehicle } from "@/types/domain";

export default function SavedVehiclesPage() {
  const t = useTranslations("accountPages.saved");
  const { savedIds, unsave, ready } = useSavedVehicles();
  const [vehicles, setVehicles] = React.useState<Vehicle[] | null>(null);

  React.useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    (async () => {
      try {
        const items = await fetchVehiclesByIds(savedIds);
        if (!cancelled) setVehicles(items);
      } catch {
        if (!cancelled) setVehicles([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [ready, savedIds]);

  const onRemove = async (id: string) => {
    try {
      await unsave(id);
      toast.success(t("removed"));
    } catch {
      toast.error(t("removeError"));
    }
  };

  if (!ready || vehicles === null) {
    return (
      <div className="flex flex-col gap-4">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Skeleton className="h-72 rounded-lg" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between gap-3">
        <div>
          <h1 className="headline-lg text-ink-100">{t("heading")}</h1>
          <p className="body-md text-ink-60 mt-1">
            {vehicles.length === 0 ? t("countNone") : t("countSaved", { count: vehicles.length })}
          </p>
        </div>
      </header>

      {vehicles.length === 0 ? (
        <Card variant="tint" className="flex flex-col items-center gap-3 py-12 text-center">
          <span aria-hidden="true" className="text-5xl">
            ❤️
          </span>
          <h2 className="headline-md text-ink-100">{t("emptyHeading")}</h2>
          <p className="body-md text-ink-60 max-w-md">{t("emptyBody")}</p>
          <Button asChild variant="primary" size="md">
            <Link href="/vehicles">{t("browseCars")}</Link>
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {vehicles.map((v) => (
            <li key={v.id} className="flex flex-col gap-2">
              <VehicleCard vehicle={v} href={`/vehicles?selected=${encodeURIComponent(v.id)}`} />
              <Button variant="tertiary" size="sm" onClick={() => onRemove(v.id)}>
                {t("remove")}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
