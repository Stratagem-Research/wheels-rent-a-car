"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type MetadataItem = {
  frontend_vehicle_id: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  features: string[];
  badges: string[];
  media: Array<Record<string, unknown>>;
  updated_at?: string;
};

type MapItem = {
  frontend_vehicle_id: string;
  wizard_vehicle_id: number;
};

async function readJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Failed to load ${path}`);
  }
  return (await res.json()) as T;
}

export default function AdminFleetPage() {
  const [metadataJson, setMetadataJson] = React.useState("");
  const [mapJson, setMapJson] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metadata, mapping] = await Promise.all([
        readJson<{ items: MetadataItem[] }>("/api/admin/fleet/metadata"),
        readJson<{ items: MapItem[] }>("/api/admin/fleet/map"),
      ]);
      setMetadataJson(JSON.stringify(metadata.items, null, 2));
      setMapJson(JSON.stringify(mapping.items, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load fleet admin data.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const metadataItems = JSON.parse(metadataJson) as MetadataItem[];
      const mapItems = JSON.parse(mapJson) as MapItem[];
      const [metadataRes, mapRes] = await Promise.all([
        fetch("/api/admin/fleet/metadata", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...csrfHeader(),
          },
          body: JSON.stringify({ items: metadataItems }),
        }),
        fetch("/api/admin/fleet/map", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...csrfHeader(),
          },
          body: JSON.stringify({ items: mapItems }),
        }),
      ]);
      if (!metadataRes.ok || !mapRes.ok) {
        const details = !metadataRes.ok
          ? await metadataRes.json().catch(() => ({}))
          : await mapRes.json().catch(() => ({}));
        throw new Error((details as { message?: string }).message ?? "Save failed.");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save fleet data.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageShell
      eyebrow="Fleet"
      title="Vehicle metadata and Wizard mapping"
      description="Manage website-owned vehicle copy/media and frontend-to-Wizard ID mapping."
      actions={
        <>
          <Button variant="tertiary" onClick={() => void refresh()}>
            <RefreshCcw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button onClick={() => void saveAll()} loading={saving} disabled={loading}>
            Save all
          </Button>
        </>
      }
    >
      {error ? <p className="body-md text-danger mb-4">{error}</p> : null}
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="bg-paper border-border rounded-xl border p-5">
          <h2 className="headline-sm text-ink-100">Vehicle metadata</h2>
          <p className="body-sm text-ink-60 mt-2">
            JSON array for <code>vehicle_metadata</code>.
          </p>
          <textarea
            className="border-border font-mono mt-4 min-h-[420px] w-full rounded-xl border p-3 text-xs"
            value={metadataJson}
            onChange={(e) => setMetadataJson(e.target.value)}
            spellCheck={false}
          />
        </section>
        <section className="bg-paper border-border rounded-xl border p-5">
          <h2 className="headline-sm text-ink-100">Wizard map</h2>
          <p className="body-sm text-ink-60 mt-2">
            JSON array for <code>vehicle_wizard_map</code>.
          </p>
          <textarea
            className="border-border font-mono mt-4 min-h-[420px] w-full rounded-xl border p-3 text-xs"
            value={mapJson}
            onChange={(e) => setMapJson(e.target.value)}
            spellCheck={false}
          />
        </section>
      </div>
    </AdminPageShell>
  );
}

function csrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return {};
  return { "x-admin-csrf": decodeURIComponent(match[1] ?? "") };
}
