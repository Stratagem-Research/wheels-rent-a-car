"use client";

import * as React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/booking/Stepper";
import { ProtectionTierCard } from "@/components/booking/ProtectionTierCard";
import { FlowSummaryPanel } from "@/components/booking/FlowSummaryPanel";
import { useBookingFunnelPage } from "@/hooks/useBookingFunnelPage";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

/**
 * Step 3 — /book/protection. 3-up tier comparison. Continue requires a tier.
 */
export default function ProtectionPage() {
  const t = useTranslations("bookingFlow");
  const {
    draft,
    setProtection,
    vehicle,
    showSkeleton,
    goToStep,
    addOns: ADD_ONS,
    protectionTiers: PROTECTION_TIERS,
    branches: BRANCHES,
    deliveryPricing: DELIVERY_PRICING,
  } = useBookingFunnelPage();
  const protectionFaqs = t.raw("protection.faqs") as { q: string; a: string }[];
  const selectedTierId = draft?.protectionTierId;

  // Smart is the popular tier — preselect it so most customers don't have
  // to make a choice, but never override a tier the customer already picked.
  React.useEffect(() => {
    if (!draft || selectedTierId) return;
    const popular = PROTECTION_TIERS.find((tier) => tier.popular);
    if (popular) setProtection(popular.id);
  }, [draft, selectedTierId, PROTECTION_TIERS, setProtection]);

  if (showSkeleton || !draft) {
    return (
      <>
        <Stepper current={3} />
        <div className="mx-auto max-w-(--container-full) px-4 py-8 sm:px-5">
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </>
    );
  }

  const onSelect = (tierId: string) => {
    setProtection(tierId);
    track(EVENTS.PROTECTION_SELECTED, { tierId });
  };

  return (
    <>
      <Stepper current={3} />
      <section className="mx-auto max-w-(--container-full) px-4 py-6 sm:px-5 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="mb-3"
              onClick={() => goToStep("/book/extras")}
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> {t("protection.backToExtras")}
            </Button>
            <h1 className="headline-lg text-ink-95">{t("protection.heading")}</h1>
            <p className="body-md text-ink-60 mt-1">{t("protection.subtitle")}</p>

            <ul className="mt-8 grid gap-4 lg:grid-cols-3 lg:gap-6">
              {PROTECTION_TIERS.map((tier) => (
                <li
                  key={tier.id}
                  className={tier.popular ? "order-first lg:order-none" : undefined}
                >
                  <ProtectionTierCard
                    tier={tier}
                    selected={selectedTierId === tier.id}
                    onSelect={() => onSelect(tier.id)}
                  />
                </li>
              ))}
            </ul>

            <section aria-labelledby="protection-faq" className="mt-10">
              <h2 id="protection-faq" className="headline-md text-ink-95">
                {t("protection.faqHeading")}
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-6">
                {protectionFaqs.map((row) => (
                  <div key={row.q} className="flex flex-col gap-1">
                    <dt className="headline-xs text-ink-95">{row.q}</dt>
                    <dd className="body-sm text-ink-60">{row.a}</dd>
                  </div>
                ))}
              </dl>
              <Link
                href="/help/insurance-and-coverage"
                className="label-lg text-ink-100 hover:text-ink-80 mt-4 inline-block underline-offset-4 hover:underline"
              >
                {t("protection.readTerms")} →
              </Link>
            </section>
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
                onClick: () => goToStep("/book/checkout"),
                disabled: !selectedTierId,
              }}
            />
          </aside>
        </div>
      </section>
    </>
  );
}
