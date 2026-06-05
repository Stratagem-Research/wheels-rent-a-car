"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { useItineraries } from "@/lib/admin/useAdminStore";
import { writeItineraries } from "@/lib/admin/store";
import { formatUsd } from "@/lib/booking/pricing";

/** /admin/itineraries — chauffeur itineraries list view. */
export default function AdminItinerariesPage() {
  const itineraries = useItineraries();
  const router = useRouter();

  const onDelete = async (slug: string) => {
    if (!confirm("Delete this itinerary? This cannot be undone.")) return;
    try {
      await writeItineraries(itineraries.filter((i) => i.slug !== slug));
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not delete itinerary.");
    }
  };

  return (
    <AdminPageShell
      eyebrow="Chauffeur tours"
      title="Itineraries"
      description="Sample itineraries shown on /chauffeur and the dedicated /itineraries listing."
      actions={
        <>
          <Button onClick={() => router.push("/admin/itineraries/new")}>
            <Plus className="size-4" aria-hidden="true" />
            New itinerary
          </Button>
        </>
      }
    >
      <AdminDataTable
        rows={itineraries}
        rowKey={(i) => i.slug}
        columns={[
          { header: "Slug", cell: (i) => <code className="mono-md">{i.slug}</code>, width: "20%" },
          {
            header: "Title",
            cell: (i) => (
              <Link
                href={`/admin/itineraries/${i.slug}`}
                className="text-ink-100 underline-offset-4 hover:underline"
              >
                {i.title}
              </Link>
            ),
          },
          {
            header: "Category",
            cell: (i) => <span className="capitalize">{i.category.replace("-", " ")}</span>,
            width: "14%",
          },
          {
            header: "Duration",
            cell: (i) => <span className="text-ink-60">{i.duration}</span>,
            width: "18%",
          },
          {
            header: "From",
            cell: (i) => (
              <span className="text-ink-90 tabular-nums">{formatUsd(i.priceFromCents)}</span>
            ),
            width: "10%",
          },
        ]}
        rowActions={(i) => (
          <>
            <Button asChild variant="tertiary" size="sm">
              <Link href={`/admin/itineraries/${i.slug}`} aria-label={`Edit ${i.title}`}>
                <Pencil className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button
              variant="tertiary"
              size="sm"
              onClick={() => onDelete(i.slug)}
              aria-label={`Delete ${i.title}`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </>
        )}
        emptyState={
          <>
            <h2 className="headline-md text-ink-100">No itineraries yet.</h2>
            <p className="body-md text-ink-60">Add one to show it on /chauffeur.</p>
            <Button onClick={() => router.push("/admin/itineraries/new")} className="mt-2">
              <Plus className="size-4" aria-hidden="true" />
              New itinerary
            </Button>
          </>
        }
      />
    </AdminPageShell>
  );
}
