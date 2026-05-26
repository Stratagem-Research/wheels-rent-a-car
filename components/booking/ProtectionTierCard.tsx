"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatUsd } from "@/lib/booking/pricing";
import type { ProtectionTier } from "@/types/domain";

/**
 * Protection tier card — INK & SIGNAL repaint (Phase 8).
 *
 * - Surface: `card` (paper + 1px border). Tinted inner box for the
 *   "max liability" callout uses `card-tint` (ink-10).
 * - Popular tier: 2px ink-100 outline + `badge-popular` (black ribbon).
 * - Selected: 2px ink-100 ring with offset.
 * - Inclusions list checkmark in ink-100 (no decorative green).
 */

export interface ProtectionTierCardProps {
  tier: ProtectionTier;
  selected: boolean;
  onSelect: () => void;
}

export function ProtectionTierCard({ tier, selected, onSelect }: ProtectionTierCardProps) {
  return (
    <article
      className={cn(
        "bg-paper relative flex h-full flex-col rounded-xl border p-6 duration-200",
        tier.popular ? "border-ink-100 border-2" : "border-border",
        selected && "ring-ink-100 ring-2 ring-offset-2",
      )}
    >
      {tier.popular ? (
        <div className="absolute -top-3 right-4">
          <Badge variant="popular">Popular</Badge>
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <h3 className="headline-md text-ink-95">{tier.name}</h3>
        <div className="label-lg text-ink-60">
          {tier.perDayCents === 0 ? "Included" : `+${formatUsd(tier.perDayCents)}/day`}
        </div>
      </div>
      <div className="bg-ink-10 my-5 rounded-xl px-4 py-3">
        <div className="text-ink-60 overline">Your max liability</div>
        <div className="price-lg text-ink-95 mt-1">
          {tier.deductibleCents === 0 ? "$0" : formatUsd(tier.deductibleCents)}
        </div>
      </div>
      <ul className="body-sm text-ink-80 flex flex-1 flex-col gap-2">
        {tier.inclusions.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check className="text-ink-100 mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <Button
        variant={selected ? "secondary" : "primary"}
        size="md"
        fullWidth
        onClick={onSelect}
        className="mt-5"
      >
        {selected ? (
          <>
            <Check className="size-4" aria-hidden="true" /> Selected
          </>
        ) : (
          "Select"
        )}
      </Button>
    </article>
  );
}
