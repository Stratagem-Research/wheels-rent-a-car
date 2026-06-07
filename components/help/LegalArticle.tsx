import { getLocale } from "next-intl/server";
import { LegalArticleLayout } from "./LegalArticleLayout";
import { LEGAL_ARTICLES, type LegalArticle as LegalArticleType } from "@/lib/content/legal";
import { DRAFT_NOTE_T, LEGAL_ARTICLE_T, localizeArticle } from "@/lib/content/content-i18n";

/**
 * Renderer for the privacy / terms / cookies pages.
 *
 * Each page is a thin wrapper that picks its slug; the layout +
 * TocSidebar + body markup live here so all three stay consistent.
 */
export async function LegalArticle({ slug }: { slug: LegalArticleType["slug"] }) {
  const locale = await getLocale();
  const source = LEGAL_ARTICLES[slug];
  if (!source) return null;
  const article = localizeArticle(source, LEGAL_ARTICLE_T, locale);
  const draftNote = article.draftNote
    ? locale === "ar"
      ? DRAFT_NOTE_T.ar
      : locale === "fr"
        ? DRAFT_NOTE_T.fr
        : article.draftNote
    : null;
  return (
    <LegalArticleLayout
      title={article.title}
      lastUpdated={article.lastUpdated}
      toc={article.sections.map((s) => ({ id: s.id, label: s.heading }))}
    >
      {draftNote ? <p className="label-md text-warning">{draftNote}</p> : null}
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
