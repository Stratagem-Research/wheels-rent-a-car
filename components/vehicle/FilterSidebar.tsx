"use client";

import * as React from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Chip } from "@/components/ui/Chip";
import { RadioGroup, RadioItem } from "@/components/ui/RadioGroup";
import { Slider } from "@/components/ui/Slider";
import { CATEGORY_LABELS } from "@/lib/vehicles/labels";
import {
  DEFAULT_FILTERS,
  filtersToSearch,
  parseFiltersFromSearch,
  type FleetFacets,
  type FleetFilters,
} from "@/lib/vehicles/filter";
import type { FuelType, VehicleCategory } from "@/types/domain";

/*
 * Fleet filter sidebar per 02_fleet_browse.md §4.
 *
 * URL is the single source of truth — the sidebar reads `useSearchParams()`
 * on every render and pushes new state via `router.replace` (no full reload,
 * no scroll). The server component re-renders the grid with the new params.
 *
 * Facet counts (`counts`) come from the server pass and reflect the FULL
 * fleet so the user always sees how many vehicles fall into each option,
 * not how many fit *after* their current filters (which would shrink to 0
 * the moment they pick one option).
 */

export interface FilterSidebarProps {
  facets: FleetFacets;
  /** Locked category from the route, e.g. /vehicles/economy. */
  lockedCategory?: VehicleCategory;
  className?: string;
}

export function FilterSidebar({ facets, lockedCategory, className }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const filters = React.useMemo(
    () =>
      parseFiltersFromSearch(
        new URLSearchParams(searchParams?.toString() ?? ""),
        DEFAULT_FILTERS,
        lockedCategory,
      ),
    [searchParams, lockedCategory],
  );

  const update = React.useCallback(
    (next: Partial<FleetFilters>) => {
      const merged: FleetFilters = { ...filters, ...next, page: 1 };
      const params = filtersToSearch(merged);
      // When category is locked by the route, don't echo it in the URL.
      if (lockedCategory) params.delete("category");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : (pathname ?? "/vehicles"), { scroll: false });
    },
    [filters, lockedCategory, pathname, router],
  );

  const resetAll = () => {
    router.replace(pathname ?? "/vehicles", { scroll: false });
  };

  const removeCategoryChip = (cat: VehicleCategory) =>
    update({ categories: filters.categories.filter((c) => c !== cat) });
  const removeFuelChip = (fuel: FuelType) =>
    update({ fuels: filters.fuels.filter((f) => f !== fuel) });

  const activeChips: Array<{ key: string; label: string; onRemove: () => void }> = [
    ...filters.categories
      .filter((c) => c !== lockedCategory)
      .map((cat) => ({
        key: `cat-${cat}`,
        label: CATEGORY_LABELS[cat],
        onRemove: () => removeCategoryChip(cat),
      })),
    ...filters.fuels.map((fuel) => ({
      key: `fuel-${fuel}`,
      label: capitalize(fuel),
      onRemove: () => removeFuelChip(fuel),
    })),
  ];

  const toggleCategory = (cat: VehicleCategory) => {
    const set = new Set(filters.categories);
    set.has(cat) ? set.delete(cat) : set.add(cat);
    update({ categories: Array.from(set) });
  };

  const toggleFuel = (fuel: FuelType) => {
    const set = new Set(filters.fuels);
    set.has(fuel) ? set.delete(fuel) : set.add(fuel);
    update({ fuels: Array.from(set) });
  };

  return (
    <aside
      aria-label="Filters"
      className={cn(
        "bg-surface border-border flex flex-col gap-5 rounded-lg border p-5",
        className,
      )}
    >
      {activeChips.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {activeChips.map((chip) => (
            <Chip
              key={chip.key}
              variant="selected"
              onClick={chip.onRemove}
              aria-label={`Remove ${chip.label}`}
            >
              {chip.label}
              <X className="size-3" aria-hidden="true" />
            </Chip>
          ))}
        </div>
      ) : null}

      {!lockedCategory ? (
        <Group title="Category">
          {(
            [
              "economy",
              "compact",
              "sedan",
              "suv",
              "luxury",
              "4x4",
              "7-seater",
              "convertible",
            ] as VehicleCategory[]
          ).map((cat) => (
            <FacetCheckbox
              key={cat}
              label={CATEGORY_LABELS[cat]}
              count={facets.category[cat] ?? 0}
              checked={filters.categories.includes(cat)}
              onCheckedChange={() => toggleCategory(cat)}
            />
          ))}
        </Group>
      ) : null}

      <Group title="Transmission">
        <RadioGroup
          value={filters.transmission}
          onValueChange={(v) => update({ transmission: v as FleetFilters["transmission"] })}
        >
          <RadioItem value="any" label={`Any (${total(facets.transmission)})`} />
          <RadioItem
            value="automatic"
            label={`Automatic (${facets.transmission.automatic ?? 0})`}
          />
          <RadioItem value="manual" label={`Manual (${facets.transmission.manual ?? 0})`} />
        </RadioGroup>
      </Group>

      <Group title="Fuel">
        {(["petrol", "diesel", "hybrid", "electric"] as FuelType[]).map((fuel) => (
          <FacetCheckbox
            key={fuel}
            label={capitalize(fuel)}
            count={facets.fuel[fuel] ?? 0}
            checked={filters.fuels.includes(fuel)}
            onCheckedChange={() => toggleFuel(fuel)}
          />
        ))}
      </Group>

      <Group title="Seats">
        <RadioGroup
          value={filters.seats ?? "any"}
          onValueChange={(v) =>
            update({ seats: v === "any" ? null : (v as FleetFilters["seats"]) })
          }
        >
          <RadioItem value="any" label="Any" />
          <RadioItem value="2" label={`2 (${facets.seats["2"] ?? 0})`} />
          <RadioItem value="4-5" label={`4–5 (${facets.seats["4-5"] ?? 0})`} />
          <RadioItem value="6-7" label={`6–7 (${facets.seats["6-7"] ?? 0})`} />
          <RadioItem value="8+" label={`8+ (${facets.seats["8+"] ?? 0})`} />
        </RadioGroup>
      </Group>

      <Group title="Price per day">
        <PriceSlider
          min={filters.minPriceUsd}
          max={filters.maxPriceUsd}
          onCommit={(min, max) => update({ minPriceUsd: min, maxPriceUsd: max })}
        />
      </Group>

      <Button variant="tertiary" size="sm" onClick={resetAll}>
        Reset all
      </Button>
    </aside>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5 border-0 p-0">
      <legend className="text-ink-50 mb-1 overline">{title}</legend>
      {children}
    </fieldset>
  );
}

function FacetCheckbox({
  label,
  count,
  checked,
  onCheckedChange,
}: {
  label: string;
  count: number;
  checked: boolean;
  onCheckedChange: () => void;
}) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      label={
        <span className="flex w-full items-center gap-2">
          <span>{label}</span>
          <span className="label-sm text-ink-50 ml-auto tabular-nums">{count}</span>
        </span>
      }
    />
  );
}

function PriceSlider(props: {
  min: number;
  max: number;
  onCommit: (min: number, max: number) => void;
}) {
  // Keying on min/max remounts the inner component whenever the URL pushes a
  // new range (e.g. Reset all), avoiding an explicit prop→state sync effect.
  return <PriceSliderInner key={`${props.min}-${props.max}`} {...props} />;
}

function PriceSliderInner({
  min,
  max,
  onCommit,
}: {
  min: number;
  max: number;
  onCommit: (min: number, max: number) => void;
}) {
  const [value, setValue] = React.useState<[number, number]>([min, max]);

  return (
    <div className="flex flex-col gap-3 px-1">
      <Slider
        value={value}
        onValueChange={(v) => setValue([v[0] ?? min, v[1] ?? max])}
        onValueCommit={(v) => onCommit(v[0] ?? 0, v[1] ?? 200)}
        min={0}
        max={200}
        step={5}
        aria-label="Price per day"
      />
      <div className="body-sm text-ink-60 tabular-nums">
        ${value[0]} – ${value[1]} / day
      </div>
    </div>
  );
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function total(record: Record<string, number>): number {
  return Object.values(record).reduce((sum, n) => sum + n, 0);
}
