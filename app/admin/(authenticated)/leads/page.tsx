"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminDataTable } from "@/components/admin/AdminDataTable";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { toast } from "@/components/ui/Toast";
import { fetchAdminLeads, type AdminLeadsResponse, updateAdminLeadStatus } from "@/lib/admin/store";

type LeadKind = "corporate" | "fleet-partnership";
type LeadStatus = "new" | "in-progress" | "won" | "lost";

function StatusControls({
  id,
  kind,
  status,
  owner,
  adminNotes,
  onSaved,
}: {
  id: string;
  kind: LeadKind;
  status: LeadStatus;
  owner?: string | null;
  adminNotes?: string | null;
  onSaved: () => Promise<void>;
}) {
  const [nextStatus, setNextStatus] = React.useState<LeadStatus>(status);
  const [nextOwner, setNextOwner] = React.useState(owner ?? "");
  const [notes, setNotes] = React.useState(adminNotes ?? "");
  const [saving, setSaving] = React.useState(false);

  return (
    <div className="flex min-w-[220px] flex-col items-end gap-2">
      <select
        className="border-border rounded-pill bg-paper h-9 w-full border px-3 text-sm"
        value={nextStatus}
        onChange={(e) => setNextStatus(e.target.value as LeadStatus)}
      >
        <option value="new">New</option>
        <option value="in-progress">In progress</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
      </select>
      <input
        className="border-border rounded-pill bg-paper h-9 w-full border px-3 text-sm"
        placeholder="Owner"
        value={nextOwner}
        onChange={(e) => setNextOwner(e.target.value)}
      />
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
              kind,
              status: nextStatus,
              owner: nextOwner.trim() || undefined,
              adminNotes: notes.trim() || undefined,
            });
            await onSaved();
            toast.success("Saved lead status.");
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Could not save lead status.");
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

export default function AdminLeadsPage() {
  const [data, setData] = React.useState<AdminLeadsResponse | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const next = await fetchAdminLeads();
      setData(next);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load leads.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <AdminPageShell
      eyebrow="CRM"
      title="Leads inbox"
      description="Corporate and fleet partnership enquiries. Long-term, chauffeur, and car wash have their own pages under Data."
      actions={
        <Button variant="tertiary" onClick={() => void refresh()}>
          <RefreshCcw className="size-4" aria-hidden="true" />
          Refresh
        </Button>
      }
    >
      {loading ? <p className="body-md text-ink-60">Loading leads…</p> : null}
      {data ? (
        <div className="flex flex-col gap-8">
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <li className="bg-paper border-border rounded-xl border p-4">
              <p className="label-md text-ink-60">Total</p>
              <p className="headline-md text-ink-100 mt-1">{data.counters.total}</p>
            </li>
            <li className="bg-paper border-border rounded-xl border p-4">
              <p className="label-md text-ink-60">New</p>
              <p className="headline-md text-ink-100 mt-1">{data.counters.new}</p>
            </li>
            <li className="bg-paper border-border rounded-xl border p-4">
              <p className="label-md text-ink-60">In progress</p>
              <p className="headline-md text-ink-100 mt-1">{data.counters.inProgress}</p>
            </li>
            <li className="bg-paper border-border rounded-xl border p-4">
              <p className="label-md text-ink-60">Won</p>
              <p className="headline-md text-ink-100 mt-1">{data.counters.won}</p>
            </li>
            <li className="bg-paper border-border rounded-xl border p-4">
              <p className="label-md text-ink-60">Lost</p>
              <p className="headline-md text-ink-100 mt-1">{data.counters.lost}</p>
            </li>
          </ul>

          <section className="flex flex-col gap-3">
            <h2 className="headline-sm text-ink-100">Corporate enquiries</h2>
            <AdminDataTable
              rows={data.corporate}
              rowKey={(row) => row.id}
              columns={[
                { header: "Company", cell: (row) => row.company },
                { header: "Contact", cell: (row) => row.full_name },
                { header: "Email", cell: (row) => row.email, width: "24%" },
                { header: "Status", cell: (row) => row.status, width: "10%" },
              ]}
              rowActions={(row) => (
                <StatusControls
                  id={row.id}
                  kind="corporate"
                  status={row.status}
                  owner={row.owner}
                  adminNotes={row.admin_notes}
                  onSaved={refresh}
                />
              )}
            />
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="headline-sm text-ink-100">Fleet partnership enquiries</h2>
            <AdminDataTable
              rows={data.fleetPartnership}
              rowKey={(row) => row.id}
              columns={[
                { header: "Name", cell: (row) => row.full_name },
                { header: "Company", cell: (row) => row.company_name ?? "—", width: "18%" },
                { header: "Email", cell: (row) => row.email, width: "22%" },
                { header: "Vehicles", cell: (row) => row.vehicle_count ?? "—", width: "12%" },
                { header: "Status", cell: (row) => row.status, width: "10%" },
              ]}
              rowActions={(row) => (
                <StatusControls
                  id={row.id}
                  kind="fleet-partnership"
                  status={row.status}
                  owner={row.owner}
                  adminNotes={row.admin_notes}
                  onSaved={refresh}
                />
              )}
            />
          </section>
        </div>
      ) : null}
    </AdminPageShell>
  );
}
