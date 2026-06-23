"use client";

import {
  Clock,
  Cog,
  Droplets,
  Heart,
  Sofa,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCarWashPackagePrice, formatDurationMinutes } from "@/lib/car-wash/display-price";
import { getLocalizedString } from "@/lib/i18n/localized";
import type { CarWashPackage } from "@/types/domain";

const ICON_BY_NAME: Record<string, LucideIcon> = {
  droplets: Droplets,
  sparkles: Sparkles,
  sofa: Sofa,
  cog: Cog,
  heart: Heart,
};

export interface TierCardCarWashProps {
  pkg: CarWashPackage;
  onSelect: (packageId: string) => void;
}

export function TierCardCarWash({ pkg, onSelect }: TierCardCarWashProps) {
  const t = useTranslations("carWash");
  const tCards = useTranslations("tierCards");
  const locale = useLocale();
  const Icon = ICON_BY_NAME[pkg.icon] ?? Sparkles;
  const name = getLocalizedString(pkg.name, locale);
  const description = getLocalizedString(pkg.description, locale);
  const priceLabel = formatCarWashPackagePrice(pkg, {
    car: t("vehicleCar"),
    suv: t("vehicleSuv"),
    quoteOnRequest: tCards("custom"),
  });

  return (
    <article
      className={cn(
        "bg-ink-10 relative flex h-full flex-col gap-4 rounded-xl p-6",
        pkg.popular && "border-ink-100 bg-paper border-2",
      )}
    >
      {pkg.popular ? (
        <div className="absolute -top-3 right-4">
          <Badge variant="popular">{tCards("popular")}</Badge>
        </div>
      ) : null}
      <span className="bg-ink-10 text-ink-100 inline-flex size-10 items-center justify-center rounded-md">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <div>
        <h3 className="headline-md text-ink-100">{name}</h3>
        <p className="body-sm text-ink-60 mt-2">{description}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="label-md text-ink-60 inline-flex items-center gap-1">
          <Clock className="size-3.5" aria-hidden="true" />
          {formatDurationMinutes(pkg.durationMinutes)}
        </span>
        {pkg.turnaroundHours ? (
          <span className="label-md text-warning">{t("turnaroundHours", { hours: pkg.turnaroundHours })}</span>
        ) : null}
      </div>
      <p className="price-md text-ink-95 mt-auto">{priceLabel}</p>
      <Button variant="primary" size="sm" fullWidth onClick={() => onSelect(pkg.id)}>
        {t("requestPackage")}
      </Button>
    </article>
  );
}
