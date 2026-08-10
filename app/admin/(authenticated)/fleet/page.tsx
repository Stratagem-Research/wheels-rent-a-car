"use client";

import * as React from "react";
import { Plus, RefreshCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";

/**
 * /admin/fleet — structured editor for website-owned vehicle copy/media
 * plus the frontend-to-Wizard ID mapping.
 *
 * Replaces the two raw-JSON textareas with per-vehicle metadata cards and a
 * two-column map repeater. The freeform `media` array stays as a small JSON
 * field (arbitrary shapes), validated on save. Load/save still use
 * GET/PUT /api/admin/fleet/metadata and /api/admin/fleet/map unchanged.
 */

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

/** Editor draft — raw text fields parsed into a MetadataItem on save. */
type MetaDraft = {
  frontend_vehicle_id: string;
  slug: string;
  tagline: string;
  description: string;
  featuresText: string;
  badgesText: string;
  mediaText: string;
  updated_at?: string;
};

async function readJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Failed to load ${path}`);
  }
  return (await res.json()) as T;
}

function toDraft(item: MetadataItem): MetaDraft {
  return {
    frontend_vehicle_id: item.frontend_vehicle_id,
    slug: item.slug,
    tagline: item.tagline ?? "",
    description: item.description ?? "",
    featuresText: (item.features ?? []).join(", "),
    badgesText: (item.badges ?? []).join(", "),
    mediaText: JSON.stringify(item.media ?? [], null, 2),
    updated_at: item.updated_at,
  };
}

function parseMediaText(mediaText: string): Array<Record<string, unknown>> {
  try {
    const parsed = JSON.parse(mediaText.trim() || "[]");
    return Array.isArray(parsed) ? (parsed as Array<Record<string, unknown>>) : [];
  } catch {
    return [];
  }
}

function primaryMediaUrl(mediaText: string): string | undefined {
  const media = parseMediaText(mediaText);
  const first = media[0];
  return typeof first?.url === "string" ? first.url : undefined;
}

function setPrimaryMedia(
  mediaText: string,
  next: { url: string; alt?: string; width?: number; height?: number } | null,
): string {
  const rest = parseMediaText(mediaText).slice(1);
  if (!next) return JSON.stringify(rest, null, 2);
  return JSON.stringify(
    [
      {
        url: next.url,
        alt: next.alt ?? "Vehicle",
        width: next.width ?? 1600,
        height: next.height ?? 900,
      },
      ...rest,
    ],
    null,
    2,
  );
}

export default function AdminFleetPage() {
  const [drafts, setDrafts] = React.useState<MetaDraft[]>([]);
  const [map, setMap] = React.useState<MapItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [metadataRes, mapping] = await Promise.all([
        readJson<{ items: MetadataItem[] }>("/api/admin/fleet/metadata"),
        readJson<{ items: MapItem[] }>("/api/admin/fleet/map"),
      ]);
      const items = Array.isArray(metadataRes.items) ? metadataRes.items : [];
      setDrafts(items.map(toDraft));
      setMap(Array.isArray(mapping.items) ? mapping.items : []);
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

  const updateDraft = (index: number, patch: Partial<MetaDraft>) =>
    setDrafts((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  const addDraft = () =>
    setDrafts((list) => [
      ...list,
      {
        frontend_vehicle_id: "",
        slug: "",
        tagline: "",
        description: "",
        featuresText: "",
        badgesText: "",
        mediaText: "[]",
      },
    ]);

  const removeDraft = (index: number) => {
    if (!confirm("Remove this vehicle's metadata?")) return;
    setDrafts((list) => list.filter((_, i) => i !== index));
  };

  const updateMapRow = (index: number, patch: Partial<MapItem>) =>
    setMap((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    try {
      const metadataItems: MetadataItem[] = drafts.map((draft, i) => {
        let media: Array<Record<string, unknown>>;
        try {
          const parsed = JSON.parse(draft.mediaText.trim() || "[]");
          if (!Array.isArray(parsed)) throw new Error("not array");
          media = parsed as Array<Record<string, unknown>>;
        } catch {
          throw new Error(
            `Media JSON for "${draft.slug || draft.frontend_vehicle_id || `row ${i + 1}`}" is invalid. Expected a JSON array.`,
          );
        }
        return {
          frontend_vehicle_id: draft.frontend_vehicle_id.trim(),
          slug: draft.slug.trim(),
          tagline: draft.tagline.trim() ? draft.tagline.trim() : null,
          description: draft.description.trim() ? draft.description.trim() : null,
          features: splitList(draft.featuresText),
          badges: splitList(draft.badgesText),
          media,
          updated_at: draft.updated_at,
        };
      });

      const [metadataRes, mapRes] = await Promise.all([
        fetch("/api/admin/fleet/metadata", {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...csrfHeader() },
          body: JSON.stringify({ items: metadataItems }),
        }),
        fetch("/api/admin/fleet/map", {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...csrfHeader() },
          body: JSON.stringify({ items: map }),
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

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-4">
          <h2 className="headline-md text-ink-100">Vehicle metadata</h2>
          {drafts.length === 0 && !loading ? (
            <p className="body-md text-ink-60">No vehicle metadata yet.</p>
          ) : null}
          {drafts.map((draft, i) => (
            <AdminFormShell
              key={i}
              title={draft.slug.trim() || draft.frontend_vehicle_id.trim() || "New vehicle"}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Frontend vehicle ID" required>
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.frontend_vehicle_id}
                      onChange={(e) => updateDraft(i, { frontend_vehicle_id: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Slug" required>
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.slug}
                      onChange={(e) => updateDraft(i, { slug: e.target.value })}
                    />
                  )}
                </Field>
              </div>
              <Field label="Tagline">
                {({ id }) => (
                  <Input
                    id={id}
                    value={draft.tagline}
                    onChange={(e) => updateDraft(i, { tagline: e.target.value })}
                  />
                )}
              </Field>
              <Field label="Description">
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={draft.description}
                    onChange={(e) => updateDraft(i, { description: e.target.value })}
                  />
                )}
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Features" helper="Comma-separated.">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.featuresText}
                      placeholder="Bluetooth, Apple CarPlay, Reverse camera"
                      onChange={(e) => updateDraft(i, { featuresText: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Badges" helper="Comma-separated.">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.badgesText}
                      placeholder="Popular, New"
                      onChange={(e) => updateDraft(i, { badgesText: e.target.value })}
                    />
                  )}
                </Field>
              </div>
              <Field
                label="Primary image"
                helper="Upload stores the file in Supabase Storage and sets media[0]. Save all to publish."
              >
                {() => (
                  <AdminImageUpload
                    kind="vehicle"
                    entityId={draft.frontend_vehicle_id || draft.slug || `row-${i + 1}`}
                    currentUrl={primaryMediaUrl(draft.mediaText)}
                    onUploaded={(result) =>
                      updateDraft(i, {
                        mediaText: setPrimaryMedia(draft.mediaText, result),
                      })
                    }
                    onRemoved={() =>
                      updateDraft(i, {
                        mediaText: setPrimaryMedia(draft.mediaText, null),
                      })
                    }
                  />
                )}
              </Field>
              <Field
                label="Media (JSON array)"
                helper="Advanced: freeform media objects. Upload above edits media[0]."
              >
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={4}
                    className="font-mono text-xs"
                    spellCheck={false}
                    value={draft.mediaText}
                    onChange={(e) => updateDraft(i, { mediaText: e.target.value })}
                  />
                )}
              </Field>
              <div className="border-border flex justify-end border-t pt-4">
                <Button type="button" variant="tertiary" onClick={() => removeDraft(i)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </AdminFormShell>
          ))}
          <div>
            <Button variant="secondary" size="sm" onClick={addDraft}>
              <Plus className="size-4" aria-hidden="true" />
              Add vehicle metadata
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="headline-md text-ink-100">Wizard map</h2>
          <p className="body-sm text-ink-60">
            Links each frontend vehicle ID to its Wizard (internal) vehicle ID.
          </p>
          <AdminFormShell title="Frontend → Wizard IDs">
            <div className="flex flex-col gap-2">
              {map.map((row, i) => (
                <div
                  key={i}
                  className="border-border grid items-end gap-2 rounded-lg border p-3 sm:grid-cols-[2fr_1fr_auto]"
                >
                  <Field label="Frontend vehicle ID">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={row.frontend_vehicle_id}
                        onChange={(e) => updateMapRow(i, { frontend_vehicle_id: e.target.value })}
                      />
                    )}
                  </Field>
                  <Field label="Wizard vehicle ID">
                    {({ id }) => (
                      <Input
                        id={id}
                        type="number"
                        min={1}
                        value={row.wizard_vehicle_id ? String(row.wizard_vehicle_id) : ""}
                        onChange={(e) =>
                          updateMapRow(i, { wizard_vehicle_id: Number(e.target.value) })
                        }
                      />
                    )}
                  </Field>
                  <div className="flex items-center pb-1">
                    <Button
                      type="button"
                      variant="tertiary"
                      onClick={() => setMap((list) => list.filter((_, idx) => idx !== i))}
                      aria-label="Remove map row"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
              <div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setMap((list) => [...list, { frontend_vehicle_id: "", wizard_vehicle_id: 0 }])
                  }
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add mapping
                </Button>
              </div>
            </div>
          </AdminFormShell>
        </section>
      </div>
    </AdminPageShell>
  );
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function csrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return {};
  return { "x-admin-csrf": decodeURIComponent(match[1] ?? "") };
}
