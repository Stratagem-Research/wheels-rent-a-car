"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { updateAdminLeadStatus } from "@/lib/admin/store";
import type { LongTermLead } from "@/lib/supabase/admin-repository";

function AdminNotesControl({
  id,
  adminNotes,
  onSaved,
}: {
  id: string;
  adminNotes?: string | null;
  onSaved: () => Promise<void>;
}) {
  const [notes, setNotes] = React.useState(adminNotes ?? "");
  const [saving, setSaving] = React.useState(false);

  return (
    <div className="flex min-w-[220px] flex-col items-end gap-2">
      <textarea
        className="border-border bg-paper w-full rounded-xl border px-3 py-2 text-sm"
        rows={2}
        placeholder="Admin notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <Button
        size="sm"
        loading={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await updateAdminLeadStatus({
              id,
              kind: "long-term",
              status: "new",
              adminNotes: notes.trim() || undefined,
            });
            await onSaved();
          } catch (error) {
            alert(error instanceof Error ? error.message : "Could not save notes.");
          } finally {
            setSaving(false);
          }
        }}
      >
        Save
      </Button>
    </div>
  );
}

async function fetchLongTermQuotes(): Promise<LongTermLead[]> {
  const res = await fetch("/api/admin/long-term-quotes", { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Failed to load long-term quotes.");
  }
  const json = (await res.json()) as { leads: LongTermLead[] };
  return json.leads;
}

function formatSubmittedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function AdminLongTermQuotesPage() {
  const [leads, setLeads] = React.useState<LongTermLead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLeads(await fetchLongTermQuotes());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void fetchLongTermQuotes()
      .then((next) => {
        if (!cancelled) {
          setLeads(next);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminPageShell
      eyebrow="Data"
      title="Long-term quotes"
      description="Quote requests submitted via the long-term rental form."
      actions={
        <Button variant="tertiary" onClick={() => void refresh()}>
          <RefreshCcw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      }
    >
      {loading ? <p className="body-md text-ink-60">Loading…</p> : null}
      {error ? <p className="body-md text-danger">{error}</p> : null}
      {!loading && !error ? (
        <div className="flex flex-col gap-6">
          <AdminDataTable
            rows={leads}
            rowKey={(row) => row.id}
            columns={[
              { header: "Name", cell: (row) => row.full_name },
              { header: "Email", cell: (row) => row.email, width: "18%" },
              { header: "Phone", cell: (row) => row.phone ?? "—", width: "12%" },
              {
                header: "Duration",
                cell: (row) => `${row.duration_months} months`,
                width: "10%",
              },
              {
                header: "Vehicle",
                cell: (row) => row.vehicle_category ?? "—",
                width: "10%",
              },
              { header: "Notes", cell: (row) => row.notes ?? "—", width: "14%" },
              {
                header: "Submitted",
                cell: (row) => formatSubmittedAt(row.created_at),
                width: "12%",
              },
            ]}
            rowActions={(row) => (
              <AdminNotesControl
                id={row.id}
                adminNotes={row.admin_notes}
                onSaved={refresh}
              />
            )}
          />
        </div>
      ) : null}
    </AdminPageShell>
  );
}
