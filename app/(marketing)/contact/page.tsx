"use client";

import * as React from "react";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card } from "@/components/ui/Card";
import { ChannelCard } from "@/components/contact/ChannelCard";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHero } from "@/components/marketing/PageHero";
import { PAGE_HERO_IMAGES } from "@/lib/marketing/hero-images";
import { BRANCHES } from "@/lib/api/fixtures/branches";
import type { Branch } from "@/types/domain";
import {
  useContactSettings,
  useTelHref,
  useWhatsAppHref,
} from "@/components/providers/ContactSettingsProvider";
import { SOCIAL_LINKS_LIST } from "@/lib/marketing/social-links";

const SOCIALS = SOCIAL_LINKS_LIST;

// The contact page's "Find a branch" section shows the single physical hub
// (Hazmieh). The airport meet-and-greet entry is a booking-flow pickup point,
// not a branch you visit — keep it out of this list.
const CONTACT_BRANCHES: Branch[] = BRANCHES.filter((b) => !b.isAirport);
const MAP_BRANCH = CONTACT_BRANCHES[0] ?? BRANCHES[0]!;
const MAP_QUERY = "Wheels rent a car, Hazmieh, Lebanon";

const PHONE_HOURS = {
  weekdayStart: 8,
  weekdayEnd: 20,
};

function isPhoneOpen(now: Date) {
  const hour = now.getHours();
  const day = now.getDay(); // 0 = Sun
  // Mon-Sat 8-20.
  if (day === 0) return false;
  return hour >= PHONE_HOURS.weekdayStart && hour < PHONE_HOURS.weekdayEnd;
}

export default function ContactPage() {
  const whatsAppHref = useWhatsAppHref();
  const telHref = useTelHref();
  const { phone, whatsapp, email } = useContactSettings();
  const t = useTranslations("contact");
  // Stable snapshot of "now" to drive the phone Open/Closed state without
  // shifting during the render lifecycle.
  const [now] = React.useState(() => new Date());

  const phoneOpen = isPhoneOpen(now);

  return (
    <>
      {/* Cinematic photo-backed hero — see lib/marketing/hero-images.ts. */}
      <PageHero
        overline={t("eyebrow")}
        headline={t("heroHeading")}
        headlineClassName="display-xl text-[clamp(48px,6vw,72px)] leading-[0.98]"
        lead={t("heroSubtitle")}
        image={PAGE_HERO_IMAGES.contact}
      />

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <ul className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            <li>
              <ChannelCard
                icon={<MessageCircle className="size-6" aria-hidden="true" />}
                title={t("whatsappTitle")}
                description={t("whatsappDescription")}
                contact={whatsapp}
                hours={t("whatsappHours")}
                cta={{
                  label: t("chatNow"),
                  href: whatsAppHref("default"),
                  variant: "whatsapp",
                }}
                highlight
              />
            </li>
            <li>
              <ChannelCard
                icon={<Phone className="size-6" aria-hidden="true" />}
                title={t("phoneTitle")}
                description={t("phoneDescription")}
                contact={phone}
                hours={t("phoneHours")}
                cta={{ label: t("call"), href: telHref }}
                closed={!phoneOpen}
                closedMessage={t("closedMessage")}
              />
            </li>
            <li>
              <ChannelCard
                icon={<Mail className="size-6" aria-hidden="true" />}
                title={t("emailTitle")}
                description={t("emailDescription")}
                contact={email}
                hours={t("emailHours")}
                cta={{ label: t("email"), href: `mailto:${email}` }}
              />
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <Card variant="default" className="flex flex-col gap-3 rounded-xl p-8">
            <h2 className="headline-lg text-ink-100">{t("sendHeading")}</h2>
            <p className="body-md text-ink-60">{t("sendSubtitle")}</p>
            <div className="mt-4">
              <ContactForm />
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <h2 className="headline-lg text-ink-100">{t("findBranchHeading")}</h2>
          <p className="lead-md text-ink-60 mt-2">{t("findBranchSubtitle")}</p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <div className="border-border overflow-hidden rounded-xl border">
              <iframe
                title={t("mapTitle", { branch: MAP_BRANCH.name })}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(MAP_QUERY)}&z=15&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-full min-h-[360px] w-full"
              />
            </div>
            <ul className="flex flex-col gap-3">
              {CONTACT_BRANCHES.map((b) => (
                <li key={b.id}>
                  <Card variant="default" className="rounded-xl">
                    <div className="headline-xs text-ink-100">{b.name}</div>
                    <a
                      href={`tel:${b.phone.replace(/\s/g, "")}`}
                      className="body-sm text-ink-100 mt-2 inline-flex items-center gap-1.5 hover:underline"
                    >
                      <Phone className="size-3.5" aria-hidden="true" />
                      {b.phone}
                    </a>
                    <div className="label-md text-ink-50 mt-1 truncate">{b.address}</div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-5 py-12 text-center sm:px-10 lg:py-16">
          <h2 className="headline-lg text-ink-100">{t("followHeading")}</h2>
          <ul className="flex items-center gap-6">
            {SOCIALS.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="label-lg text-ink-100 underline-offset-4 hover:underline"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "Wheels Rent A Car",
            email,
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "customer service",
                telephone: phone,
                availableLanguage: ["English", "French", "Arabic"],
              },
              {
                "@type": "ContactPoint",
                contactType: "WhatsApp",
                telephone: whatsapp,
              },
            ],
          }),
        }}
      />
    </>
  );
}
