"use client";

import * as React from "react";
import { Phone, Mail, MessageCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { ChannelCard } from "@/components/contact/ChannelCard";
import { ContactForm } from "@/components/contact/ContactForm";
import { LocationsMap } from "@/components/locations/LocationsMap";
import { BRANCHES } from "@/lib/api/mocks/fixtures/branches";
import { whatsAppHref } from "@/lib/whatsapp";

const SOCIALS = [
  { label: "Instagram", href: "https://instagram.com/" },
  { label: "Facebook", href: "https://facebook.com/" },
  { label: "LinkedIn", href: "https://linkedin.com/" },
];

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
  // Stable snapshot of "now" to drive the phone Open/Closed state without
  // shifting during the render lifecycle.
  const [now] = React.useState(() => new Date());
  const [selectedBranchId, setSelectedBranchId] = React.useState<string | null>(null);

  const phoneOpen = isPhoneOpen(now);

  return (
    <>
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">Contact</p>
          <h1 className="display-xl text-paper mt-3 text-[clamp(48px,6vw,72px)] leading-[0.98]">
            Get in touch.
          </h1>
          <p className="lead-lg text-ink-30 mt-4 max-w-2xl">
            We&apos;re available 24/7 on WhatsApp. Or pick the channel you prefer.
          </p>
        </div>
      </header>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <ul className="grid gap-4 sm:grid-cols-3 sm:gap-6">
            <li>
              <ChannelCard
                icon={<MessageCircle className="size-6" aria-hidden="true" />}
                title="WhatsApp"
                description="Fastest reply, 24/7."
                contact="+961 3 100 200"
                hours="24/7"
                cta={{
                  label: "Chat now",
                  href: whatsAppHref("default"),
                  variant: "whatsapp",
                }}
                highlight
              />
            </li>
            <li>
              <ChannelCard
                icon={<Phone className="size-6" aria-hidden="true" />}
                title="Phone"
                description="Talk to us during business hours."
                contact="+961 1 629 100"
                hours="Mon–Sat · 8:00 – 20:00"
                cta={{ label: "Call", href: "tel:+9611629100" }}
                closed={!phoneOpen}
                closedMessage="Closed — message us on WhatsApp."
              />
            </li>
            <li>
              <ChannelCard
                icon={<Mail className="size-6" aria-hidden="true" />}
                title="Email"
                description="For longer enquiries."
                contact="hello@wheelsrentacar.com.lb"
                hours="Reply within 4h"
                cta={{ label: "Email", href: "mailto:hello@wheelsrentacar.com.lb" }}
              />
            </li>
          </ul>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-10 lg:py-24">
          <Card variant="default" className="flex flex-col gap-3 rounded-xl p-8">
            <h2 className="headline-lg text-ink-100">Send us a message</h2>
            <p className="body-md text-ink-60">We respond within 4 business hours.</p>
            <div className="mt-4">
              <ContactForm />
            </div>
          </Card>
        </div>
      </section>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <h2 className="headline-lg text-ink-100">Find a branch</h2>
          <p className="lead-md text-ink-60 mt-2">
            Click a pin to highlight the matching branch below.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <LocationsMap
              branches={BRANCHES}
              selectedId={selectedBranchId}
              onSelect={setSelectedBranchId}
              className="min-h-[360px]"
            />
            <ul className="flex flex-col gap-3">
              {BRANCHES.map((b) => (
                <li key={b.id}>
                  <Card
                    variant="default"
                    className={
                      selectedBranchId === b.id
                        ? "border-ink-100 rounded-xl border-2"
                        : "rounded-xl"
                    }
                  >
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
          <h2 className="headline-lg text-ink-100">Follow us</h2>
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
            contactPoint: [
              {
                "@type": "ContactPoint",
                contactType: "customer service",
                telephone: "+961 1 629 100",
                availableLanguage: ["English", "French", "Arabic"],
              },
              {
                "@type": "ContactPoint",
                contactType: "WhatsApp",
                telephone: "+961 3 100 200",
              },
            ],
          }),
        }}
      />
    </>
  );
}
