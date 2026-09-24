"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { AdminImageUpload } from "@/components/admin/AdminImageUpload";
import { useTrips } from "@/lib/admin/useAdminStore";
import { writeTrips } from "@/lib/admin/store";
import type { Trip, TripRegion, VehicleCategory } from "@/types/domain";
import type { CmsLocale } from "@/lib/i18n/localized";
import {
  getLocalizedString,
  getLocalizedStringArray,
  updateLocalizedString,
  updateLocalizedStringArray,
} from "@/lib/i18n/localized";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

/**
 * TripForm — shared create/edit form for /admin/trips/{new,[slug]}.
 *
 * Validates client-side, persists via `writeTrips()` (Supabase), and
 * routes back to /admin/trips on save. Slug edits update the existing
 * trip in place; creating reuses the same form against an empty seed.
 */

const REGIONS: Array<{ id: TripRegion; label: string }> = [
  { id: "mountains", label: "Mountains" },
  { id: "coast", label: "Coast" },
  { id: "bekaa", label: "Bekaa" },
  { id: "cultural", label: "Cultural" },
  { id: "north", label: "North" },
  { id: "south", label: "South" },
];

const VEHICLE_CATEGORIES: VehicleCategory[] = [
  "economy",
  "compact",
  "sedan",
  "suv",
  "luxury",
  "4x4",
  "7-seater",
  "convertible",
];

export interface TripFormProps {
  /** When set, edit mode — load this trip from the store. */
  slug?: string;
}

export function TripForm({ slug }: TripFormProps) {
  const router = useRouter();
  const isEdit = Boolean(slug);
  const trips = useTrips();
  const [saving, setSaving] = React.useState(false);
  const [activeLocale, setActiveLocale] = React.useState<CmsLocale>("en");

  const initial = React.useMemo<Trip>(() => {
    if (!slug) return emptyTrip();
    return trips.find((t) => t.slug === slug) ?? emptyTrip();
  }, [slug, trips]);

  const [form, setForm] = React.useState<Trip>(initial);
  const [tagsInput, setTagsInput] = React.useState(
    getLocalizedStringArray(initial.tags, "en").join(", "),
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const dirty = React.useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial) || tagsInput !== getLocalizedStringArray(initial.tags, "en").join(", "),
    [form, initial, tagsInput],
  );
  useUnsavedChangesGuard(dirty);

  React.useEffect(() => {
    // Keep local draft synchronized when the backing trip record loads/changes.
    // Queue state updates outside the effect body to satisfy the React hooks rule.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setForm(initial);
      setTagsInput(getLocalizedStringArray(initial.tags, activeLocale).join(", "));
    });
    return () => {
      cancelled = true;
    };
  }, [activeLocale, initial]);

  const update = <K extends keyof Trip>(key: K, value: Trip[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.slug.trim()) e.slug = "Slug is required.";
    else if (!/^[a-z0-9-]+$/.test(form.slug))
      e.slug = "Slug must be lowercase letters, numbers, and dashes only.";
    if (!getLocalizedString(form.title, activeLocale).trim()) e.title = "Title is required.";
    if (!getLocalizedString(form.excerpt, activeLocale).trim()) e.excerpt = "Excerpt is required.";
    if (!form.coverImage.src.trim()) e.coverImage = "Cover image path is required.";
    if (!getLocalizedString(form.body, activeLocale).trim()) e.body = "Body is required.";
    return e;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const now = new Date().toISOString();
    const tagsForLocale = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const tags = updateLocalizedStringArray(form.tags, activeLocale, tagsForLocale);

    setSaving(true);
    try {
      if (isEdit && slug) {
        const idx = trips.findIndex((t) => t.slug === slug);
        const updated: Trip = { ...form, tags, updatedAt: now };
        const nextTrips = [...trips];
        if (idx >= 0) nextTrips[idx] = updated;
        else nextTrips.push(updated);
        await writeTrips(nextTrips);
      } else {
        if (trips.some((t) => t.slug === form.slug)) {
          setErrors({ slug: "That slug already exists. Choose another." });
          return;
        }
        await writeTrips([
          ...trips,
          { ...form, tags, publishedAt: form.publishedAt || now.slice(0, 10), updatedAt: now },
        ]);
      }
      router.push("/admin/trips");
    } catch (error) {
      setErrors({
        slug: error instanceof Error ? error.message : "Could not save trip.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!isEdit || !slug) return;
    if (!confirm("Delete this trip? This cannot be undone.")) return;
    setSaving(true);
    try {
      await writeTrips(trips.filter((t) => t.slug !== slug));
      router.push("/admin/trips");
    } catch (error) {
      setErrors({
        slug: error instanceof Error ? error.message : "Could not delete trip.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <AdminFormShell
        title={isEdit ? "Edit trip" : "New trip"}
        helper="All fields are required unless marked optional. Cover images upload to Supabase Storage."
        footer={
          <>
            {isEdit ? (
              <Button type="button" variant="tertiary" onClick={onDelete}>
                Delete
              </Button>
            ) : null}
            <Button type="button" variant="secondary" onClick={() => router.push("/admin/trips")}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEdit ? "Save changes" : "Create trip"}
            </Button>
          </>
        }
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Editing locale" helper="Translate fields for EN / AR / FR.">
            {({ id }) => (
              <Select
                id={id}
                value={activeLocale}
                onChange={(e) => {
                  const nextLocale = e.target.value as CmsLocale;
                  setActiveLocale(nextLocale);
                  setTagsInput(getLocalizedStringArray(form.tags, nextLocale).join(", "));
                }}
              >
                <option value="en">English (EN)</option>
                <option value="ar">Arabic (AR)</option>
                <option value="fr">French (FR)</option>
              </Select>
            )}
          </Field>
          <div />
          <Field label="Slug" required error={errors.slug} helper="Lowercase, dashes, no spaces.">
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={form.slug}
                disabled={isEdit}
                onChange={(e) => update("slug", e.target.value)}
              />
            )}
          </Field>
          <Field label="Title" required error={errors.title}>
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={getLocalizedString(form.title, activeLocale)}
                onChange={(e) =>
                  update("title", updateLocalizedString(form.title, activeLocale, e.target.value))
                }
              />
            )}
          </Field>
          <Field label="Region" required>
            {({ id }) => (
              <Select
                id={id}
                value={form.region}
                onChange={(e) => update("region", e.target.value as TripRegion)}
              >
                {REGIONS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Suggested vehicle category" required>
            {({ id }) => (
              <Select
                id={id}
                value={form.suggestedVehicleCategory}
                onChange={(e) =>
                  update("suggestedVehicleCategory", e.target.value as VehicleCategory)
                }
              >
                {VEHICLE_CATEGORIES.map((c) => (
                  <option key={c} value={c} className="capitalize">
                    {c.replace("-", " ")}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Meta" helper="Short label shown on cards (e.g. '8h · SUV recommended').">
            {({ id }) => (
              <Input
                id={id}
                value={getLocalizedString(form.meta, activeLocale)}
                onChange={(e) =>
                  update("meta", updateLocalizedString(form.meta, activeLocale, e.target.value))
                }
              />
            )}
          </Field>
          <Field label="Tags" helper="Comma-separated, lowercase.">
            {({ id }) => (
              <Input
                id={id}
                value={tagsInput}
                placeholder="mountains, day trip, scenic"
                onChange={(e) => setTagsInput(e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field
          label="Excerpt"
          required
          error={errors.excerpt}
          helper="One-line teaser on listings."
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={2}
              aria-describedby={describedBy}
              invalid={invalid}
              value={getLocalizedString(form.excerpt, activeLocale)}
              onChange={(e) =>
                update("excerpt", updateLocalizedString(form.excerpt, activeLocale, e.target.value))
              }
            />
          )}
        </Field>

        <Field label="Cover image" required error={errors.coverImage}>
          {() => (
            <AdminImageUpload
              kind="trip"
              entityId={form.slug.trim() || "trip"}
              currentUrl={form.coverImage.src || undefined}
              onUploaded={(result) =>
                update("coverImage", {
                  ...form.coverImage,
                  src: result.url,
                  width: result.width ?? form.coverImage.width,
                  height: result.height ?? form.coverImage.height,
                })
              }
              onRemoved={() => update("coverImage", { ...form.coverImage, src: "" })}
            />
          )}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Cover image alt text">
            {({ id }) => (
              <Input
                id={id}
                value={getLocalizedString(form.coverImage.alt, activeLocale)}
                onChange={(e) =>
                  update("coverImage", {
                    ...form.coverImage,
                    alt: updateLocalizedString(form.coverImage.alt, activeLocale, e.target.value),
                  })
                }
              />
            )}
          </Field>
          <Field label="Published date" helper="YYYY-MM-DD">
            {({ id }) => (
              <Input
                id={id}
                type="date"
                value={form.publishedAt}
                onChange={(e) => update("publishedAt", e.target.value)}
              />
            )}
          </Field>
        </div>

        <Field
          label="Body"
          required
          error={errors.body}
          helper="Markdown supported — separate paragraphs with a blank line."
        >
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={12}
              aria-describedby={describedBy}
              invalid={invalid}
              value={getLocalizedString(form.body, activeLocale)}
              onChange={(e) =>
                update("body", updateLocalizedString(form.body, activeLocale, e.target.value))
              }
            />
          )}
        </Field>

        {errors.form ? <ErrorText>{errors.form}</ErrorText> : null}
      </AdminFormShell>
    </form>
  );
}

function emptyTrip(): Trip {
  return {
    slug: "",
    title: { en: "", ar: "", fr: "" },
    excerpt: { en: "", ar: "", fr: "" },
    coverImage: { src: "", alt: { en: "", ar: "", fr: "" }, width: 1200, height: 1500 },
    meta: { en: "Half day · Any car", ar: "", fr: "" },
    region: "mountains",
    body: { en: "", ar: "", fr: "" },
    suggestedVehicleCategory: "sedan",
    tags: { en: [], ar: [], fr: [] },
    publishedAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString(),
  };
}
