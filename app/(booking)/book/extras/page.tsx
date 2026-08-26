"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/booking/Stepper";
import { AddOnRow } from "@/components/booking/AddOnRow";
import { FlowSummaryPanel } from "@/components/booking/FlowSummaryPanel";
import { useBookingFunnelPage } from "@/hooks/useBookingFunnelPage";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import { isWifiDataPlan } from "@/lib/api/fixtures/catalog";
import { ADDITIONAL_DRIVER_ADDON_ID } from "@/lib/booking/addons";
import type { AddOnCategory } from "@/types/domain";

const CATEGORY_ORDER: { id: AddOnCategory; titleKey: string }[] = [
  { id: "driver-access", titleKey: "categoryDriverAccess" },
  { id: "comfort", titleKey: "categoryComfort" },
  { id: "connectivity", titleKey: "categoryConnectivity" },
  { id: "convenience", titleKey: "categoryConvenience" },
  { id: "sustainability", titleKey: "categorySustainability" },
];

export default function ExtrasPage() {
  const t = useTranslations("bookingFlow");
  const {
    draft,
    upsertExtra,
    setAdditionalDriver,
    vehicle,
    showSkeleton,
    goToStep,
    addOns: ADD_ONS,
    protectionTiers: PROTECTION_TIERS,
    branches: BRANCHES,
    deliveryPricing: DELIVERY_PRICING,
  } = useBookingFunnelPage();
  const firedView = React.useRef(false);

  React.useEffect(() => {
    if (!draft || firedView.current) return;
    firedView.current = true;
    track(EVENTS.EXTRAS_VIEWED);
  }, [draft]);

  if (showSkeleton || !draft) {
    return (
      <>
        <Stepper current={2} />
        <div className="mx-auto max-w-(--container-full) px-4 py-8 sm:px-5">
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </>
    );
  }

  const qtyOf = (addOnId: string): number =>
    draft.extras.find((e) => e.addOnId === addOnId)?.qty ?? 0;

  const setQty = (addOnId: string, qty: number) => {
    if (qty > 0 && isWifiDataPlan(addOnId)) {
      for (const extra of draft.extras) {
        if (extra.addOnId !== addOnId && isWifiDataPlan(extra.addOnId)) {
          upsertExtra({ addOnId: extra.addOnId, qty: 0 });
        }
      }
    }
    upsertExtra({ addOnId, qty });
    if (qty > 0) track(EVENTS.EXTRAS_ADDED, { addOnId, qty });
    if (addOnId === ADDITIONAL_DRIVER_ADDON_ID && qty <= 0) {
      setAdditionalDriver(undefined);
    }
  };

  return (
    <>
      <Stepper current={2} />
      <section className="mx-auto max-w-(--container-full) px-4 py-6 sm:px-5 sm:pb-8 sm:pt-4">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <Button asChild variant="tertiary" size="sm" className="mb-3">
              <a href="/book/select-vehicle">
                <ArrowLeft className="size-4" aria-hidden="true" /> {t("extras.backToVehicles")}
              </a>
            </Button>
            <h1 className="headline-lg text-ink-95">{t("extras.heading")}</h1>

            <div className="mt-6 flex flex-col gap-8">
              {CATEGORY_ORDER.map((cat) => {
                const items = ADD_ONS.filter((a) => a.category === cat.id);
                if (items.length === 0) return null;
                return (
                  <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
                    <h2 id={`cat-${cat.id}`} className="text-ink-100 mb-3 overline">
                      {t(`extras.${cat.titleKey}`)}
                    </h2>
                    <div className="flex flex-col gap-3">
                      {items.map((addOn) => (
                        <AddOnRow
                          key={addOn.id}
                          addOn={addOn}
                          qty={qtyOf(addOn.id)}
                          onQtyChange={(qty) => setQty(addOn.id, qty)}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <FlowSummaryPanel
              draft={draft}
              vehicle={vehicle}
              branches={BRANCHES}
              addOns={ADD_ONS}
              tiers={PROTECTION_TIERS}
              deliveryPricing={DELIVERY_PRICING}
              primary={{
                label: t("continue"),
                onClick: () => goToStep("/book/protection"),
              }}
            />
          </aside>
        </div>
      </section>
    </>
  );
}
