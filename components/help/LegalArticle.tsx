import { LegalArticleLayout } from "./LegalArticleLayout";
import { LEGAL_ARTICLES, type LegalArticle as LegalArticleType } from "@/lib/content/legal";

/**
 * Renderer for the privacy / terms / cookies pages.
 *
 * Each page is a thin wrapper that picks its slug; the layout +
 * TocSidebar + body markup live here so all three stay consistent.
 */
export function LegalArticle({ slug }: { slug: LegalArticleType["slug"] }) {
  const article = LEGAL_ARTICLES[slug];
  if (!article) return null;
  return (
    <LegalArticleLayout
      title={article.title}
      lastUpdated={article.lastUpdated}
      toc={article.sections.map((s) => ({ id: s.id, label: s.heading }))}
    >
      {article.draftNote ? <p className="label-md text-warning">{article.draftNote}</p> : null}
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
