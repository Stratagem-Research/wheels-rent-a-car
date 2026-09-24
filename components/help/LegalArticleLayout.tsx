"use client";

import { useTranslations } from "next-intl";
import { Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TocSidebar, type TocEntry } from "./TocSidebar";
import {
  useContactSettings,
  useTelHref,
  useWhatsAppHref,
} from "@/components/providers/ContactSettingsProvider";
import { Link } from "@/i18n/navigation";

/**
 * Two-column long-form article layout per 10_help_faq.md + 15_legal_*.
 * Sticky TOC on the left (desktop) collapses to a top breadcrumb on mobile.
 */

export interface LegalArticleLayoutProps {
  title: string;
  lastUpdated?: string;
  toc: TocEntry[];
  children: React.ReactNode;
}

export function LegalArticleLayout({ title, lastUpdated, toc, children }: LegalArticleLayoutProps) {
  const whatsAppHref = useWhatsAppHref();
  const telHref = useTelHref();
  const { phone } = useContactSettings();
  const t = useTranslations("helpUi");
  return (
    <>
      <header className="bg-signal-blue-bg">
        <div className="mx-auto max-w-[var(--container-default)] px-5 py-10 sm:px-10 sm:py-14">
          <h1 className="headline-lg text-ink-95">{title}</h1>
          {lastUpdated ? (
            <p className="label-md text-ink-60 mt-2">
              {t("lastUpdated")}: {lastUpdated}
            </p>
          ) : null}
        </div>
      </header>

      <section className="mx-auto max-w-[var(--container-default)] px-5 py-10 sm:px-10 sm:py-14">
        <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
          <TocSidebar entries={toc} className="lg:sticky lg:top-24 lg:self-start" />
          <article
            className={[
              "max-w-[720px]",
              "body-lg text-ink-80 leading-relaxed",
              "[&_h2]:headline-md [&_h2]:text-ink-95 [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24",
              "[&_h3]:headline-sm [&_h3]:text-ink-95 [&_h3]:mt-6 [&_h3]:mb-2",
              "[&_p]:my-3",
              "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5",
              "[&_li]:my-1",
              "[&_a]:text-ink-100 [&_a]:underline-offset-2 hover:[&_a]:underline",
              "[&_strong]:text-ink-95",
            ].join(" ")}
          >
            {children}
          </article>
        </div>
      </section>

      <section className="bg-surface-subtle">
        <div className="mx-auto flex max-w-[var(--container-default)] flex-col items-center gap-3 px-5 py-10 text-center sm:px-10 sm:py-14">
          <h2 className="headline-md text-ink-95">{t("stillNeedHelpQuestion")}</h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="whatsapp" size="md">
              <a href={whatsAppHref("default")} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4" aria-hidden="true" /> {t("whatsappUs")}
              </a>
            </Button>
            <Button asChild variant="secondary" size="md">
              <a href={telHref}>
                <Phone className="size-4" aria-hidden="true" /> {t("call")} {phone}
              </a>
            </Button>
            <Button asChild variant="tertiary" size="md">
              <Link href="/contact">{t("allChannels")} →</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
