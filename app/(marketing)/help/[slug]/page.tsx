import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalArticleLayout } from "@/components/help/LegalArticleLayout";
import { getPublicHelpArticle, getPublicHelpArticleSlugs } from "@/lib/server/public-content";
import { getLocalizedString } from "@/lib/i18n/localized";

/**
 * Long-form help articles (rental terms, insurance, payment, cancellation).
 * Each renders the LegalArticleLayout with a TOC built from the article's
 * sections. The dedicated /help/faq route takes precedence over this
 * dynamic [slug] route for the FAQ accordion.
 *
 * Source of truth is the CMS table (`cms_help_articles`); the localized
 * fixture in `lib/content/help.ts` is the fallback when the CMS row is
 * missing or Supabase is unreachable. Both paths resolve to a single
 * `HelpArticle` shape, so rendering is identical.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const slugs = await getPublicHelpArticleSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublicHelpArticle(slug);
  if (!article) return {};
  const locale = await getLocale();
  return {
    title: `${getLocalizedString(article.title, locale)} · Wheels Help`,
    description: getLocalizedString(article.intro, locale),
  };
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getPublicHelpArticle(slug);
  if (!article) notFound();
  const locale = await getLocale();

  return (
    <LegalArticleLayout
      title={getLocalizedString(article.title, locale)}
      lastUpdated={article.lastUpdated}
      toc={article.sections.map((s) => ({ id: s.id, label: getLocalizedString(s.heading, locale) }))}
    >
      <p>{getLocalizedString(article.intro, locale)}</p>
      {article.sections.map((section) => (
        <section key={section.id}>
          <h2 id={section.id}>{getLocalizedString(section.heading, locale)}</h2>
          <p>{getLocalizedString(section.body, locale)}</p>
        </section>
      ))}
    </LegalArticleLayout>
  );
}
