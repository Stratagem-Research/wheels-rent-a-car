"use client";

import { use } from "react";
import { HelpArticleForm } from "@/components/admin/HelpArticleForm";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { useHelpArticles } from "@/lib/admin/useAdminStore";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * /admin/help-articles/[slug] — edit an existing CMS help article.
 * The form seeds from the matching article in the store.
 */
export default function EditHelpArticlePage({ params }: PageProps) {
  const { slug } = use(params);
  const articles = useHelpArticles();
  const article = articles.find((a) => a.slug === slug);

  return (
    <AdminPageShell
      backHref="/admin/help-articles"
      backLabel="All help articles"
      eyebrow="Help centre"
      title={article ? "Edit help article" : "Help article not found"}
      description="Update this article. Save to push the changes live on /help/[slug]."
    >
      {article ? (
        <HelpArticleForm article={article} />
      ) : (
        <p className="body-md text-ink-60">
          No article with slug “{slug}”. It may have been deleted, or the store is still loading.
        </p>
      )}
    </AdminPageShell>
  );
}
