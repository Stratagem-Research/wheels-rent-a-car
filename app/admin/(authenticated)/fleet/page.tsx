"use client";

import * as React from "react";
import { CloudDownload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { parseWizardVehicleId, slugifyVehicleName } from "@/lib/booking/wizard-vehicle-id";

/**
 * /admin/fleet — website-owned vehicle copy/media for Wizard inventory.
 * Vehicles appear via "Sync from Wizard"; ids are Wizard-owned and not edited here.
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
  /** From Wizard internal vehicles/sync mirror (`wizard_vehicles`). */
  wizard_vehicle_id?: number | null;
  wizard_display_name?: string | null;
  wizard_brand?: string | null;
  wizard_model?: string | null;
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
  wizard_vehicle_id?: number | null;
  wizard_display_name?: string | null;
  wizard_brand?: string | null;
  wizard_model?: string | null;
};

type SyncResult = {
  source: string;
  fetched: number;
  upserted: number;
  websiteEnabled?: number;
  prunedWizard?: number;
  prunedMetadata?: number;
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
    wizard_vehicle_id: item.wizard_vehicle_id ?? null,
    wizard_display_name: item.wizard_display_name ?? null,
    wizard_brand: item.wizard_brand ?? null,
    wizard_model: item.wizard_model ?? null,
  };
}

/** Card headline — brand + Wizard name (or brand + model fallback). */
function vehicleCardTitle(draft: MetaDraft): string {
  const brand = draft.wizard_brand?.trim();
  const name = draft.wizard_display_name?.trim();
  const model = draft.wizard_model?.trim();

  if (brand && name) return `${brand} ${name}`;
  if (name) return name;
  if (brand && model) return `${brand} ${model}`;
  if (brand) return brand;
  if (model) return model;

  const wizardId = resolveWizardId(draft);
  if (wizardId != null) return `Wizard vehicle ${wizardId}`;
  return draft.slug.trim() || "Vehicle";
}

function vehicleCardHelper(draft: MetaDraft): string {
  const wizardId = resolveWizardId(draft);
  const brand = draft.wizard_brand?.trim();
  const model = draft.wizard_model?.trim();
  const bits: string[] = [];

  if (brand) bits.push(`Brand: ${brand}`);
  if (model) bits.push(`Model: ${model}`);
  if (wizardId != null) bits.push(`Wizard ID ${wizardId}`);
  else bits.push("Unknown Wizard ID — re-sync to refresh this vehicle.");

  return bits.join(" · ");
}

function matchesSearch(draft: MetaDraft, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const wizardId = resolveWizardId(draft);
  const haystack = [
    draft.wizard_display_name,
    draft.wizard_brand,
    draft.wizard_model,
    draft.slug,
    draft.tagline,
    draft.frontend_vehicle_id,
    wizardId != null ? String(wizardId) : "",
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function resolveWizardId(draft: MetaDraft): number | null {
  return draft.wizard_vehicle_id ?? parseWizardVehicleId(draft.frontend_vehicle_id);
}

function resolveSlug(draft: MetaDraft): string {
  if (draft.slug.trim()) return draft.slug.trim();
  if (draft.wizard_display_name?.trim()) {
    return slugifyVehicleName(draft.wizard_display_name) || draft.frontend_vehicle_id;
  }
  return draft.frontend_vehicle_id;
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
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [syncMessage, setSyncMessage] = React.useState<string | null>(null);

  const visibleDrafts = React.useMemo(
    () =>
      drafts
        .map((draft, index) => ({ draft, index }))
        .filter(({ draft }) => matchesSearch(draft, search)),
    [drafts, search],
  );

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const metadataRes = await readJson<{ items: MetadataItem[] }>("/api/admin/fleet/metadata");
      const items = Array.isArray(metadataRes.items) ? metadataRes.items : [];
      setDrafts(items.map(toDraft));
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

  const removeDraft = (index: number) => {
    if (!confirm("Remove this vehicle's website metadata?")) return;
    setDrafts((list) => list.filter((_, i) => i !== index));
  };

  const syncFromWizard = async () => {
    setSyncing(true);
    setError(null);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/admin/fleet/sync", {
        method: "POST",
        headers: { ...csrfHeader() },
      });
      const body = (await res.json().catch(() => ({}))) as SyncResult & { message?: string };
      if (!res.ok) {
        throw new Error(body.message ?? "Wizard vehicle sync failed.");
      }
      const prunedBits = [
        body.prunedWizard ? `${body.prunedWizard} old mirror rows` : null,
        body.prunedMetadata ? `${body.prunedMetadata} orphan metadata` : null,
      ]
        .filter(Boolean)
        .join(", ");
      setSyncMessage(
        `Synced from Wizard: fetched ${body.fetched ?? 0}, mirror updated ${body.upserted ?? 0}, website-enabled ${body.websiteEnabled ?? body.upserted ?? 0}.${prunedBits ? ` Removed ${prunedBits}.` : ""}`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync from Wizard.");
    } finally {
      setSyncing(false);
    }
  };

  const saveAll = async () => {
    setSaving(true);
    setError(null);
    setSyncMessage(null);
    try {
      const metadataItems: MetadataItem[] = drafts.map((draft, i) => {
        let media: Array<Record<string, unknown>>;
        try {
          const parsed = JSON.parse(draft.mediaText.trim() || "[]");
          if (!Array.isArray(parsed)) throw new Error("not array");
          media = parsed as Array<Record<string, unknown>>;
        } catch {
          throw new Error(
            `Media JSON for "${vehicleCardTitle(draft)}" is invalid. Expected a JSON array.`,
          );
        }
        return {
          frontend_vehicle_id: draft.frontend_vehicle_id.trim(),
          slug: resolveSlug(draft),
          tagline: draft.tagline.trim() ? draft.tagline.trim() : null,
          description: draft.description.trim() ? draft.description.trim() : null,
          features: splitList(draft.featuresText),
          badges: splitList(draft.badgesText),
          media,
          updated_at: draft.updated_at,
        };
      });

      const metadataRes = await fetch("/api/admin/fleet/metadata", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ items: metadataItems }),
      });
      if (!metadataRes.ok) {
        const details = await metadataRes.json().catch(() => ({}));
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
      title="Vehicle metadata"
      description="Sync fleet from Wizard, then edit website copy, badges, and photos. Wizard vehicle IDs are read-only."
      actions={
        <>
          <Button
            variant="secondary"
            onClick={() => void syncFromWizard()}
            loading={syncing}
            disabled={loading || saving}
          >
            <CloudDownload className="size-4" aria-hidden="true" />
            Sync from Wizard
          </Button>
          <Button onClick={() => void saveAll()} loading={saving} disabled={loading || syncing}>
            Save all
          </Button>
        </>
      }
    >
      {error ? <p className="body-md text-danger mb-4">{error}</p> : null}
      {syncMessage ? <p className="body-md text-ink-80 mb-4">{syncMessage}</p> : null}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="headline-md text-ink-100">Vehicle metadata</h2>
            <p className="body-sm text-ink-60 mt-1">
              {loading
                ? "Loading…"
                : search.trim()
                  ? `Showing ${visibleDrafts.length} of ${drafts.length} website-enabled Wizard vehicles`
                  : `${drafts.length} website-enabled Wizard vehicles`}
            </p>
          </div>
          <div className="w-full sm:max-w-sm">
            <Field label="Search">
              {({ id }) => (
                <Input
                  id={id}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or Wizard ID"
                  autoComplete="off"
                />
              )}
            </Field>
          </div>
        </div>
        {drafts.length === 0 && !loading ? (
          <p className="body-md text-ink-60">
            No website-enabled vehicles in the Wizard mirror yet. Use{" "}
            <strong>Sync from Wizard</strong> (requires internal API token).
          </p>
        ) : null}
        {drafts.length > 0 && visibleDrafts.length === 0 && !loading ? (
          <p className="body-md text-ink-60">No vehicles match “{search.trim()}”.</p>
        ) : null}
        {visibleDrafts.map(({ draft, index: i }) => {
          const wizardId = resolveWizardId(draft);
          return (
            <AdminFormShell
              key={draft.frontend_vehicle_id || i}
              title={vehicleCardTitle(draft)}
              helper={vehicleCardHelper(draft)}
            >
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
              <Field label="Primary image">
                {() => (
                  <AdminImageUpload
                    kind="vehicle"
                    entityId={
                      wizardId != null
                        ? String(wizardId)
                        : draft.frontend_vehicle_id || draft.slug || `row-${i + 1}`
                    }
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
              <Field label="Media (JSON array)">
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
          );
        })}
      </section>
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
