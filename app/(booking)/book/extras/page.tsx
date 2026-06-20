"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/booking/Stepper";
import { AddOnRow } from "@/components/booking/AddOnRow";
import { FlowSummaryPanel } from "@/components/booking/FlowSummaryPanel";
import { useBookingDraft } from "@/hooks/useBookingDraft";
import { useBookingCatalog } from "@/hooks/useBookingCatalog";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import type { AddOnCategory } from "@/types/domain";

const CATEGORY_ORDER: { id: AddOnCategory; titleKey: string }[] = [
  { id: "driver-access", titleKey: "categoryDriverAccess" },
  { id: "comfort", titleKey: "categoryComfort" },
  { id: "connectivity", titleKey: "categoryConnectivity" },
  { id: "convenience", titleKey: "categoryConvenience" },
  { id: "sustainability", titleKey: "categorySustainability" },
];

/**
 * Step 2 — /book/extras. Lists all add-ons grouped by category. The right
 * panel total recomputes within 200ms on every toggle (the FlowSummaryPanel
 * subscribes to draft changes via state).
 *
 * Vehicle-gone guard: if the draft has no vehicle (or the selected vehicle
 * is missing from the fixture), bounce back to step 1.
 */
export default function ExtrasPage() {
  const t = useTranslations("bookingFlow");
  const router = useRouter();
  const { draft, upsertExtra, ready } = useBookingDraft();
  const { addOns: ADD_ONS, protectionTiers: PROTECTION_TIERS, vehicles: VEHICLES, branches: BRANCHES } =
    useBookingCatalog();
  const firedView = React.useRef(false);

  // Fire extras_viewed once per mount.
  React.useEffect(() => {
    if (!ready || !draft || firedView.current) return;
    firedView.current = true;
    track(EVENTS.EXTRAS_VIEWED);
  }, [ready, draft]);

  // Vehicle gone? Back to step 1.
  React.useEffect(() => {
    if (!ready || !draft) return;
    if (!draft.vehicle) {
      router.replace("/book/select-vehicle");
    }
  }, [ready, draft, router]);

  if (!ready || !draft) {
    return (
      <>
        <Stepper current={2} />
        <div className="mx-auto max-w-[var(--container-full)] px-5 py-10 sm:px-5">
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </>
    );
  }

  const vehicle = draft.vehicle
    ? VEHICLES.find((v) => v.id === draft.vehicle?.vehicleId)
    : undefined;

  const qtyOf = (addOnId: string): number =>
    draft.extras.find((e) => e.addOnId === addOnId)?.qty ?? 0;

  const setQty = (addOnId: string, qty: number) => {
    upsertExtra({ addOnId, qty });
    if (qty > 0) track(EVENTS.EXTRAS_ADDED, { addOnId, qty });
  };

  return (
    <>
      <Stepper current={2} />
      <section className="mx-auto max-w-[var(--container-full)] px-5 py-8 sm:px-5 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <Button asChild variant="tertiary" size="sm" className="mb-3">
              <a href="/book/select-vehicle">
                <ArrowLeft className="size-4" aria-hidden="true" /> {t("extras.backToVehicles")}
              </a>
            </Button>
            <h1 className="headline-xl text-ink-95">{t("extras.heading")}</h1>
            <p className="body-md text-ink-60 mt-1">{t("extras.subtitle")}</p>

            <div className="mt-8 flex flex-col gap-8">
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
              primary={{
                label: t("continue"),
                onClick: () => router.push("/book/protection"),
              }}
            />
          </aside>
        </div>
      </section>
    </>
  );
}
