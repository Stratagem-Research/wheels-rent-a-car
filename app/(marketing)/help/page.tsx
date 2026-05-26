import Link from "next/link";
import {
  BookOpen,
  ShieldCheck,
  CreditCard,
  CalendarX,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HelpSearchBar } from "@/components/help/HelpSearchBar";
import { HELP_TOPICS, type HelpTopicIconName } from "@/lib/content/help";
import { whatsAppHref } from "@/lib/whatsapp";

const ICON_MAP: Record<
  HelpTopicIconName,
  React.ComponentType<{ className?: string; strokeWidth?: number; "aria-hidden"?: boolean }>
> = {
  "book-open": BookOpen,
  "shield-check": ShieldCheck,
  "credit-card": CreditCard,
  "calendar-x": CalendarX,
  "help-circle": HelpCircle,
  "message-circle": MessageCircle,
};

export const metadata = {
  title: "Help & Support · Wheels Rent A Car",
  description:
    "Find answers about booking, pickup, payment, insurance, and cancellation. Or chat with us on WhatsApp.",
};

export default function HelpHubPage() {
  return (
    <>
      {/* Inverse hero — keep the search input on a paper card for visibility. */}
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">Help & support</p>
          <h1 className="display-xl text-paper mt-3 max-w-3xl text-[clamp(48px,6vw,72px)] leading-[0.98]">
            How can we help?
          </h1>
          <p className="lead-lg text-ink-30 mt-4 max-w-2xl">
            Browse common questions or chat with our team.
          </p>
          <div className="mt-8 max-w-2xl">
            <HelpSearchBar />
          </div>
        </div>
      </header>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {HELP_TOPICS.map((t) => {
              const Icon = ICON_MAP[t.iconName];
              return (
                <li key={t.slug}>
                  <Link
                    href={t.slug === "whatsapp" ? whatsAppHref("default") : `/help/${t.slug}`}
                    target={t.slug === "whatsapp" ? "_blank" : undefined}
                    rel={t.slug === "whatsapp" ? "noopener noreferrer" : undefined}
                  >
                    <Card variant="tint" hoverable className="flex h-full flex-col gap-3">
                      <Icon className="text-ink-100 size-8" strokeWidth={1.5} aria-hidden={true} />
                      <h3 className="headline-sm text-ink-100">{t.title}</h3>
                      <p className="body-sm text-ink-60 flex-1">{t.blurb}</p>
                      <span className="label-lg text-ink-100">View →</span>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-ink-10">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-5 py-16 text-center sm:px-10 lg:py-20">
          <h2 className="headline-lg text-ink-100">Still need help?</h2>
          <p className="lead-md text-ink-60">
            Our team is on WhatsApp 24/7 and on the phone during business hours.
          </p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="whatsapp" size="md">
              <a href={whatsAppHref("default")} target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp
              </a>
            </Button>
            <Button asChild variant="secondary" size="md">
              <a href="tel:+9611629100">Call +961 1 629 100</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
