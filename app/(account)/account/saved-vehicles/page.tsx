"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { toast } from "@/components/ui/Toast";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import type { Vehicle } from "@/types/domain";

export default function SavedVehiclesPage() {
  const [vehicles, setVehicles] = React.useState<Vehicle[] | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get<{ items: Array<{ vehicleId: string }> }>(
          endpoints.accountSavedVehicles,
        );
        if (cancelled) return;
        // Mock layer returns empty by default. For the demo, hydrate from
        // the fixture when localStorage has saves (clients can persist a
        // wishlist independent of the API while it's stubbed).
        const stored = readLocalSaves();
        const ids = res.items.length > 0 ? res.items.map((i) => i.vehicleId) : stored;
        setVehicles(VEHICLES.filter((v) => ids.includes(v.id)));
      } catch {
        if (!cancelled) setVehicles([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onRemove = (id: string) => {
    setVehicles((curr) => (curr ?? []).filter((v) => v.id !== id));
    writeLocalSaves(readLocalSaves().filter((x) => x !== id));
    toast.success("Removed from saved cars.");
  };

  if (vehicles === null) {
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
          <h1 className="headline-xl text-ink-100">Saved cars</h1>
          <p className="body-md text-ink-60 mt-1">
            {vehicles.length === 0 ? "You haven't saved any cars yet." : `${vehicles.length} saved`}
          </p>
        </div>
      </header>

      {vehicles.length === 0 ? (
        <Card variant="tint" className="flex flex-col items-center gap-3 py-12 text-center">
          <span aria-hidden="true" className="text-5xl">
            ❤️
          </span>
          <h2 className="headline-md text-ink-100">No saved cars yet.</h2>
          <p className="body-md text-ink-60 max-w-md">
            Tap the heart on a vehicle to save it for later.
          </p>
          <Button asChild variant="primary" size="md">
            <Link href="/vehicles">Browse cars</Link>
          </Button>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {vehicles.map((v) => (
            <li key={v.id} className="flex flex-col gap-2">
              <VehicleCard vehicle={v} />
              <Button variant="tertiary" size="sm" onClick={() => onRemove(v.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function readLocalSaves(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem("wheels.savedVehicles");
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function writeLocalSaves(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem("wheels.savedVehicles", JSON.stringify(ids));
  } catch {
    // ignore
  }
}
