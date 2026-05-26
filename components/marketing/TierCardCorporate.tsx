"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatUsd } from "@/lib/booking/pricing";
import type { CorporateTier } from "@/types/domain";

/**
 * Corporate tier card — mirrors `TierCardLongTerm` so the two service
 * surfaces read as a pair. Surface `card-tint` (ink-10); popular tier
 * gets the 2px ink-100 outline + paper bg + `badge-popular` ribbon. The
 * `Get a quote` / `Contact sales` button stays `primary` (black) — red is
 * reserved for the lone CTA on the enquiry-form submit at the bottom of
 * the page.
 *
 * `perDayCents === null` means "quote-only" (Enterprise tier): the price
 * line collapses to a label so we don't fake a public rate.
 */
export interface TierCardCorporateProps {
  tier: CorporateTier;
  onSelect: (tierId: CorporateTier["id"]) => void;
}

export function TierCardCorporate({ tier, onSelect }: TierCardCorporateProps) {
  return (
    <article
      className={cn(
        "bg-ink-10 relative flex h-full flex-col gap-4 rounded-xl p-6",
        tier.popular && "border-ink-100 bg-paper border-2",
      )}
    >
      {tier.popular ? (
        <div className="absolute -top-3 right-4">
          <Badge variant="popular">Popular</Badge>
        </div>
      ) : null}
      <div>
        <span className="text-ink-60 overline">{tier.name}</span>
        <p className="body-sm text-ink-60 mt-1">{tier.tagline}</p>
        <div className="mt-3 flex items-baseline gap-1">
          {tier.perDayCents !== null ? (
            <>
              <span className="price-lg text-ink-95">{formatUsd(tier.perDayCents)}</span>
              <span className="label-md text-ink-60">/ day</span>
            </>
          ) : (
            <span className="price-lg text-ink-95">Custom</span>
          )}
        </div>
        <span className="label-md text-ink-50">{tier.fleetSize}</span>
      </div>
      <ul className="body-sm text-ink-80 flex flex-1 flex-col gap-2">
        {tier.inclusions.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check className="text-ink-100 mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <Button variant="primary" size="sm" fullWidth onClick={() => onSelect(tier.id)}>
        {tier.ctaLabel ?? "Get a quote"}
      </Button>
    </article>
  );
}
