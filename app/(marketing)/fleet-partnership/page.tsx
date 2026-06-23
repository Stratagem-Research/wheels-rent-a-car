"use client";

import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { EnquiryFormFleetPartnership } from "@/components/leads/EnquiryFormFleetPartnership";

export default function FleetPartnershipPage() {
  const t = useTranslations("fleetPartnership");

  return (
    <section className="bg-paper">
      <div className="mx-auto max-w-2xl px-5 py-16 sm:px-10 lg:py-24">
        <div className="flex flex-col gap-3">
          <p className="text-ink-60 overline">{t("eyebrow")}</p>
          <h1 className="display-md text-ink-100 text-[clamp(28px,4vw,44px)] leading-[1.1]">
            {t("heading")}
          </h1>
          <p className="lead-md text-ink-60">{t("lead")}</p>
        </div>
        <Card variant="default" className="mt-10 flex flex-col gap-3 rounded-xl p-8">
          <h2 className="headline-md text-ink-100">{t("formHeading")}</h2>
          <p className="body-md text-ink-60">{t("formSubtitle")}</p>
          <div className="mt-4">
            <EnquiryFormFleetPartnership />
          </div>
        </Card>
      </div>
    </section>
  );
}
