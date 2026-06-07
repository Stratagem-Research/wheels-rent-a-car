import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { LegalArticleLayout } from "@/components/help/LegalArticleLayout";
import { HELP_ARTICLES } from "@/lib/content/help";
import { HELP_ARTICLE_T, localizeArticle } from "@/lib/content/content-i18n";

/**
 * Long-form help articles (rental terms, insurance, payment, cancellation).
 * Each renders the LegalArticleLayout with a TOC built from the article's
 * sections. The dedicated /help/faq route takes precedence over this
 * dynamic [slug] route for the FAQ accordion.
 */

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return Object.keys(HELP_ARTICLES).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = HELP_ARTICLES[slug];
  if (!article) return {};
  return {
    title: `${article.title} · Wheels Help`,
    description: article.intro,
  };
}

export default async function HelpArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const source = HELP_ARTICLES[slug];
  if (!source) notFound();
  const locale = await getLocale();
  const article = localizeArticle(source, HELP_ARTICLE_T, locale);

  return (
    <LegalArticleLayout
      title={article.title}
      lastUpdated={article.lastUpdated}
      toc={article.sections.map((s) => ({ id: s.id, label: s.heading }))}
    >
      <p>{article.intro}</p>
      {article.sections.map((section) => (
        <section key={section.id}>
          <h2 id={section.id}>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
    </LegalArticleLayout>
  );
}
