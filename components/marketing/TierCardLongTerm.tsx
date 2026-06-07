"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatUsd } from "@/lib/booking/pricing";
import type { LongTermTier } from "@/types/domain";

/**
 * Long-term tier card — INK & SIGNAL repaint (Phase 9, 06_long_term.md).
 *
 * Surface `card-tint` (ink-10). Popular tier gets a 2px ink-100 outline +
 * `badge-popular` ribbon. The Get-a-quote button is `primary` (black) on
 * every tier — red is reserved for the lone CTA on the enquiry-form submit.
 * Savings labels go monochrome (ink-100) instead of success-green.
 */
export interface TierCardLongTermProps {
  tier: LongTermTier;
  onSelect: (durationMonths: LongTermTier["durationMonths"]) => void;
}

export function TierCardLongTerm({ tier, onSelect }: TierCardLongTermProps) {
  const t = useTranslations("tierCards");
  return (
    <article
      className={cn(
        "bg-ink-10 relative flex h-full flex-col gap-4 rounded-xl p-6",
        tier.popular && "border-ink-100 bg-paper border-2",
      )}
    >
      {tier.popular ? (
        <div className="absolute -top-3 right-4">
          <Badge variant="popular">{t("popular")}</Badge>
        </div>
      ) : null}
      <div>
        <span className="text-ink-60 overline">
          {t("months", { count: tier.durationMonths })}
        </span>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="price-lg text-ink-95">{formatUsd(tier.perDayCents)}</span>
          <span className="label-md text-ink-60">{t("perDay")}</span>
        </div>
        {tier.savingsPercent > 0 ? (
          <span className="label-md text-ink-100">{t("save", { percent: tier.savingsPercent })}</span>
        ) : (
          <span className="label-md text-ink-50">{t("standardRate")}</span>
        )}
      </div>
      <ul className="body-sm text-ink-80 flex flex-1 flex-col gap-2">
        {tier.inclusions.map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Check className="text-ink-100 mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <Button variant="primary" size="sm" fullWidth onClick={() => onSelect(tier.durationMonths)}>
        {t("getQuote")}
      </Button>
    </article>
  );
}
