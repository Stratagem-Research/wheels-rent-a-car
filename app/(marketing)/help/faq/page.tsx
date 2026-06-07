"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FaqTopicNav } from "@/app/(marketing)/help/faq/_components/FaqTopicNav";
import { FaqAccordion } from "@/components/help/FaqAccordion";
import { Button } from "@/components/ui/Button";
import { useFaqs } from "@/lib/admin/useAdminStore";
import { whatsAppHref } from "@/lib/whatsapp";
import { getLocalizedString } from "@/lib/i18n/localized";

/**
 * /help/faq — central FAQ surface.
 *
 * Reads FAQs from Supabase via `useFaqs()` → `/api/cms/faqs`.
 * JSON-LD is rendered from the same hook so structured data matches visible content.
 */
export default function FaqPage() {
  const faqs = useFaqs();
  const locale = useLocale();
  const t = useTranslations("helpUi");

  return (
    <>
      <header className="bg-ink-10">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-10 sm:px-10 sm:py-14">
          <h1 className="headline-xl text-ink-95">{t("faqHeading")}</h1>
          <p className="body-md text-ink-60 mt-2 max-w-2xl">{t("faqSubtitle")}</p>
        </div>
      </header>

      <FaqTopicNav
        topics={faqs.map((g) => ({ id: g.id, title: getLocalizedString(g.title, locale) }))}
      />

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-10 sm:py-16">
        <div className="flex flex-col gap-12">
          {faqs.map((group) => (
            <section key={group.id} id={group.id} className="scroll-mt-32">
              <h2 className="headline-md text-ink-95">{getLocalizedString(group.title, locale)}</h2>
              <div className="mt-4">
                <FaqAccordion
                  entries={group.entries.map((entry) => ({
                    ...entry,
                    question: getLocalizedString(entry.question, locale),
                    answer: getLocalizedString(entry.answer, locale),
                  }))}
                />
              </div>
            </section>
          ))}
        </div>
      </section>

      <section className="bg-surface-subtle">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-5 py-12 text-center sm:px-10 sm:py-14">
          <h2 className="headline-md text-ink-95">{t("faqStillNoAnswer")}</h2>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="whatsapp" size="md">
              <a href={whatsAppHref("default")} target="_blank" rel="noopener noreferrer">
                {t("chatOnWhatsapp")}
              </a>
            </Button>
            <Button asChild variant="secondary" size="md">
              <Link href="/contact">{t("allChannels")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: faqs.flatMap((g) =>
              g.entries.map((e) => ({
                "@type": "Question",
                name: getLocalizedString(e.question, locale),
                acceptedAnswer: { "@type": "Answer", text: getLocalizedString(e.answer, locale) },
              })),
            ),
          }),
        }}
      />
    </>
  );
}
