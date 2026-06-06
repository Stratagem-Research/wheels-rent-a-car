"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import type { Branch } from "@/types/domain";

export default function AdminLocationsPage() {
  const [jsonValue, setJsonValue] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/locations", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to load locations.");
      }
      const data = (await res.json()) as { items: Branch[] };
      setJsonValue(JSON.stringify(data.items, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load locations.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const items = JSON.parse(jsonValue) as Branch[];
      const res = await fetch("/api/admin/locations", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ items }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to save locations.");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save locations.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Locations"
      title="Branch locations"
      description="Manage website-owned branch records used by /locations and search."
      actions={
        <>
          <Button variant="tertiary" onClick={() => void refresh()}>
            <RefreshCcw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button onClick={() => void save()} loading={saving} disabled={loading}>
            Save
          </Button>
        </>
      }
    >
      {error ? <p className="body-md text-danger mb-4">{error}</p> : null}
      <section className="bg-paper border-border rounded-xl border p-5">
        <h2 className="headline-sm text-ink-100">Locations JSON</h2>
        <p className="body-sm text-ink-60 mt-2">
          JSON array for <code>locations</code> table. Keep all required branch fields.
        </p>
        <textarea
          className="border-border font-mono mt-4 min-h-[520px] w-full rounded-xl border p-3 text-xs"
          value={jsonValue}
          onChange={(e) => setJsonValue(e.target.value)}
          spellCheck={false}
        />
      </section>
    </AdminPageShell>
  );
}

function csrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return {};
  return { "x-admin-csrf": decodeURIComponent(match[1] ?? "") };
}
