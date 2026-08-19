"use client";

import { useLocale, useTranslations } from "next-intl";
import { chipVariants } from "@/components/ui/Chip";
import { cn } from "@/lib/utils";
import { formatDateShortByLocale, formatTimeByLocale } from "@/lib/i18n/format";
import type { SearchCriteria } from "@/lib/search/types";

export function VehiclesDateFilterChip({ criteria }: { criteria: SearchCriteria }) {
  const t = useTranslations("vehicles");
  const locale = useLocale();
  const range =
    `${formatDateShortByLocale(criteria.pickupDate, locale)} | ${formatTimeByLocale(criteria.pickupTime, locale)}` +
    ` – ` +
    `${formatDateShortByLocale(criteria.returnDate, locale)} | ${formatTimeByLocale(criteria.returnTime, locale)}`;

  return (
    <span
      className={cn(chipVariants({ variant: "selected" }), "cursor-default")}
      aria-current="true"
    >
      {t("datesFilterApplied", { range })}
    </span>
  );
}
