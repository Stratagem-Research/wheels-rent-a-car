"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { updateAdminLeadStatus } from "@/lib/admin/store";
import type { CarWashLead } from "@/lib/supabase/admin-repository";

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
              kind: "car-wash",
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

async function fetchCarWashBookings(): Promise<CarWashLead[]> {
  const res = await fetch("/api/admin/car-wash-bookings", { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Failed to load car wash bookings.");
  }
  const json = (await res.json()) as { leads: CarWashLead[] };
  return json.leads;
}

export default function AdminCarWashBookingsPage() {
  const [leads, setLeads] = React.useState<CarWashLead[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setLeads(await fetchCarWashBookings());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <AdminPageShell
      eyebrow="Data"
      title="Car wash bookings"
      description="Enquiries submitted via the car wash booking form."
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
              { header: "Email", cell: (row) => row.email, width: "20%" },
              { header: "Mobile", cell: (row) => row.mobile, width: "14%" },
              { header: "Package", cell: (row) => row.package_id ?? "—", width: "12%" },
              { header: "Vehicle", cell: (row) => row.vehicle_make_model ?? "—", width: "12%" },
              { header: "Date", cell: (row) => row.preferred_date ?? "—", width: "10%" },
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
