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
import { toast } from "@/components/ui/Toast";
import type { CmsLocale } from "@/lib/i18n/localized";
import {
  getLocalizedString,
  getLocalizedStringArray,
  updateLocalizedString,
  updateLocalizedStringArray,
} from "@/lib/i18n/localized";
import type { LocalizedString, LocalizedStringArray } from "@/types/domain";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

/**
 * /admin/about — structured editor for the /about page content.
 *
 * Replaces the previous raw-JSON textarea with locale-aware form fields
 * (story paragraphs, pull quote, fleet philosophy, stats, team profiles).
 * Load/save still use GET/PUT /api/admin/about with the same payload shape.
 */

type FullLocalizedString = { en: string; ar: string; fr: string };
type FullLocalizedArray = { en: string[]; ar: string[]; fr: string[] };

type AboutContent = {
  storyParagraphs: FullLocalizedArray;
  pullQuote: FullLocalizedString;
  fleetPhilosophy: {
    heading: FullLocalizedString;
    paragraphs: FullLocalizedArray;
  };
  stats: Array<{ value: string; label: FullLocalizedString }>;
  teamIntro: FullLocalizedString;
  teamDedication: FullLocalizedString;
  team: Array<{
    name: string;
    role: FullLocalizedString;
    photo: string;
    quote: FullLocalizedString;
    bio: FullLocalizedString;
    highlights: FullLocalizedArray;
  }>;
};

export default function AdminAboutPage() {
  const [content, setContent] = React.useState<AboutContent | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [activeLocale, setActiveLocale] = React.useState<CmsLocale>("en");
  const [dirty, setDirty] = React.useState(false);

  useUnsavedChangesGuard(dirty);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/about", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to load about content.");
      }
      const data = (await res.json()) as { content: unknown };
      setContent(normalizeAboutPayload(data.content));
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load about content.");
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
    if (!content) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...csrfHeader() },
        body: JSON.stringify({ content: toSavePayload(content) }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to save about content.");
      }
      await refresh();
      toast.success("Saved about content.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save about content.");
    } finally {
      setSaving(false);
    }
  };

  const patch = (next: Partial<AboutContent>) => {
    setContent((c) => (c ? { ...c, ...next } : c));
    setDirty(true);
  };

  return (
    <AdminPageShell
      eyebrow="Brand content"
      title="About and team"
      description="Manage /about story text, stats, team cards, and fleet philosophy copy."
      actions={
        <div className="flex items-center gap-2">
          <label className="label-md text-ink-60">Locale</label>
          <select
            value={activeLocale}
            onChange={(event) => setActiveLocale(event.target.value as CmsLocale)}
            className="bg-paper border-border rounded-md border px-2 py-1 text-sm"
          >
            <option value="en">EN</option>
            <option value="ar">AR</option>
            <option value="fr">FR</option>
          </select>
          <Button variant="tertiary" onClick={() => void refresh()}>
            <RefreshCcw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button onClick={() => void save()} loading={saving} disabled={loading || !content}>
            Save
          </Button>
        </div>
      }
    >
      {!content ? (
        <p className="body-md text-ink-60">{loading ? "Loading…" : "No content."}</p>
      ) : (
        <div className="flex flex-col gap-6">
          <AdminFormShell
            title="Story"
            helper="Editorial paragraphs shown in the /about story block. Markdown is not parsed here."
          >
            <LocalizedParagraphList
              label="Story paragraphs"
              value={content.storyParagraphs}
              locale={activeLocale}
              onChange={(next) => patch({ storyParagraphs: next })}
            />
            <Field label="Pull quote">
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={2}
                  value={getLocalizedString(content.pullQuote, activeLocale)}
                  onChange={(e) =>
                    patch({
                      pullQuote: toFull(
                        updateLocalizedString(content.pullQuote, activeLocale, e.target.value),
                      ),
                    })
                  }
                />
              )}
            </Field>
          </AdminFormShell>

          <AdminFormShell title="Fleet philosophy">
            <Field label="Heading">
              {({ id }) => (
                <Input
                  id={id}
                  value={getLocalizedString(content.fleetPhilosophy.heading, activeLocale)}
                  onChange={(e) =>
                    patch({
                      fleetPhilosophy: {
                        ...content.fleetPhilosophy,
                        heading: toFull(
                          updateLocalizedString(
                            content.fleetPhilosophy.heading,
                            activeLocale,
                            e.target.value,
                          ),
                        ),
                      },
                    })
                  }
                />
              )}
            </Field>
            <LocalizedParagraphList
              label="Paragraphs"
              value={content.fleetPhilosophy.paragraphs}
              locale={activeLocale}
              onChange={(next) =>
                patch({
                  fleetPhilosophy: { ...content.fleetPhilosophy, paragraphs: next },
                })
              }
            />
          </AdminFormShell>

          <AdminFormShell title="Stats" helper="The headline number strip on /about.">
            <div className="flex flex-col gap-3">
              {content.stats.map((stat, i) => (
                <div key={i} className="border-border grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_2fr_auto]">
                  <Field label="Value" helper="e.g. '11' or '24/7'">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={stat.value}
                        onChange={(e) =>
                          patch({
                            stats: content.stats.map((s, idx) =>
                              idx === i ? { ...s, value: e.target.value } : s,
                            ),
                          })
                        }
                      />
                    )}
                  </Field>
                  <Field label="Label">
                    {({ id }) => (
                      <Input
                        id={id}
                        value={getLocalizedString(stat.label, activeLocale)}
                        onChange={(e) =>
                          patch({
                            stats: content.stats.map((s, idx) =>
                              idx === i
                                ? {
                                    ...s,
                                    label: toFull(
                                      updateLocalizedString(s.label, activeLocale, e.target.value),
                                    ),
                                  }
                                : s,
                            ),
                          })
                        }
                      />
                    )}
                  </Field>
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="tertiary"
                      onClick={() =>
                        patch({ stats: content.stats.filter((_, idx) => idx !== i) })
                      }
                      aria-label="Remove stat"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    patch({
                      stats: [...content.stats, { value: "", label: emptyLocalized() }],
                    })
                  }
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add stat
                </Button>
              </div>
            </div>
          </AdminFormShell>

          <AdminFormShell title="Team intro">
            <Field label="Intro paragraph">
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={3}
                  value={getLocalizedString(content.teamIntro, activeLocale)}
                  onChange={(e) =>
                    patch({
                      teamIntro: toFull(
                        updateLocalizedString(content.teamIntro, activeLocale, e.target.value),
                      ),
                    })
                  }
                />
              )}
            </Field>
            <Field label="Dedication line">
              {({ id }) => (
                <Textarea
                  id={id}
                  rows={2}
                  value={getLocalizedString(content.teamDedication, activeLocale)}
                  onChange={(e) =>
                    patch({
                      teamDedication: toFull(
                        updateLocalizedString(content.teamDedication, activeLocale, e.target.value),
                      ),
                    })
                  }
                />
              )}
            </Field>
          </AdminFormShell>

          <AdminFormShell title="Team members">
            <div className="flex flex-col gap-4">
              {content.team.map((member, i) => (
                <div key={i} className="border-border flex flex-col gap-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="headline-sm text-ink-100">
                      {member.name.trim() || "New member"}
                    </h3>
                    <Button
                      type="button"
                      variant="tertiary"
                      onClick={() =>
                        patch({ team: content.team.filter((_, idx) => idx !== i) })
                      }
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      Remove
                    </Button>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Name" helper="Not translated.">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={member.name}
                          onChange={(e) => updateMember(i, { name: e.target.value })}
                        />
                      )}
                    </Field>
                    <Field label="Photo" helper="Upload to Supabase Storage, or paste a path below.">
                      {() => (
                        <div className="flex flex-col gap-3">
                          <AdminImageUpload
                            kind="team"
                            entityId={member.name.trim() || `member-${i + 1}`}
                            currentUrl={member.photo || undefined}
                            onUploaded={(result) => updateMember(i, { photo: result.url })}
                            onRemoved={() => updateMember(i, { photo: "" })}
                          />
                          <Input
                            aria-label={`Photo path for ${member.name || `member ${i + 1}`}`}
                            value={member.photo}
                            placeholder="/images/Team/name.jpg or Storage URL"
                            onChange={(e) => updateMember(i, { photo: e.target.value })}
                          />
                        </div>
                      )}
                    </Field>
                    <Field label="Role">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={getLocalizedString(member.role, activeLocale)}
                          onChange={(e) =>
                            updateMember(i, {
                              role: toFull(
                                updateLocalizedString(member.role, activeLocale, e.target.value),
                              ),
                            })
                          }
                        />
                      )}
                    </Field>
                    <Field label="Quote" helper="Optional.">
                      {({ id }) => (
                        <Input
                          id={id}
                          value={getLocalizedString(member.quote, activeLocale)}
                          onChange={(e) =>
                            updateMember(i, {
                              quote: toFull(
                                updateLocalizedString(member.quote, activeLocale, e.target.value),
                              ),
                            })
                          }
                        />
                      )}
                    </Field>
                  </div>
                  <Field label="Bio">
                    {({ id }) => (
                      <Textarea
                        id={id}
                        rows={3}
                        value={getLocalizedString(member.bio, activeLocale)}
                        onChange={(e) =>
                          updateMember(i, {
                            bio: toFull(
                              updateLocalizedString(member.bio, activeLocale, e.target.value),
                            ),
                          })
                        }
                      />
                    )}
                  </Field>
                  <LocalizedParagraphList
                    label="Highlights"
                    value={member.highlights}
                    locale={activeLocale}
                    rows={1}
                    onChange={(next) => updateMember(i, { highlights: next })}
                  />
                </div>
              ))}
              <div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => patch({ team: [...content.team, emptyMember()] })}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add team member
                </Button>
              </div>
            </div>
          </AdminFormShell>
        </div>
      )}
    </AdminPageShell>
  );

  function updateMember(index: number, member: Partial<AboutContent["team"][number]>) {
    setContent((c) =>
      c
        ? {
            ...c,
            team: c.team.map((m, idx) => (idx === index ? { ...m, ...member } : m)),
          }
        : c,
    );
    setDirty(true);
  }
}

/**
 * Localized paragraph/list repeater editing the active locale's array.
 * Mirrors the corporate inclusions pattern: add/remove operate on the
 * active locale only, allowing per-locale list lengths.
 */
function LocalizedParagraphList({
  label,
  value,
  locale,
  rows = 3,
  onChange,
}: {
  label: string;
  value: FullLocalizedArray;
  locale: CmsLocale;
  rows?: number;
  onChange: (next: FullLocalizedArray) => void;
}) {
  const items = getLocalizedStringArray(value, locale);
  const setItems = (next: string[]) =>
    onChange(toFullArray(updateLocalizedStringArray(value, locale, next)));

  return (
    <div>
      <p className="label-md text-ink-70 mb-2 block">{label}</p>
      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="flex-1">
              <Textarea
                rows={rows}
                value={item}
                onChange={(e) => setItems(items.map((p, idx) => (idx === i ? e.target.value : p)))}
              />
            </div>
            <Button
              type="button"
              variant="tertiary"
              onClick={() => setItems(items.filter((_, idx) => idx !== i))}
              aria-label={`Remove ${label} item`}
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        <div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setItems([...items, ""])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}

function emptyLocalized(): FullLocalizedString {
  return { en: "", ar: "", fr: "" };
}

function emptyArray(): FullLocalizedArray {
  return { en: [], ar: [], fr: [] };
}

function emptyMember(): AboutContent["team"][number] {
  return {
    name: "",
    role: emptyLocalized(),
    photo: "",
    quote: emptyLocalized(),
    bio: emptyLocalized(),
    highlights: emptyArray(),
  };
}

function toFull(value: LocalizedString): FullLocalizedString {
  return { en: value.en ?? "", ar: value.ar ?? "", fr: value.fr ?? "" };
}

function toFullArray(value: LocalizedStringArray): FullLocalizedArray {
  return { en: value.en ?? [], ar: value.ar ?? [], fr: value.fr ?? [] };
}

function asLocalizedString(value: unknown): FullLocalizedString {
  if (typeof value === "string") return { en: value, ar: "", fr: "" };
  if (!value || typeof value !== "object") return emptyLocalized();
  const obj = value as Record<string, unknown>;
  return {
    en: typeof obj.en === "string" ? obj.en : "",
    ar: typeof obj.ar === "string" ? obj.ar : "",
    fr: typeof obj.fr === "string" ? obj.fr : "",
  };
}

function asLocalizedArray(value: unknown): FullLocalizedArray {
  const toArray = (input: unknown): string[] =>
    Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : [];
  if (Array.isArray(value)) return { en: toArray(value), ar: [], fr: [] };
  if (!value || typeof value !== "object") return emptyArray();
  const obj = value as Record<string, unknown>;
  return { en: toArray(obj.en), ar: toArray(obj.ar), fr: toArray(obj.fr) };
}

function normalizeAboutPayload(input: unknown): AboutContent {
  const source = (input ?? {}) as Record<string, unknown>;
  const fleet = (source.fleetPhilosophy ?? {}) as Record<string, unknown>;
  const stats = Array.isArray(source.stats) ? source.stats : [];
  const team = Array.isArray(source.team) ? source.team : [];
  return {
    storyParagraphs: asLocalizedArray(source.storyParagraphs),
    pullQuote: asLocalizedString(source.pullQuote),
    fleetPhilosophy: {
      heading: asLocalizedString(fleet.heading),
      paragraphs: asLocalizedArray(fleet.paragraphs),
    },
    stats: stats.map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        value: typeof row.value === "string" ? row.value : "",
        label: asLocalizedString(row.label),
      };
    }),
    teamIntro: asLocalizedString(source.teamIntro),
    teamDedication: asLocalizedString(source.teamDedication),
    team: team.map((item) => {
      const row = (item ?? {}) as Record<string, unknown>;
      return {
        name: typeof row.name === "string" ? row.name : "",
        role: asLocalizedString(row.role),
        photo: typeof row.photo === "string" ? row.photo : "",
        quote: asLocalizedString(row.quote),
        bio: asLocalizedString(row.bio),
        highlights: asLocalizedArray(row.highlights),
      };
    }),
  };
}

/**
 * Trim/clean a full localized string for save. Drops empty AR/FR so the
 * payload stays compact; EN is always kept (schema requires it).
 */
function cleanLocalized(value: FullLocalizedString): LocalizedString {
  const out: LocalizedString = { en: value.en.trim() };
  if (value.ar.trim()) out.ar = value.ar.trim();
  if (value.fr.trim()) out.fr = value.fr.trim();
  return out;
}

function cleanArray(value: FullLocalizedArray): LocalizedStringArray {
  const trim = (arr: string[]) => arr.map((s) => s.trim()).filter(Boolean);
  const out: LocalizedStringArray = { en: trim(value.en) };
  const ar = trim(value.ar);
  const fr = trim(value.fr);
  if (ar.length) out.ar = ar;
  if (fr.length) out.fr = fr;
  return out;
}

function toSavePayload(content: AboutContent) {
  return {
    storyParagraphs: cleanArray(content.storyParagraphs),
    pullQuote: cleanLocalized(content.pullQuote),
    fleetPhilosophy: {
      heading: cleanLocalized(content.fleetPhilosophy.heading),
      paragraphs: cleanArray(content.fleetPhilosophy.paragraphs),
    },
    stats: content.stats.map((s) => ({
      value: s.value.trim(),
      label: cleanLocalized(s.label),
    })),
    teamIntro: cleanLocalized(content.teamIntro),
    teamDedication: cleanLocalized(content.teamDedication),
    team: content.team.map((m) => {
      const quote = cleanLocalized(m.quote);
      const highlights = cleanArray(m.highlights);
      return {
        name: m.name.trim(),
        role: cleanLocalized(m.role),
        photo: m.photo.trim(),
        ...(quote.en ? { quote } : {}),
        bio: cleanLocalized(m.bio),
        ...(highlights.en.length ? { highlights } : {}),
      };
    }),
  };
}

function csrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return {};
  return { "x-admin-csrf": decodeURIComponent(match[1] ?? "") };
}
