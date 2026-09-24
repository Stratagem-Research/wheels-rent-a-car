"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "@/components/ui/Toast";
import { updateAdminLeadStatus } from "@/lib/admin/store";
import type { ChauffeurLead } from "@/lib/supabase/admin-repository";

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
              kind: "chauffeur",
              status: "new",
              adminNotes: notes.trim() || undefined,
            });
            await onSaved();
            toast.success("Saved notes.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save notes.");
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

async function fetchChauffeurRequests(): Promise<ChauffeurLead[]> {
  const res = await fetch("/api/admin/chauffeur-requests", { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Failed to load chauffeur requests.");
  }
  const json = (await res.json()) as { leads: ChauffeurLead[] };
  return json.leads;
}

export default function AdminChauffeurRequestsPage() {
  const [leads, setLeads] = React.useState<ChauffeurLead[]>([]);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      setLeads(await fetchChauffeurRequests());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void fetchChauffeurRequests()
      .then((next) => {
        if (!cancelled) setLeads(next);
      })
      .catch((err) => {
        if (!cancelled) toast.error(err instanceof Error ? err.message : "Failed to load.");
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
      title="Chauffeur requests"
      description="Enquiries submitted via the chauffeur booking form."
      actions={
        <Button variant="tertiary" onClick={() => void refresh()}>
          <RefreshCcw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      }
    >
      {loading ? <p className="body-md text-ink-60">Loading…</p> : null}
      {!loading ? (
        <div className="flex flex-col gap-6">
          <AdminDataTable
            rows={leads}
            rowKey={(row) => row.id}
            columns={[
              { header: "Name", cell: (row) => row.full_name },
              { header: "Email", cell: (row) => row.email, width: "16%" },
              { header: "Mobile", cell: (row) => row.mobile, width: "12%" },
              { header: "Service", cell: (row) => row.service_type ?? "—", width: "10%" },
              { header: "Vehicle", cell: (row) => row.vehicle_class ?? "—", width: "8%" },
              { header: "Passengers", cell: (row) => row.passengers ?? "—", width: "8%" },
              { header: "Pickup", cell: (row) => row.pickup_location ?? "—", width: "14%" },
              { header: "Date", cell: (row) => row.trip_date ?? "—", width: "9%" },
              { header: "Notes", cell: (row) => row.notes ?? "—", width: "10%" },
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
