"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Chip } from "@/components/ui/Chip";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { toast } from "@/components/ui/Toast";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";
import { updateLocalizedString, type CmsLocale, type LocalizedString } from "@/lib/i18n/localized";
import { paginate } from "@/lib/vehicles/filter";

/**
 * /admin/seo — central page + vehicle SEO management. Page rows are seeded
 * by migration; vehicle rows are created automatically when a car is added
 * or synced (see lib/supabase/seo-repository.ts: ensureVehicleSeoRows).
 */

type SeoRow = {
  page_key: string;
  label: string;
  kind: "page" | "vehicle";
  meta_title: LocalizedString | null;
  meta_description: LocalizedString | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
  /** Vehicle rows only — that vehicle's own current photo, used as the OG
   *  image default when `og_image_url` isn't set (see /api/admin/seo GET). */
  vehicleImageUrl?: string | null;
};

type KindFilter = "all" | "page" | "vehicle";

const PAGE_SIZE = 10;
const LOCALES: { id: CmsLocale; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "ar", label: "AR" },
  { id: "fr", label: "FR" },
];

function matchesSearch(row: SeoRow, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [row.label, row.page_key].join(" ").toLowerCase().includes(q);
}

export default function AdminSeoPage() {
  const [rows, setRows] = React.useState<SeoRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [savingKey, setSavingKey] = React.useState<string | null>(null);
  const [kindFilter, setKindFilter] = React.useState<KindFilter>("all");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [locale, setLocale] = React.useState<CmsLocale>("en");

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/seo", { cache: "no-store" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Failed to load SEO data.");
      }
      const body = (await res.json()) as { items: SeoRow[] };
      setRows(Array.isArray(body.items) ? body.items : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load SEO data.");
    } finally {
      setLoading(false);
    }
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    void refresh();
  }, [refresh]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const visibleRows = React.useMemo(
    () =>
      rows.filter((row) => {
        if (kindFilter !== "all" && row.kind !== kindFilter) return false;
        return matchesSearch(row, search);
      }),
    [rows, kindFilter, search],
  );
  const pageCount = Math.max(1, Math.ceil(visibleRows.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagedRows = paginate(visibleRows, currentPage, PAGE_SIZE);

  const updateRow = (pageKey: string, patch: Partial<SeoRow>) => {
    setRows((list) => list.map((row) => (row.page_key === pageKey ? { ...row, ...patch } : row)));
  };

  const saveRow = async (row: SeoRow) => {
    setSavingKey(row.page_key);
    setError(null);
    try {
      const res = await fetch("/api/admin/seo", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
        body: JSON.stringify({
          items: [
            {
              page_key: row.page_key,
              label: row.label,
              kind: row.kind,
              meta_title: row.meta_title,
              meta_description: row.meta_description,
              og_image_url: row.og_image_url,
              canonical_url: row.canonical_url,
              noindex: row.noindex,
            },
          ],
        }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? "Save failed.");
      }
      toast.success(`Saved ${row.label}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SEO data.");
    } finally {
      setSavingKey(null);
    }
  };

  return (
    <AdminPageShell
      eyebrow="SEO"
      title="Page metadata"
      description="Manage meta titles, descriptions, and OG images for every page and vehicle."
    >
      {error ? <p className="body-md text-danger mb-4">{error}</p> : null}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <p className="body-sm text-ink-60">
            {loading
              ? "Loading…"
              : visibleRows.length === 0
                ? "0 pages"
                : `Showing ${(currentPage - 1) * PAGE_SIZE + 1}–${Math.min(currentPage * PAGE_SIZE, visibleRows.length)} of ${visibleRows.length}`}
          </p>
          <div className="flex w-full min-w-0 flex-wrap items-end gap-3 sm:w-auto">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Kind">
              {(
                [
                  ["all", "All"],
                  ["page", "Pages"],
                  ["vehicle", "Vehicles"],
                ] as const
              ).map(([id, label]) => (
                <Chip
                  key={id}
                  variant={kindFilter === id ? "selected" : "default"}
                  onClick={() => {
                    setKindFilter(id);
                    setPage(1);
                  }}
                >
                  {label}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Editing locale">
              {LOCALES.map(({ id, label }) => (
                <Chip key={id} variant={locale === id ? "selected" : "default"} onClick={() => setLocale(id)}>
                  {label}
                </Chip>
              ))}
            </div>
            <Field label="" className="min-w-0 w-full sm:w-64">
              {({ id }) => (
                <Input
                  id={id}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search pages or vehicles"
                  autoComplete="off"
                />
              )}
            </Field>
          </div>
        </div>

        {rows.length === 0 && !loading ? (
          <p className="body-md text-ink-60">No SEO entries yet.</p>
        ) : null}
        {rows.length > 0 && visibleRows.length === 0 && !loading ? (
          <p className="body-md text-ink-60">
            {search.trim() ? `No entries match "${search.trim()}".` : "No entries match this filter."}
          </p>
        ) : null}

        {pagedRows.map((row) => {
          const title = row.meta_title?.[locale] ?? "";
          const description = row.meta_description?.[locale] ?? "";
          return (
            <AdminFormShell
              key={row.page_key}
              title={row.label}
              titleBadge={
                <span className="label-sm bg-info-bg text-info rounded-pill px-3 py-1 font-semibold tracking-[0.08em] uppercase">
                  {row.kind}
                </span>
              }
              helper={row.page_key}
            >
              <Field
                label={`Meta title (${locale.toUpperCase()})`}
                helper={`${title.length}/60 characters`}
              >
                {({ id }) => (
                  <Input
                    id={id}
                    value={title}
                    onChange={(e) =>
                      updateRow(row.page_key, {
                        meta_title: updateLocalizedString(row.meta_title ?? { en: "" }, locale, e.target.value),
                      })
                    }
                  />
                )}
              </Field>
              <Field
                label={`Meta description (${locale.toUpperCase()})`}
                helper={`${description.length}/160 characters`}
              >
                {({ id }) => (
                  <Textarea
                    id={id}
                    rows={2}
                    value={description}
                    onChange={(e) =>
                      updateRow(row.page_key, {
                        meta_description: updateLocalizedString(
                          row.meta_description ?? { en: "" },
                          locale,
                          e.target.value,
                        ),
                      })
                    }
                  />
                )}
              </Field>
              <div className="flex flex-col gap-2">
                <p className="label-md text-ink-70">Social share image</p>
                <p className="body-sm text-ink-60">
                  {row.kind === "vehicle" && !row.og_image_url
                    ? "Using this vehicle's own photo automatically. Upload to override."
                    : "Shared across all locales."}
                </p>
                <AdminImageUpload
                  kind="seo"
                  variant="slot"
                  entityId={row.page_key}
                  currentUrl={row.og_image_url ?? row.vehicleImageUrl ?? undefined}
                  onUploaded={(result) => updateRow(row.page_key, { og_image_url: result.url })}
                  className="max-w-40"
                />
                {row.og_image_url ? (
                  <button
                    type="button"
                    className="body-sm text-ink-60 hover:text-ink-100 self-start underline-offset-2 hover:underline"
                    onClick={() => updateRow(row.page_key, { og_image_url: null })}
                  >
                    {row.kind === "vehicle" ? "Reset to vehicle photo" : "Clear image"}
                  </button>
                ) : null}
              </div>
              <Checkbox
                checked={row.noindex}
                onCheckedChange={(c) => updateRow(row.page_key, { noindex: c === true })}
                label="Hide from search engines (noindex)"
              />
              <div className="border-border flex justify-end border-t pt-4">
                <Button
                  type="button"
                  onClick={() => void saveRow(row)}
                  loading={savingKey === row.page_key}
                  disabled={loading || (savingKey != null && savingKey !== row.page_key)}
                >
                  Save
                </Button>
              </div>
            </AdminFormShell>
          );
        })}

        {visibleRows.length > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="body-sm text-ink-60">
              Page {currentPage} of {pageCount}
            </p>
            {pageCount > 1 ? (
              <nav aria-label="SEO pagination" className="flex items-center gap-2">
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
