"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { writeItineraries } from "@/lib/admin/store";
import { useItineraries } from "@/lib/admin/useAdminStore";
import type { Itinerary, ItineraryCategory, ItineraryScheduleItem } from "@/types/domain";
import type { CmsLocale } from "@/lib/i18n/localized";
import {
  getLocalizedString,
  getLocalizedStringArray,
  updateLocalizedString,
  updateLocalizedStringArray,
} from "@/lib/i18n/localized";

/**
 * ItineraryForm — shared create/edit form for /admin/itineraries/{new,[slug]}.
 *
 * Highlights + schedule are repeater fields (add/remove rows in-place).
 * Persists via `writeItineraries()` (Supabase).
 */

const CATEGORIES: Array<{ id: ItineraryCategory; label: string }> = [
  { id: "day-trip", label: "Day trip" },
  { id: "multi-day", label: "Multi-day" },
  { id: "cultural", label: "Cultural" },
  { id: "wine", label: "Wine" },
  { id: "north", label: "North" },
  { id: "south", label: "South" },
];

const VEHICLE_CLASSES: Array<{ id: Itinerary["vehicleClass"]; label: string }> = [
  { id: "sedan", label: "Sedan" },
  { id: "suv", label: "SUV" },
  { id: "van", label: "Van" },
];

export interface ItineraryFormProps {
  slug?: string;
}

export function ItineraryForm({ slug }: ItineraryFormProps) {
  const router = useRouter();
  const isEdit = Boolean(slug);
  const itineraries = useItineraries();
  const [saving, setSaving] = React.useState(false);
  const [activeLocale, setActiveLocale] = React.useState<CmsLocale>("en");

  const initial = React.useMemo<Itinerary>(() => {
    if (!slug) return emptyItinerary();
    return itineraries.find((i) => i.slug === slug) ?? emptyItinerary();
  }, [slug, itineraries]);

  const [form, setForm] = React.useState<Itinerary>(initial);
  const [priceUsd, setPriceUsd] = React.useState(
    initial.priceFromCents > 0 ? String(initial.priceFromCents / 100) : "0",
  );
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    // Keep local draft synchronized when the backing itinerary loads/changes.
    // Queue state updates outside the effect body to satisfy the React hooks rule.
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      setForm(initial);
      setPriceUsd(initial.priceFromCents > 0 ? String(initial.priceFromCents / 100) : "0");
    });
    return () => {
      cancelled = true;
    };
  }, [initial]);

  const update = <K extends keyof Itinerary>(key: K, value: Itinerary[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Highlights repeater ──────────────────────────────────────────
  const addHighlight = () =>
    setForm((f) => ({
      ...f,
      highlights: updateLocalizedStringArray(f.highlights, activeLocale, [
        ...getLocalizedStringArray(f.highlights, activeLocale),
        "",
      ]),
    }));
  const updateHighlight = (i: number, value: string) =>
    setForm((f) => ({
      ...f,
      highlights: updateLocalizedStringArray(
        f.highlights,
        activeLocale,
        getLocalizedStringArray(f.highlights, activeLocale).map((h, idx) =>
          idx === i ? value : h,
        ),
      ),
    }));
  const removeHighlight = (i: number) =>
    setForm((f) => ({
      ...f,
      highlights: updateLocalizedStringArray(
        f.highlights,
        activeLocale,
        getLocalizedStringArray(f.highlights, activeLocale).filter((_, idx) => idx !== i),
      ),
    }));

  // ── Schedule repeater ────────────────────────────────────────────
  const addStep = () =>
    setForm((f) => ({
      ...f,
      schedule: [...f.schedule, { time: "09:00", title: { en: "", ar: "", fr: "" } }],
    }));
  const updateStep = (i: number, patch: Partial<ItineraryScheduleItem>) =>
    setForm((f) => ({
      ...f,
      schedule: f.schedule.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  const removeStep = (i: number) =>
    setForm((f) => ({ ...f, schedule: f.schedule.filter((_, idx) => idx !== i) }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.slug.trim()) e.slug = "Slug is required.";
    else if (!/^[a-z0-9-]+$/.test(form.slug))
      e.slug = "Slug must be lowercase letters, numbers, and dashes only.";
    if (!getLocalizedString(form.title, activeLocale).trim()) e.title = "Title is required.";
    if (!getLocalizedString(form.excerpt, activeLocale).trim()) e.excerpt = "Excerpt is required.";
    if (!form.coverImage.src.trim()) e.coverImage = "Cover image path is required.";
    if (!getLocalizedString(form.duration, activeLocale).trim())
      e.duration = "Duration is required.";
    const priceNum = Number(priceUsd);
    if (!Number.isFinite(priceNum) || priceNum < 0)
      e.price = "Price must be a non-negative number in USD.";
    if (getLocalizedStringArray(form.highlights, activeLocale).length === 0)
      e.highlights = "Add at least one highlight.";
    if (form.schedule.length === 0) e.schedule = "Add at least one schedule step.";
    return e;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const now = new Date().toISOString();
    const priceFromCents = Math.round(Number(priceUsd) * 100);
    const highlights = updateLocalizedStringArray(
      form.highlights,
      activeLocale,
      getLocalizedStringArray(form.highlights, activeLocale)
        .map((h) => h.trim())
        .filter(Boolean),
    );
    const schedule = form.schedule
      .map((s) => ({
        ...s,
        title: updateLocalizedString(
          s.title,
          activeLocale,
          getLocalizedString(s.title, activeLocale).trim(),
        ),
        body: s.body
          ? updateLocalizedString(
              s.body,
              activeLocale,
              getLocalizedString(s.body, activeLocale).trim(),
            )
          : undefined,
      }))
      .filter((s) => Boolean(getLocalizedString(s.title, activeLocale)));

    setSaving(true);
    try {
      if (isEdit && slug) {
        const idx = itineraries.findIndex((i) => i.slug === slug);
        const updated: Itinerary = {
          ...form,
          highlights,
          schedule,
          priceFromCents,
          updatedAt: now,
        };
        const nextItineraries = [...itineraries];
        if (idx >= 0) nextItineraries[idx] = updated;
        else nextItineraries.push(updated);
        await writeItineraries(nextItineraries);
      } else {
        if (itineraries.some((i) => i.slug === form.slug)) {
          setErrors({ slug: "That slug already exists. Choose another." });
          return;
        }
        await writeItineraries([
          ...itineraries,
          { ...form, highlights, schedule, priceFromCents, updatedAt: now },
        ]);
      }
      router.push("/admin/itineraries");
    } catch (error) {
      setErrors({
        slug: error instanceof Error ? error.message : "Could not save itinerary.",
      });
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!isEdit || !slug) return;
    if (!confirm("Delete this itinerary? This cannot be undone.")) return;
    setSaving(true);
    try {
      await writeItineraries(itineraries.filter((i) => i.slug !== slug));
      router.push("/admin/itineraries");
    } catch (error) {
      setErrors({
        slug: error instanceof Error ? error.message : "Could not delete itinerary.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <AdminFormShell
        title={isEdit ? "Edit itinerary" : "New itinerary"}
        helper="Itineraries appear on /chauffeur and /itineraries. Use clear, real schedule times so they read as a believable plan."
        footer={
          <>
            {isEdit ? (
              <Button type="button" variant="tertiary" onClick={onDelete}>
                Delete
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/admin/itineraries")}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEdit ? "Save changes" : "Create itinerary"}
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
                onChange={(e) => setActiveLocale(e.target.value as CmsLocale)}
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
          <Field label="Category" required>
            {({ id }) => (
              <Select
                id={id}
                value={form.category}
                onChange={(e) => update("category", e.target.value as ItineraryCategory)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Vehicle class" required>
            {({ id }) => (
              <Select
                id={id}
                value={form.vehicleClass}
                onChange={(e) =>
                  update("vehicleClass", e.target.value as Itinerary["vehicleClass"])
                }
              >
                {VEHICLE_CLASSES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field
            label="Duration"
            required
            error={errors.duration}
            helper="e.g. 'Full day · 9-10 hours'"
          >
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={getLocalizedString(form.duration, activeLocale)}
                onChange={(e) =>
                  update(
                    "duration",
                    updateLocalizedString(form.duration, activeLocale, e.target.value),
                  )
                }
              />
            )}
          </Field>
          <Field label="Price from (USD)" required error={errors.price} helper="Whole dollars.">
            {({ id, describedBy, invalid }) => (
              <Input
                id={id}
                type="number"
                min={0}
                aria-describedby={describedBy}
                invalid={invalid}
                value={priceUsd}
                onChange={(e) => setPriceUsd(e.target.value)}
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

        <Field label="Cover image path" required error={errors.coverImage}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.coverImage.src}
              onChange={(e) => update("coverImage", { ...form.coverImage, src: e.target.value })}
            />
          )}
        </Field>
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
      </AdminFormShell>

      {/* Highlights repeater. */}
      <AdminFormShell
        title="Highlights"
        helper="Bullet points shown on the detail page. Keep them short — what the guest will see, do, or eat."
      >
        {getLocalizedStringArray(form.highlights, activeLocale).map((h, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <Input value={h} onChange={(e) => updateHighlight(i, e.target.value)} />
            </div>
            <Button
              type="button"
              variant="tertiary"
              size="md"
              onClick={() => removeHighlight(i)}
              aria-label="Remove highlight"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        {errors.highlights ? <ErrorText>{errors.highlights}</ErrorText> : null}
        <div>
          <Button type="button" variant="secondary" size="sm" onClick={addHighlight}>
            <Plus className="size-4" aria-hidden="true" />
            Add highlight
          </Button>
        </div>
      </AdminFormShell>

      {/* Schedule repeater. */}
      <AdminFormShell
        title="Sample schedule"
        helper="Each step has a time, a title, and an optional body. The detail page renders them as a timeline."
      >
        {form.schedule.map((step, i) => (
          <div
            key={i}
            className="bg-ink-05 border-border flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start"
          >
            <div className="w-full sm:w-24">
              <Input
                value={step.time}
                onChange={(e) => updateStep(i, { time: e.target.value })}
                placeholder="09:00"
              />
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Input
                value={getLocalizedString(step.title, activeLocale)}
                onChange={(e) =>
                  updateStep(i, {
                    title: updateLocalizedString(step.title, activeLocale, e.target.value),
                  })
                }
                placeholder="Step title"
              />
              <Textarea
                rows={2}
                value={step.body ? getLocalizedString(step.body, activeLocale) : ""}
                onChange={(e) =>
                  updateStep(i, {
                    body: updateLocalizedString(
                      step.body ?? { en: "", ar: "", fr: "" },
                      activeLocale,
                      e.target.value,
                    ),
                  })
                }
                placeholder="Optional description"
              />
            </div>
            <Button
              type="button"
              variant="tertiary"
              size="md"
              onClick={() => removeStep(i)}
              aria-label="Remove step"
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        {errors.schedule ? <ErrorText>{errors.schedule}</ErrorText> : null}
        <div>
          <Button type="button" variant="secondary" size="sm" onClick={addStep}>
            <Plus className="size-4" aria-hidden="true" />
            Add step
          </Button>
        </div>
      </AdminFormShell>
    </form>
  );
}

function emptyItinerary(): Itinerary {
  return {
    slug: "",
    title: { en: "", ar: "", fr: "" },
    excerpt: { en: "", ar: "", fr: "" },
    coverImage: { src: "", alt: { en: "", ar: "", fr: "" }, width: 1200, height: 1500 },
    category: "day-trip",
    duration: { en: "Full day · 8 hours", ar: "", fr: "" },
    priceFromCents: 0,
    highlights: { en: ["First highlight"], ar: [], fr: [] },
    schedule: [
      {
        time: "09:00",
        title: { en: "Pickup", ar: "", fr: "" },
        body: { en: "From your hotel.", ar: "", fr: "" },
      },
    ],
    vehicleClass: "sedan",
    updatedAt: new Date().toISOString(),
  };
}
