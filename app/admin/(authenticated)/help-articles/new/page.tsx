"use client";

import { HelpArticleForm } from "@/components/admin/HelpArticleForm";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

/**
 * /admin/help-articles/new — create a new CMS help article.
 */
export default function NewHelpArticlePage() {
  return (
    <AdminPageShell
      backHref="/admin/help-articles"
      backLabel="All help articles"
      eyebrow="Help centre"
      title="New help article"
      description="Create a new long-form help article. Slug becomes the /help/[slug] URL."
    >
      <HelpArticleForm />
    </AdminPageShell>
  );
}
