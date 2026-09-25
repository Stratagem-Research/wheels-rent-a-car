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
import { cn } from "@/lib/utils";
import { writeHelpArticle } from "@/lib/admin/store";
import type { HelpArticle, HelpArticleSection } from "@/types/domain";
import {
  CMS_LOCALES,
  toLocalizedString,
  getLocalizedString,
  updateLocalizedString,
  type CmsLocale,
} from "@/lib/i18n/localized";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

/**
 * HelpArticleForm — shared create/edit form for /admin/help-articles.
 *
 * Sections are a repeater (add/remove rows in-place). Every text field is
 * localized (EN required, AR/FR optional). Persists via `writeHelpArticle()`
 * (Supabase upsert by slug) and routes back to the list on save.
 */

const SLUG_PATTERN = /^[a-z0-9-]+$/;

function localeHasOwnCopy(value: HelpArticle["title"], locale: CmsLocale): boolean {
  return Boolean(toLocalizedString(value)[locale]?.trim());
}

function localeIsComplete(article: HelpArticle, locale: CmsLocale): boolean {
  if (!localeHasOwnCopy(article.title, locale) || !localeHasOwnCopy(article.intro, locale)) {
    return false;
  }
  return article.sections.every(
    (section) =>
      localeHasOwnCopy(section.heading, locale) && localeHasOwnCopy(section.body, locale),
  );
}

export interface HelpArticleFormProps {
  /** When set, edit mode — seed the form from this article. */
  article?: HelpArticle;
}

export function HelpArticleForm({ article }: HelpArticleFormProps) {
  const router = useRouter();
  const isEdit = Boolean(article);
  const [saving, setSaving] = React.useState(false);
  const [activeLocale, setActiveLocale] = React.useState<CmsLocale>("en");

  const initial = React.useMemo<HelpArticle>(
    () =>
      article ?? {
        slug: "",
        title: { en: "" },
        intro: { en: "" },
        lastUpdated: new Date().toISOString().slice(0, 10),
        sections: [{ id: "", heading: { en: "" }, body: { en: "" } }],
      },
    [article],
  );

  const [form, setForm] = React.useState<HelpArticle>(initial);
  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const dirty = React.useMemo(
    () => JSON.stringify(form) !== JSON.stringify(initial),
    [form, initial],
  );
  useUnsavedChangesGuard(dirty);

  const update = <K extends keyof HelpArticle>(key: K, value: HelpArticle[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // ── Sections repeater ───────────────────────────────────────────
  const addSection = () =>
    setForm((f) => ({
      ...f,
      sections: [...f.sections, { id: "", heading: { en: "" }, body: { en: "" } }],
    }));
  const updateSection = (i: number, patch: Partial<HelpArticleSection>) =>
    setForm((f) => ({
      ...f,
      sections: f.sections.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    }));
  const removeSection = (i: number) =>
    setForm((f) => ({ ...f, sections: f.sections.filter((_, idx) => idx !== i) }));

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.slug.trim()) e.slug = "Slug is required.";
    else if (!SLUG_PATTERN.test(form.slug))
      e.slug = "Slug must be lowercase letters, numbers, and dashes only.";
    if (!getLocalizedString(form.title, "en").trim()) e.title = "Title (EN) is required.";
    if (!getLocalizedString(form.intro, "en").trim()) e.intro = "Intro (EN) is required.";
    if (form.sections.length === 0) e.sections = "Add at least one section.";
    else
      form.sections.forEach((s, i) => {
        if (!s.id.trim()) e[`section-${i}-id`] = "Section id is required.";
        else if (!SLUG_PATTERN.test(s.id))
          e[`section-${i}-id`] = "Section id must be lowercase letters, numbers, and dashes only.";
        if (!getLocalizedString(s.heading, "en").trim())
          e[`section-${i}-heading`] = "Heading (EN) is required.";
        if (!getLocalizedString(s.body, "en").trim())
          e[`section-${i}-body`] = "Body (EN) is required.";
      });
    return e;
  };

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next = validate();
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaving(true);
    try {
      await writeHelpArticle({
        ...form,
        slug: form.slug.trim(),
        title: updateLocalizedString(form.title, "en", getLocalizedString(form.title, "en").trim()),
        intro: updateLocalizedString(form.intro, "en", getLocalizedString(form.intro, "en").trim()),
        sections: form.sections.map((s) => ({
          id: s.id.trim(),
          heading: updateLocalizedString(s.heading, "en", getLocalizedString(s.heading, "en").trim()),
          body: updateLocalizedString(s.body, "en", getLocalizedString(s.body, "en").trim()),
        })),
      });
      router.push("/admin/help-articles");
    } catch (error) {
      setErrors({
        slug: error instanceof Error ? error.message : "Could not save help article.",
      });
    } finally {
      setSaving(false);
    }
  };

  const formActions = (
    <>
      <Button type="button" variant="secondary" onClick={() => router.push("/admin/help-articles")}>
        Cancel
      </Button>
      <Button type="submit" variant="primary" loading={saving}>
        {isEdit ? "Save changes" : "Create article"}
      </Button>
    </>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
      <AdminFormShell footer={formActions}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Editing locale">
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
          <div className="flex items-end">
            <div className="flex flex-wrap gap-2 pb-0.5" role="status" aria-label="Translation status">
              {CMS_LOCALES.map((locale) => {
                const complete = localeIsComplete(form, locale);
                const active = locale === activeLocale;
                return (
                  <button
                    key={locale}
                    type="button"
                    onClick={() => setActiveLocale(locale)}
                    aria-pressed={active}
                    aria-label={`${locale.toUpperCase()} ${complete ? "complete" : "needs copy"}`}
                    className={cn(
                      "label-sm rounded-pill inline-flex h-8 items-center gap-1.5 border px-3",
                      "focus-visible:ring-ink-100 focus-visible:ring-offset-paper focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
                      active
                        ? "border-ink-100 bg-ink-100 text-paper"
                        : "border-border bg-paper text-ink-80 hover:bg-ink-05",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 rounded-full",
                        complete
                          ? active
                            ? "bg-paper"
                            : "bg-ink-100"
                          : active
                            ? "border border-paper/70"
                            : "border border-ink-30",
                      )}
                    />
                    {locale.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Slug" required error={errors.slug} helper="Lowercase, dashes, no spaces. e.g. rental-terms">
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
          <Field label="Last updated" required helper="YYYY-MM-DD shown on the article.">
            {({ id }) => (
              <Input
                id={id}
                type="date"
                value={form.lastUpdated}
                onChange={(e) => update("lastUpdated", e.target.value)}
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
        </div>

        <Field label="Intro" required error={errors.intro} helper="One-line summary shown above the sections.">
          {({ id, describedBy, invalid }) => (
            <Textarea
              id={id}
              rows={2}
              aria-describedby={describedBy}
              invalid={invalid}
              value={getLocalizedString(form.intro, activeLocale)}
              onChange={(e) =>
                update("intro", updateLocalizedString(form.intro, activeLocale, e.target.value))
              }
            />
          )}
        </Field>
      </AdminFormShell>

      <AdminFormShell
        title="Sections"
        helper="Ordered top to bottom. Each section id must be unique within the article and URL-safe."
        footer={formActions}
      >
        <div className="flex flex-col gap-4">
          {form.sections.map((section, i) => (
            <div
              key={i}
              className="bg-ink-05 border-border flex flex-col gap-3 rounded-lg border p-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="headline-sm text-ink-100">
                  {section.id.trim() || `Section ${i + 1}`}
                </h3>
                <Button
                  type="button"
                  variant="tertiary"
                  size="sm"
                  onClick={() => removeSection(i)}
                  aria-label="Remove section"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Section id"
                  required
                  error={errors[`section-${i}-id`]}
                  helper="Anchor for the TOC. e.g. who-can-rent"
                >
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      value={section.id}
                      onChange={(e) => updateSection(i, { id: e.target.value })}
                    />
                  )}
                </Field>
                <Field label="Heading" required error={errors[`section-${i}-heading`]}>
                  {({ id, describedBy, invalid }) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      invalid={invalid}
                      value={getLocalizedString(section.heading, activeLocale)}
                      onChange={(e) =>
                        updateSection(i, {
                          heading: updateLocalizedString(
                            section.heading,
                            activeLocale,
                            e.target.value,
                          ),
                        })
                      }
                    />
                  )}
                </Field>
              </div>
              <Field label="Body" required error={errors[`section-${i}-body`]}>
                {({ id, describedBy, invalid }) => (
                  <Textarea
                    id={id}
                    rows={4}
                    aria-describedby={describedBy}
                    invalid={invalid}
                    value={getLocalizedString(section.body, activeLocale)}
                    onChange={(e) =>
                      updateSection(i, {
                        body: updateLocalizedString(section.body, activeLocale, e.target.value),
                      })
                    }
                  />
                )}
              </Field>
            </div>
          ))}
          {errors.sections ? <ErrorText>{errors.sections}</ErrorText> : null}
          <div>
            <Button type="button" variant="secondary" size="sm" onClick={addSection}>
              <Plus className="size-4" aria-hidden="true" />
              Add section
            </Button>
          </div>
        </div>
      </AdminFormShell>
    </form>
  );
}
