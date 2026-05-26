"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/booking/Stepper";
import { ProtectionTierCard } from "@/components/booking/ProtectionTierCard";
import { FlowSummaryPanel } from "@/components/booking/FlowSummaryPanel";
import { useBookingDraft } from "@/hooks/useBookingDraft";
import { BRANCHES } from "@/lib/api/mocks/fixtures/branches";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import { ADD_ONS, PROTECTION_TIERS } from "@/lib/api/mocks/fixtures/catalog";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";

const PROTECTION_FAQ = [
  {
    q: "What does the deductible cover?",
    a: "It's the most you'd pay out of pocket for damages. Basic protection has an $800 deductible; Smart drops it to $250; All-inclusive sets it to zero.",
  },
  {
    q: "Can I change this at the counter?",
    a: "Yes. You can upgrade your protection when you pick up the car — but you can't downgrade once the rental has started.",
  },
  {
    q: "Are tyre and windscreen damage covered?",
    a: "From the Smart tier and up. Basic doesn't include tyre or windscreen cover, so you'd pay for those repairs yourself.",
  },
];

/**
 * Step 3 — /book/protection. 3-up tier comparison. Continue requires a tier.
 *
 * On mobile, the Smart (popular) tier is rendered first per
 * 04_booking_flow.md ("Smart first on mobile"). We achieve that with a flex
 * order utility rather than a separate render path.
 */
export default function ProtectionPage() {
  const router = useRouter();
  const { draft, setProtection, ready } = useBookingDraft();

  React.useEffect(() => {
    if (!ready || !draft) return;
    if (!draft.vehicle) router.replace("/book/select-vehicle");
  }, [ready, draft, router]);

  if (!ready || !draft) {
    return (
      <>
        <Stepper current={3} />
        <div className="mx-auto max-w-[var(--container-full)] px-5 py-10 sm:px-5">
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </>
    );
  }

  const vehicle = draft.vehicle
    ? VEHICLES.find((v) => v.id === draft.vehicle?.vehicleId)
    : undefined;
  const selectedTierId = draft.protectionTierId;

  const onSelect = (tierId: string) => {
    setProtection(tierId);
    track(EVENTS.PROTECTION_SELECTED, { tierId });
  };

  return (
    <>
      <Stepper current={3} />
      <section className="mx-auto max-w-[var(--container-full)] px-5 py-8 sm:px-5 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div>
            <h1 className="headline-xl text-ink-95">Choose your protection</h1>
            <p className="body-md text-ink-60 mt-1">
              Drive with peace of mind. You can upgrade at the counter.
            </p>

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
                Common questions
              </h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-3 sm:gap-6">
                {PROTECTION_FAQ.map((row) => (
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
                Read full insurance terms →
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
              primary={{
                label: "Continue",
                onClick: () => router.push("/book/checkout"),
                disabled: !selectedTierId,
              }}
            />
          </aside>
        </div>
      </section>
    </>
  );
}
