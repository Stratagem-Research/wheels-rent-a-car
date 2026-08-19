"use client";

import * as React from "react";
import {
  Baby,
  Fuel,
  Leaf,
  LifeBuoy,
  Map as MapIcon,
  Navigation,
  Sparkles,
  UserCheck,
  Users,
  Wifi,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/Switch";
import { QuantityStepper } from "@/components/ui/QuantityStepper";
import { Input } from "@/components/ui/Input";
import { addOnUnitPriceLabel } from "@/lib/booking/addons";
import { formatUsd } from "@/lib/booking/pricing";
import type { AddOn } from "@/types/domain";

/**
 * Single add-on row — INK & SIGNAL repaint (Phase 8).
 *
 * Toggle for single-quantity items, QuantityStepper for multi-quantity items.
 * Active state: 2px ink-100 outline (was blue background). The icon swatch
 * inverts to ink-100 / paper when active.
 *
 * Icon mapping lives module-level (not in render) so React can hoist it —
 * keeps the linter happy ("Cannot create components during render").
 */

const ICON_BY_NAME: Record<string, React.ComponentType<{ className?: string }>> = {
  users: Users,
  "user-check": UserCheck,
  map: MapIcon,
  baby: Baby,
  navigation: Navigation,
  wifi: Wifi,
  fuel: Fuel,
  "life-buoy": LifeBuoy,
  leaf: Leaf,
};

export interface AddOnRowProps {
  addOn: AddOn;
  qty: number;
  onQtyChange: (next: number) => void;
}

export function AddOnRow({ addOn, qty, onQtyChange }: AddOnRowProps) {
  const Icon = ICON_BY_NAME[addOn.icon] ?? Sparkles;
  const active = qty > 0;
  const priceLabel = addOnUnitPriceLabel(addOn);
  const lineTotal =
    addOn.quantityUnit === "gb" && qty > 0 ? formatUsd(addOn.priceCents * qty) : null;

  return (
    <div
      className={cn(
        "bg-paper flex flex-col gap-3 rounded-xl border p-4 transition-colors sm:flex-row sm:items-center sm:gap-5",
        active ? "border-ink-100 border-2" : "border-border",
      )}
    >
      <div className="flex items-start gap-3 sm:flex-1">
        <span
          aria-hidden="true"
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-lg",
            active ? "bg-ink-100 text-paper" : "bg-ink-10 text-ink-100",
          )}
        >
          <Icon className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="headline-xs text-ink-95">{addOn.name}</div>
          <p className="body-sm text-ink-60">{addOn.description}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:justify-end">
        <div className="flex flex-col items-end">
          <div className="price-md text-ink-95 whitespace-nowrap">{priceLabel}</div>
          {lineTotal ? (
            <span className="body-sm text-ink-60 tabular-nums">{lineTotal}</span>
          ) : null}
        </div>
        {addOn.quantityUnit === "gb" ? (
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={addOn.maxQuantity ?? 200}
            step={1}
            value={qty === 0 ? "" : qty}
            placeholder="0"
            aria-label={addOn.name}
            className="h-10 w-[7.5rem] shrink-0"
            endAdornment={<span className="label-md">GB</span>}
            onChange={(e) => {
              const raw = e.target.value;
              if (raw === "") {
                onQtyChange(0);
                return;
              }
              const next = Math.floor(Number(raw));
              if (Number.isNaN(next)) return;
              const max = addOn.maxQuantity ?? 200;
              onQtyChange(Math.min(max, Math.max(0, next)));
            }}
          />
        ) : addOn.multiQuantity ? (
          <QuantityStepper
            aria-label={addOn.name}
            value={qty}
            onValueChange={onQtyChange}
            min={0}
            max={addOn.maxQuantity ?? 4}
          />
        ) : (
          <Switch
            aria-label={addOn.name}
            checked={active}
            onCheckedChange={(c) => onQtyChange(c ? 1 : 0)}
          />
        )}
      </div>
    </div>
  );
}
