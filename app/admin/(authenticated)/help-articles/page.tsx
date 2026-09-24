"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { useConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useHelpArticles } from "@/lib/admin/useAdminStore";
import { deleteHelpArticle } from "@/lib/admin/store";
import { getLocalizedString } from "@/lib/i18n/localized";

/** /admin/help-articles — list view of CMS help articles. */
export default function AdminHelpArticlesPage() {
  const confirmDialog = useConfirmDialog();
  const articles = useHelpArticles();
  const router = useRouter();

  const onDelete = async (slug: string) => {
    const ok = await confirmDialog({
      title: "Delete this help article?",
      description: "The /help/[slug] page will fall back to the code-seed copy.",
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteHelpArticle(slug);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete help article.");
    }
  };

  return (
    <AdminPageShell
      eyebrow="Help centre"
      title="Help articles"
      description="Long-form help articles rendered on /help/[slug]. Rental terms, insurance, payment, cancellation."
      actions={
        <Button onClick={() => router.push("/admin/help-articles/new")}>
          <Plus className="size-4" aria-hidden="true" />
          New article
        </Button>
      }
    >
      <AdminDataTable
        rows={articles}
        rowKey={(a) => a.slug}
        columns={[
          { header: "Slug", cell: (a) => <code className="mono-md">{a.slug}</code>, width: "25%" },
          {
            header: "Title",
            cell: (a) => (
              <Link
                href={`/admin/help-articles/${a.slug}`}
                className="text-ink-100 underline-offset-4 hover:underline"
              >
                {getLocalizedString(a.title, "en")}
              </Link>
            ),
          },
          {
            header: "Sections",
            cell: (a) => <span className="text-ink-60">{a.sections.length}</span>,
            width: "15%",
          },
          {
            header: "Updated",
            cell: (a) => <span className="text-ink-60">{a.lastUpdated}</span>,
            width: "15%",
          },
        ]}
        rowActions={(a) => (
          <>
            <Button asChild variant="tertiary" size="sm">
              <Link
                href={`/admin/help-articles/${a.slug}`}
                aria-label={`Edit ${getLocalizedString(a.title, "en")}`}
              >
                <Pencil className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => onDelete(a.slug)}
              aria-label={`Delete ${getLocalizedString(a.title, "en")}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </>
        )}
        emptyState={
          <>
            <h2 className="headline-md text-ink-100">No help articles yet.</h2>
            <p className="body-md text-ink-60">
              Add one, or run the seed to import the code-seed articles.
            </p>
            <Button onClick={() => router.push("/admin/help-articles/new")} className="mt-2">
              <Plus className="size-4" aria-hidden="true" />
              New article
            </Button>
          </>
        }
      />
    </AdminPageShell>
  );
}
