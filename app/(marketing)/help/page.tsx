import {
  BookOpen,
  ShieldCheck,
  CreditCard,
  CalendarX,
  HelpCircle,
  MessageCircle,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { HelpSearchBar } from "@/components/help/HelpSearchBar";
import { HELP_TOPICS, type HelpTopicIconName } from "@/lib/content/help";
import { whatsAppHref } from "@/lib/whatsapp";
import { Link } from "@/i18n/navigation";

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

export default async function HelpHubPage() {
  const t = await getTranslations("helpUi");
  return (
    <>
      {/* Inverse hero — keep the search input on a paper card for visibility. */}
      <header className="bg-ink-100 text-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <p className="text-ink-40 overline">{t("helpSupport")}</p>
          <h1 className="display-xl text-paper mt-3 max-w-3xl text-[clamp(48px,6vw,72px)] leading-[0.98]">
            {t("howCanWeHelp")}
          </h1>
          <p className="lead-lg text-ink-30 mt-4 max-w-2xl">{t("browseOrChat")}</p>
          <div className="mt-8 max-w-2xl">
            <HelpSearchBar />
          </div>
        </div>
      </header>

      <section className="bg-paper">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-16 sm:px-10 lg:py-24">
          <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {HELP_TOPICS.map((topic) => {
              const Icon = ICON_MAP[topic.iconName];
              return (
                <li key={topic.slug}>
                  <Link
                    href={
                      topic.slug === "whatsapp" ? whatsAppHref("default") : `/help/${topic.slug}`
                    }
                    target={topic.slug === "whatsapp" ? "_blank" : undefined}
                    rel={topic.slug === "whatsapp" ? "noopener noreferrer" : undefined}
                  >
                    <Card variant="tint" hoverable className="flex h-full flex-col gap-3">
                      <Icon className="text-ink-100 size-8" strokeWidth={1.5} aria-hidden={true} />
                      <h3 className="headline-sm text-ink-100">{topic.title}</h3>
                      <p className="body-sm text-ink-60 flex-1">{topic.blurb}</p>
                      <span className="label-lg text-ink-100">{t("view")} →</span>
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
          <h2 className="headline-lg text-ink-100">{t("stillNeedHelp")}</h2>
          <p className="lead-md text-ink-60">{t("supportAvailability")}</p>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="whatsapp" size="md">
              <a href={whatsAppHref("default")} target="_blank" rel="noopener noreferrer">
                {t("chatOnWhatsapp")}
              </a>
            </Button>
            <Button asChild variant="secondary" size="md">
              <a href="tel:+9611629100">{t("call")} +961 1 629 100</a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
