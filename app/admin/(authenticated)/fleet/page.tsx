"use client";

import * as React from "react";
import { CloudDownload, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toast";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { VehicleMediaFields } from "@/components/admin/VehicleMediaFields";
import {
  ManualVehicleCreateForm,
  type ManualCreateValues,
} from "@/components/admin/ManualVehicleCreateForm";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";
import {
  displayManualUnitId,
  normalizeManualUnitId,
  parseWizardVehicleId,
  slugifyVehicleName,
} from "@/lib/booking/wizard-vehicle-id";
import { paginate } from "@/lib/vehicles/filter";
import { composeVehicleTitle } from "@/lib/vehicles/display-name";
import { modelGroupKey } from "@/lib/vehicles/group-by-model";
import { preserveWebsiteBrandModel } from "@/lib/vehicles/preserve-fleet-names";
import {
  parseVehicleMedia,
  sortVehicleMedia,
  type VehicleMediaItem,
} from "@/lib/vehicles/vehicle-media";
import {
  normalizeOperational,
  parseOperational,
  type VehicleOperational,
} from "@/lib/vehicles/vehicle-operational";
import { VehicleOperationalFields } from "@/components/admin/VehicleOperationalFields";

/**
 * /admin/fleet — website-owned vehicle copy/media.
 * Wizard sync fetches inventory; manual cars can be created here.
 * Brand, model, and images are website-owned and survive later syncs.
 */

type MetadataItem = {
  frontend_vehicle_id: string;
  slug: string;
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  tagline: string | null;
  description: string | null;
  features: string[];
  badges: string[];
  media: Array<Record<string, unknown>>;
  operational?: Record<string, unknown>;
  updated_at?: string;
  wizard_vehicle_id?: number | null;
  wizard_display_name?: string | null;
  wizard_brand?: string | null;
  wizard_model?: string | null;
  source?: "wizard" | "website";
};

type MetaDraft = {
  frontend_vehicle_id: string;
  slug: string;
  brand: string;
  model: string;
  tagline: string;
  description: string;
  featuresText: string;
  badgesText: string;
  media: VehicleMediaItem[];
  operational: VehicleOperational;
  updated_at?: string;
  wizard_vehicle_id?: number | null;
  wizard_display_name?: string | null;
  wizard_brand?: string | null;
  wizard_model?: string | null;
  source?: "wizard" | "website";
};

type SyncResult = {
  source: string;
  fetched: number;
  upserted: number;
  websiteEnabled?: number;
};

const PAGE_SIZE = 10;

type SourceFilter = "all" | "wizard" | "manual";

async function readJson<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Failed to load ${path}`);
  }
  return (await res.json()) as T;
}

function toDraft(item: MetadataItem): MetaDraft {
  const brand = item.brand?.trim() || item.wizard_brand?.trim() || "";
  const model = item.model?.trim() || item.wizard_model?.trim() || "";
  const operational = parseOperational(item.operational);
  return {
    frontend_vehicle_id: item.frontend_vehicle_id,
    slug: item.slug,
    brand,
    model,
    tagline: item.tagline ?? "",
    description: item.description ?? "",
    featuresText: (item.features ?? []).join(", "),
    badgesText: (item.badges ?? []).join(", "),
    media: parseVehicleMedia(item.media ?? []),
    operational,
    updated_at: item.updated_at,
    wizard_vehicle_id: item.wizard_vehicle_id ?? null,
    wizard_display_name: item.wizard_display_name ?? operational.display_name ?? null,
    wizard_brand: item.wizard_brand ?? null,
    wizard_model: item.wizard_model ?? null,
    source: item.source,
  };
}

function vehicleCardTitle(draft: MetaDraft): string {
  const composed = composeVehicleTitle(draft.brand, draft.model);
  if (composed) return composed;

  const wizardId = resolveWizardId(draft);
  if (wizardId != null) return `Wizard vehicle ${wizardId}`;
  return draft.slug.trim() || "Vehicle";
}

function isWebsiteOnlyDraft(draft: MetaDraft): boolean {
  return draft.source === "website" || resolveWizardId(draft) == null;
}

function groupKeyForDraft(draft: MetaDraft): string {
  const model = modelGroupKey(draft.brand, draft.model, draft.frontend_vehicle_id);
  return `${isWebsiteOnlyDraft(draft) ? "site" : "wiz"}:${model}`;
}

type IndexedDraft = { draft: MetaDraft; index: number };

function groupIsManual(group: IndexedDraft[]): boolean {
  return group.every(({ draft }) => isWebsiteOnlyDraft(draft));
}

function groupDraftsByModel(items: IndexedDraft[]): IndexedDraft[][] {
  const groups: IndexedDraft[][] = [];
  const indexByKey = new Map<string, number>();
  for (const item of items) {
    const key = groupKeyForDraft(item.draft);
    const existing = indexByKey.get(key);
    if (existing == null) {
      indexByKey.set(key, groups.length);
      groups.push([item]);
    } else {
      groups[existing]!.push(item);
    }
  }
  return groups;
}

function groupHelper(members: MetaDraft[]): string {
  const first = members[0];
  if (!first) return "";
  if (members.every((m) => resolveWizardId(m) == null)) return "Created in admin";
  if (members.some((m) => resolveWizardId(m) == null)) {
    return "Some units have no Wizard ID — re-sync to refresh.";
  }
  return "";
}

function unitWizardLabel(draft: MetaDraft, booked: boolean): string {
  const wizardId = resolveWizardId(draft);
  if (wizardId != null) {
    const name = draft.wizard_display_name?.trim();
    const base = name ? `${wizardId} — ${name}` : `Wizard ${wizardId}`;
    return booked ? `${base} · booked` : base;
  }
  const base = displayManualUnitId(draft.frontend_vehicle_id);
  return booked ? `${base} · booked` : base;
}

function matchesSearch(draft: MetaDraft, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const wizardId = resolveWizardId(draft);
  const haystack = [
    draft.brand,
    draft.model,
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
  const composed = composeVehicleTitle(draft.brand, draft.model);
  if (composed) return slugifyVehicleName(composed) || draft.frontend_vehicle_id;
  if (draft.wizard_display_name?.trim()) {
    return slugifyVehicleName(draft.wizard_display_name) || draft.frontend_vehicle_id;
  }
  return draft.frontend_vehicle_id;
}

function toMetadataItem(draft: MetaDraft) {
  const brand = draft.brand.trim();
  const model = draft.model.trim();
  const title = composeVehicleTitle(brand, model);
  if (!title) {
    throw new Error(`Brand and model are required for "${vehicleCardTitle(draft)}".`);
  }
  return {
    frontend_vehicle_id: draft.frontend_vehicle_id.trim(),
    slug: resolveSlug(draft),
    title,
    brand,
    model,
    tagline: draft.tagline.trim() ? draft.tagline.trim() : null,
    description: draft.description.trim() ? draft.description.trim() : null,
    features: splitList(draft.featuresText),
    badges: splitList(draft.badgesText),
    media: sortVehicleMedia(draft.media.filter((item) => item.url.trim())),
    operational: normalizeOperational(
      {
        ...draft.operational,
        display_name: draft.operational.display_name || draft.wizard_display_name,
        name: draft.operational.name || draft.wizard_display_name,
      },
      title,
    ),
    updated_at: draft.updated_at,
  };
}

function copySharedGroupFields(source: MetaDraft, target: MetaDraft): MetaDraft {
  return {
    ...target,
    brand: source.brand,
    model: source.model,
    tagline: source.tagline,
    description: source.description,
    featuresText: source.featuresText,
    badgesText: source.badgesText,
    media: source.media,
    operational: {
      ...source.operational,
      display_name: target.operational.display_name,
      name: target.operational.name ?? target.operational.display_name,
    },
    wizard_display_name: target.wizard_display_name,
  };
}

function extraDetailsCount(draft: MetaDraft): number {
  return [draft.tagline, draft.description, draft.featuresText, draft.badgesText].filter((value) =>
    value.trim(),
  ).length;
}

function operationalSummary(op: VehicleOperational): string {
  const bits = [
    op.year != null ? String(op.year) : null,
    op.color,
    op.daily_rate != null ? `${op.daily_rate} ${op.currency ?? ""}`.trim() : null,
    op.status,
  ].filter(Boolean);
  return bits.length ? `Vehicle specs (${bits.join(" · ")})` : "Vehicle specs";
}

function hasManualCoreSpecs(op: VehicleOperational): boolean {
  return Boolean(op.year && op.year > 1900 && op.daily_rate != null && op.daily_rate > 0);
}

function isManualCardReady(draft: MetaDraft): boolean {
  return Boolean(draft.brand.trim() && draft.model.trim() && hasManualCoreSpecs(draft.operational));
}

function draftFromCreate(values: ManualCreateValues, frontendVehicleId: string): MetaDraft {
  const title = composeVehicleTitle(values.brand, values.model) || `${values.brand} ${values.model}`;
  return {
    frontend_vehicle_id: frontendVehicleId,
    slug: "",
    brand: values.brand,
    model: values.model,
    tagline: "",
    description: "",
    featuresText: "",
    badgesText: "",
    media: values.media,
    operational: normalizeOperational({ ...values.operational }, title),
    wizard_vehicle_id: null,
    wizard_display_name: null,
    wizard_brand: values.brand,
    wizard_model: values.model,
    source: "website",
  };
}

function addManualUnit(source: MetaDraft, frontendVehicleId: string): MetaDraft {
  return {
    ...source,
    frontend_vehicle_id: frontendVehicleId,
    slug: source.slug,
    wizard_vehicle_id: null,
    wizard_display_name: null,
    updated_at: undefined,
    source: "website",
  };
}

export default function AdminFleetPage() {
  const [drafts, setDrafts] = React.useState<MetaDraft[]>([]);
  const [deletedIds, setDeletedIds] = React.useState<string[]>([]);
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [loading, setLoading] = React.useState(true);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [syncing, setSyncing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [selectedUnitIds, setSelectedUnitIds] = React.useState<Record<string, string>>({});
  const [heldIds, setHeldIds] = React.useState<Set<string>>(() => new Set());
  const [sourceFilter, setSourceFilter] = React.useState<SourceFilter>("all");
  const [addUnitIds, setAddUnitIds] = React.useState<Record<string, string>>({});
  const [addUnitErrors, setAddUnitErrors] = React.useState<Record<string, string>>({});

  const allGroups = React.useMemo(
    () => groupDraftsByModel(drafts.map((draft, index) => ({ draft, index }))),
    [drafts],
  );
  const visibleGroups = React.useMemo(
    () =>
      allGroups.filter((group) => {
        if (sourceFilter === "manual" && !groupIsManual(group)) return false;
        if (sourceFilter === "wizard" && groupIsManual(group)) return false;
        return group.some(({ draft }) => matchesSearch(draft, search));
      }),
    [allGroups, search, sourceFilter],
  );
  const pageCount = Math.max(1, Math.ceil(visibleGroups.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedGroups = paginate(visibleGroups, currentPage, PAGE_SIZE);

  const refresh = React.useCallback(async (opts?: { keepLocalNames?: boolean }) => {
    setLoading(true);
    setError(null);
    try {
      const metadataRes = await readJson<{ items: MetadataItem[]; held_ids?: string[] }>(
        "/api/admin/fleet/metadata",
      );
      const items = Array.isArray(metadataRes.items) ? metadataRes.items : [];
      const incoming = items.map(toDraft);
      setDrafts((prev) => (opts?.keepLocalNames ? preserveWebsiteBrandModel(prev, incoming) : incoming));
      setHeldIds(new Set(Array.isArray(metadataRes.held_ids) ? metadataRes.held_ids : []));
      setDeletedIds([]);
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

  const updateGroup = (indices: number[], patch: Partial<MetaDraft>) => {
    const ids = new Set(indices);
    setDrafts((list) => list.map((m, i) => (ids.has(i) ? { ...m, ...patch } : m)));
  };

  const updateAt = (index: number, patch: Partial<MetaDraft>) => {
    setDrafts((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const patchGroupOperational = (indices: number[], patch: Partial<VehicleOperational>) => {
    const ids = new Set(indices);
    setDrafts((list) =>
      list.map((m, i) => (ids.has(i) ? { ...m, operational: { ...m.operational, ...patch } } : m)),
    );
  };

  const addCar = () => {
    setCreating(true);
    setSearch("");
    setPage(1);
  };

  const createCars = (values: ManualCreateValues) => {
    const added = values.unitIds.map((id) => draftFromCreate(values, id));
    setDrafts((list) => [...added, ...list]);
    setCreating(false);
    setSearch("");
    setPage(1);
  };

  const addUnitToGroup = (source: MetaDraft, groupSaveKey: string) => {
    const raw = (addUnitIds[groupSaveKey] ?? "").trim();
    const storedId = normalizeManualUnitId(raw);
    if (!storedId) {
      const message = /^\d+$/.test(raw.replace(/^manual-/i, ""))
        ? `"${raw}" is just a number, which is reserved for synced Wizard vehicle ids. Add a letter, e.g. "${raw}A" or "UNIT-${raw}".`
        : "Enter a unit id using letters, numbers, dots, dashes, or underscores.";
      setAddUnitErrors((prev) => ({ ...prev, [groupSaveKey]: message }));
      toast.error(message);
      return;
    }
    if (drafts.some((draft) => draft.frontend_vehicle_id === storedId) || deletedIds.includes(storedId)) {
      const message = `Unit id "${displayManualUnitId(storedId)}" is already in the fleet — pick a different one.`;
      setAddUnitErrors((prev) => ({ ...prev, [groupSaveKey]: message }));
      toast.error(message);
      return;
    }
    setDrafts((list) => [...list, addManualUnit(source, storedId)]);
    setAddUnitIds((prev) => ({ ...prev, [groupSaveKey]: "" }));
    setAddUnitErrors((prev) => ({ ...prev, [groupSaveKey]: "" }));
    setSelectedUnitIds((prev) => ({ ...prev, [groupSaveKey]: storedId }));
    toast.success(`Added unit "${displayManualUnitId(storedId)}".`);
  };

  const removeUnitFromGroup = async (unitId: string) => {
    if (!confirm(`Remove unit "${displayManualUnitId(unitId)}" from the fleet?`)) return;
    setDeletedIds((prev) => [...prev, unitId]);
    setDrafts((list) => list.filter((draft) => draft.frontend_vehicle_id !== unitId));
    setError(null);
    try {
      await putMetadata([], [unitId]);
      setDeletedIds((prev) => prev.filter((id) => id !== unitId));
      toast.success(`Removed unit "${displayManualUnitId(unitId)}".`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to remove unit.";
      setError(message);
      toast.error(message);
    }
  };

  const removeGroup = async (indices: number[]) => {
    const first = drafts[indices[0]!];
    const n = indices.length;
    const label = first ? vehicleCardTitle(first) : "this model";
    const unitLabel = n === 1 ? "unit" : "units";
    if (!confirm(`Remove website metadata for ${n} ${label} ${unitLabel}?`)) return;
    const drop = new Set(indices);
    const removedIds = indices
      .map((i) => drafts[i]?.frontend_vehicle_id)
      .filter((id): id is string => Boolean(id));
    setDeletedIds((prev) => [...prev, ...removedIds]);
    setDrafts((list) => list.filter((_, i) => !drop.has(i)));
    setError(null);
    try {
      await putMetadata([], removedIds);
      setDeletedIds((prev) => prev.filter((id) => !removedIds.includes(id)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove vehicle.");
    }
  };

  const syncFromWizard = async () => {
    setSyncing(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/fleet/sync", {
        method: "POST",
        headers: { ...getAdminCsrfHeader() },
      });
      const body = (await res.json().catch(() => ({}))) as SyncResult & { message?: string };
      if (!res.ok) {
        throw new Error(body.message ?? "Wizard vehicle sync failed.");
      }
      toast.success(
        `Synced from Wizard: fetched ${body.fetched ?? 0}, mirror updated ${body.upserted ?? 0}, website-enabled ${body.websiteEnabled ?? body.upserted ?? 0}. Existing cars were kept.`,
      );
      await refresh({ keepLocalNames: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync from Wizard.");
    } finally {
      setSyncing(false);
    }
  };

  const putMetadata = async (
    items: ReturnType<typeof toMetadataItem>[],
    idsToDelete: string[],
  ) => {
    const metadataRes = await fetch("/api/admin/fleet/metadata", {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
      body: JSON.stringify({ items, deleted_ids: idsToDelete }),
    });
    if (!metadataRes.ok) {
      const details = await metadataRes.json().catch(() => ({}));
      throw new Error((details as { message?: string }).message ?? "Save failed.");
    }
  };

  const saveGroup = async (indices: number[]) => {
    const source = drafts[indices[0]!];
    if (!source) return;
    if (isWebsiteOnlyDraft(source) && !isManualCardReady(source)) {
      setError("Fill brand, model, year, and daily rate before saving.");
      return;
    }
    const key = groupKeyForDraft(source);
    setSavingKey(key);
    setError(null);
    try {
      const members = indices
        .map((index) => drafts[index])
        .filter((draft): draft is MetaDraft => Boolean(draft))
        .map((draft, i) => (i === 0 ? draft : copySharedGroupFields(source, draft)));
      await putMetadata(members.map(toMetadataItem), deletedIds);
      setDeletedIds([]);
      toast.success(`Saved ${vehicleCardTitle(source)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save vehicle.");
    } finally {
      setSavingKey(null);
    }
  };

  const busy = loading || savingKey != null || syncing;

  return (
    <AdminPageShell
      eyebrow="Fleet"
      title="Vehicle metadata"
      description="Sync fleet from Wizard or add a car here."
      actions={
        <>
          <Button
            variant="secondary"
            onClick={creating ? () => setCreating(false) : addCar}
            disabled={busy}
          >
            <Plus className="size-4" aria-hidden="true" />
            {creating ? "Cancel add" : "Add car"}
          </Button>
          <Button
            variant="secondary"
            onClick={() => void syncFromWizard()}
            loading={syncing}
            disabled={loading || savingKey != null}
          >
            <CloudDownload className="size-4" aria-hidden="true" />
            Sync from Wizard
          </Button>
        </>
      }
    >
      {error ? <p className="body-md text-danger mb-4">{error}</p> : null}

      {creating ? (
        <div className="mb-6">
          <ManualVehicleCreateForm
            onCancel={() => setCreating(false)}
            onCreate={createCars}
            takenIds={drafts.map((draft) => draft.frontend_vehicle_id)}
          />
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="body-sm text-ink-60 mt-1">
              {loading
                ? "Loading…"
                : visibleGroups.length === 0
                  ? search.trim()
                    ? `0 of ${allGroups.length} models`
                    : "0 models"
                  : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, visibleGroups.length)} of ${visibleGroups.length} models`}
            </p>
          </div>
          <div className="flex w-full min-w-0 flex-wrap items-end gap-3 sm:w-auto">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Source">
              {(
                [
                  ["all", "All"],
                  ["wizard", "Wizard"],
                  ["manual", "Manual"],
                ] as const
              ).map(([id, label]) => (
                <Chip
                  key={id}
                  variant={sourceFilter === id ? "selected" : "default"}
                  onClick={() => {
                    setSourceFilter(id);
                    setPage(1);
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <Field label="" className="min-w-0 w-full sm:w-72">
              {({ id }) => (
                <Input
                  id={id}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Name, model, or Wizard ID"
                  autoComplete="off"
                />
              )}
            </Field>
          </div>
        </div>
        {drafts.length === 0 && !loading ? (
          <p className="body-md text-ink-60">
            No vehicles yet. Use <strong>Add car</strong> or <strong>Sync from Wizard</strong>.
          </p>
        ) : null}
        {drafts.length > 0 && visibleGroups.length === 0 && !loading ? (
          <p className="body-md text-ink-60">
            {search.trim()
              ? `No models match “${search.trim()}”.`
              : sourceFilter === "wizard"
                ? "No Wizard models in this list."
                : sourceFilter === "manual"
                  ? "No manual models in this list."
                  : "No models match this filter."}
          </p>
        ) : null}
        {pagedGroups.map((group) => {
          const representative = group[0]!;
          const draft = representative.draft;
          const indices = group.map((item) => item.index);
          const wizardId = resolveWizardId(draft);
          const unitCount = group.length;
          const bookedCount = group.filter(({ draft: unit }) =>
            heldIds.has(unit.frontend_vehicle_id),
          ).length;
          const entityId =
            wizardId != null
              ? String(wizardId)
              : draft.frontend_vehicle_id || draft.slug || `row-${representative.index + 1}`;
          const extraFilled = extraDetailsCount(draft);
          const groupSaveKey = groupKeyForDraft(draft);
          const isWebsiteGroup = group.every(({ draft: unit }) => isWebsiteOnlyDraft(unit));
          const selectedUnitId =
            selectedUnitIds[groupSaveKey] ?? group[0]?.draft.frontend_vehicle_id;
          const selectedMember =
            group.find(({ draft: unit }) => unit.frontend_vehicle_id === selectedUnitId) ??
            representative;
          return (
            <AdminFormShell
              key={draft.frontend_vehicle_id || groupKeyForDraft(draft)}
              title={vehicleCardTitle(draft) || "New car"}
              titleBadge={
                <span className="flex flex-wrap items-center gap-2">
                  <span className="label-sm bg-info-bg text-info rounded-pill px-3 py-1 font-semibold tracking-[0.08em] uppercase">
                    {unitCount} {unitCount === 1 ? "unit" : "units"}
                  </span>
                  {bookedCount > 0 ? (
                    <span className="label-sm bg-warning-bg text-warning rounded-pill px-3 py-1 font-semibold tracking-[0.08em] uppercase">
                      {bookedCount} booked
                    </span>
                  ) : null}
                </span>
              }
              helper={groupHelper(group.map((item) => item.draft)) || undefined}
            >
              <Field label={isWebsiteGroup ? "Units" : "Wizard units"}>
                {({ id }) => (
                  <Select
                    id={id}
                    size="sm"
                    value={selectedMember.draft.frontend_vehicle_id}
                    onChange={(e) =>
                      setSelectedUnitIds((prev) => ({ ...prev, [groupSaveKey]: e.target.value }))
                    }
                  >
                    {group.map(({ draft: unit }) => (
                      <option key={unit.frontend_vehicle_id} value={unit.frontend_vehicle_id}>
                        {unitWizardLabel(unit, heldIds.has(unit.frontend_vehicle_id))}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              {isWebsiteGroup ? (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <Field label="Add unit id" className="min-w-0 flex-1">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={addUnitIds[groupSaveKey] ?? ""}
                          placeholder="e.g. MICRA-2 (not a plain number)"
                          aria-invalid={Boolean(addUnitErrors[groupSaveKey])}
                          onChange={(e) => {
                            setAddUnitIds((prev) => ({ ...prev, [groupSaveKey]: e.target.value }));
                            setAddUnitErrors((prev) => ({ ...prev, [groupSaveKey]: "" }));
                          }}
                        />
                      )}
                    </Field>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={busy || !(addUnitIds[groupSaveKey] ?? "").trim()}
                      onClick={() => addUnitToGroup(draft, groupSaveKey)}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                      Add unit
                    </Button>
                  </div>
                  {addUnitErrors[groupSaveKey] ? (
                    <p className="body-sm text-danger">{addUnitErrors[groupSaveKey]}</p>
                  ) : (
                    <p className="body-sm text-ink-60">
                      Plain numbers are reserved for synced Wizard vehicles — include a letter (e.g.
                      “MICRA-2”).
                    </p>
                  )}
                  <ul className="flex flex-wrap gap-2">
                    {group.map(({ draft: unit }) => {
                      const isHeld = heldIds.has(unit.frontend_vehicle_id);
                      return (
                        <li
                          key={unit.frontend_vehicle_id}
                          className="border-border bg-paper flex items-center gap-2 rounded-pill border py-1 pr-1 pl-3"
                        >
                          <span className="label-sm">
                            {displayManualUnitId(unit.frontend_vehicle_id)}
                            {isHeld ? " · booked" : ""}
                          </span>
                          <button
                            type="button"
                            className="text-ink-60 hover:text-danger disabled:hover:text-ink-60 rounded-full p-1 disabled:cursor-not-allowed disabled:opacity-40"
                            disabled={busy || isHeld}
                            title={
                              isHeld
                                ? "This unit is currently on a booking — cancel or wait for the trip to end first."
                                : `Remove ${displayManualUnitId(unit.frontend_vehicle_id)}`
                            }
                            onClick={() => void removeUnitFromGroup(unit.frontend_vehicle_id)}
                          >
                            <Trash2 className="size-3.5" aria-hidden="true" />
                            <span className="sr-only">
                              Remove {displayManualUnitId(unit.frontend_vehicle_id)}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Brand">
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.brand}
                      placeholder="Toyota"
                      onChange={(e) => updateGroup(indices, { brand: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Model" >
                  {({ id }) => (
                    <Input
                      id={id}
                      value={draft.model}
                      placeholder="Yaris"
                      onChange={(e) => updateGroup(indices, { model: e.target.value })}
                    />
                  )}
                </Field>
              </div>
              {isWebsiteGroup ? (
                <Accordion type="single" collapsible className="border-border rounded-lg border px-4">
                  <AccordionItem value="specs" className="border-0">
                    <AccordionTrigger className="py-3">{operationalSummary(draft.operational)}</AccordionTrigger>
                    <AccordionContent>
                      <VehicleOperationalFields
                        value={draft.operational}
                        showDisplayName={false}
                        requireCoreSpecs
                        onChange={(patch) => patchGroupOperational(indices, patch)}
                      />
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              ) : null}
              <Accordion type="single" collapsible className="border-border rounded-lg border px-4">
                <AccordionItem value="details" className="border-0">
                  <AccordionTrigger className="py-3">
                    {extraFilled > 0
                      ? `Tagline, description, features, badges (${extraFilled} filled)`
                      : "Tagline, description, features, badges"}
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="flex flex-col gap-4">
                      <Field label="Tagline">
                        {({ id }) => (
                          <Input
                            id={id}
                            value={draft.tagline}
                            onChange={(e) => updateGroup(indices, { tagline: e.target.value })}
                          />
                        )}
                      </Field>
                      <Field label="Description">
                        {({ id }) => (
                          <Textarea
                            id={id}
                            rows={3}
                            value={draft.description}
                            onChange={(e) => updateGroup(indices, { description: e.target.value })}
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
                              onChange={(e) => updateGroup(indices, { featuresText: e.target.value })}
                            />
                          )}
                        </Field>
                        <Field label="Badges" helper="Comma-separated.">
                          {({ id }) => (
                            <Input
                              id={id}
                              value={draft.badgesText}
                              placeholder="Popular, New"
                              onChange={(e) => updateGroup(indices, { badgesText: e.target.value })}
                            />
                          )}
                        </Field>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
              <VehicleMediaFields
                entityId={entityId}
                media={draft.media}
                onChange={(media) => updateGroup(indices, { media })}
              />
              <div className="border-border flex flex-col items-end gap-2 border-t pt-4">
                {isWebsiteGroup && !isManualCardReady(draft) ? (
                  <p className="body-sm text-ink-60">Fill brand, model, year, and daily rate to save.</p>
                ) : null}
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="tertiary" onClick={() => void removeGroup(indices)}>
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void saveGroup(indices)}
                    loading={savingKey === groupSaveKey}
                    disabled={
                      loading ||
                      syncing ||
                      (savingKey != null && savingKey !== groupSaveKey) ||
                      (isWebsiteGroup && !isManualCardReady(draft))
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            </AdminFormShell>
          );
        })}
        {visibleGroups.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="body-sm text-ink-60">
              Page {currentPage} of {pageCount}
            </p>
            {pageCount > 1 ? (
              <nav aria-label="Fleet pagination" className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="tertiary"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="tertiary"
                  disabled={currentPage >= pageCount}
                  onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                >
                  Next
                </Button>
              </nav>
            ) : null}
          </div>
        ) : null}
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
