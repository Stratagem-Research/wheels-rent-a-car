"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { useTrips } from "@/lib/admin/useAdminStore";
import { writeTrips } from "@/lib/admin/store";

/** /admin/trips — trips list view. */
export default function AdminTripsPage() {
  const trips = useTrips();
  const router = useRouter();

  const onDelete = async (slug: string) => {
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    try {
      await writeTrips(trips.filter((t) => t.slug !== slug));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete trip.");
    }
  };

  return (
    <AdminPageShell
      eyebrow="Self-drive blog"
      title="Trips"
      description="Trip articles that appear in Explore Lebanon on the homepage and on /trips."
      actions={
        <>
          <Button onClick={() => router.push("/admin/trips/new")}>
            <Plus className="size-4" aria-hidden="true" />
            New trip
          </Button>
        </>
      }
    >
      <AdminDataTable
        rows={trips}
        rowKey={(t) => t.slug}
        columns={[
          { header: "Slug", cell: (t) => <code className="mono-md">{t.slug}</code>, width: "20%" },
          {
            header: "Title",
            cell: (t) => (
              <Link href={`/admin/trips/${t.slug}`} className="text-ink-100 underline-offset-4 hover:underline">
                {t.title}
              </Link>
            ),
          },
          {
            header: "Region",
            cell: (t) => <span className="capitalize">{t.region}</span>,
            width: "15%",
          },
          {
            header: "Tags",
            cell: (t) => (
              <span className="text-ink-60">{t.tags.length > 0 ? t.tags.join(", ") : "—"}</span>
            ),
            width: "20%",
          },
          {
            header: "Updated",
            cell: (t) => (
              <span className="text-ink-60">{t.updatedAt.slice(0, 10)}</span>
            ),
            width: "12%",
          },
        ]}
        rowActions={(t) => (
          <>
            <Button asChild variant="tertiary" size="sm">
              <Link href={`/admin/trips/${t.slug}`} aria-label={`Edit ${t.title}`}>
                <Pencil className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => onDelete(t.slug)}
              aria-label={`Delete ${t.title}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </>
        )}
        emptyState={
          <>
            <h2 className="headline-md text-ink-100">No trips yet.</h2>
            <p className="body-md text-ink-60">Add one to see it on the homepage.</p>
            <Button onClick={() => router.push("/admin/trips/new")} className="mt-2">
              <Plus className="size-4" aria-hidden="true" />
              New trip
            </Button>
          </>
        }
      />
    </AdminPageShell>
  );
}
