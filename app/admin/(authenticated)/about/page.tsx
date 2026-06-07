"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import type { LocalizedString, LocalizedStringArray } from "@/types/domain";

type AboutContent = {
  storyParagraphs: LocalizedStringArray;
  pullQuote: LocalizedString;
  fleetPhilosophy: {
    heading: LocalizedString;
    paragraphs: LocalizedStringArray;
  };
  stats: Array<{ value: string; label: LocalizedString }>;
  teamIntro: LocalizedString;
  teamDedication: LocalizedString;
  team: Array<{
    name: string;
    role: LocalizedString;
    photo: string;
    quote?: LocalizedString;
    bio: LocalizedString;
    highlights?: LocalizedStringArray;
  }>;
};

export default function AdminAboutPage() {
  const [jsonValue, setJsonValue] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/about", { cache: "no-store" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to load about content.");
      }
      const data = (await res.json()) as { content: AboutContent };
      setJsonValue(JSON.stringify(data.content, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load about content.");
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
      const content = JSON.parse(jsonValue) as AboutContent;
      const res = await fetch("/api/admin/about", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...csrfHeader(),
        },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(data.message ?? "Failed to save about content.");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save about content.");
    } finally {
      setSaving(false);
    }
  };

  const normalizeForLocales = () => {
    try {
      const content = JSON.parse(jsonValue) as unknown;
      setJsonValue(JSON.stringify(normalizeAboutPayload(content), null, 2));
    } catch {
      setError("JSON is invalid. Fix syntax before normalizing.");
    }
  };

  return (
    <AdminPageShell
      eyebrow="Brand content"
      title="About and team"
      description="Manage /about story text, stats, team cards, and fleet philosophy copy."
      actions={
        <>
          <Button variant="tertiary" onClick={() => void refresh()}>
            <RefreshCcw className="size-4" aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="tertiary" onClick={normalizeForLocales} disabled={loading}>
            Normalize EN/AR/FR
          </Button>
          <Button onClick={() => void save()} loading={saving} disabled={loading}>
            Save
          </Button>
        </>
      }
    >
      {error ? <p className="body-md text-danger mb-4">{error}</p> : null}
      <section className="bg-paper border-border rounded-xl border p-5">
        <h2 className="headline-sm text-ink-100">About JSON</h2>
        <p className="body-sm text-ink-60 mt-2">
          Edit story paragraphs, pull quote, fleet philosophy, team intro, and full team profiles.
        </p>
        <textarea
          className="border-border mt-4 min-h-[620px] w-full rounded-xl border p-3 font-mono text-xs"
          value={jsonValue}
          onChange={(e) => setJsonValue(e.target.value)}
          spellCheck={false}
        />
      </section>
    </AdminPageShell>
  );
}

function asLocalizedString(value: unknown): LocalizedString {
  if (typeof value === "string") return { en: value, ar: "", fr: "" };
  if (!value || typeof value !== "object") return { en: "", ar: "", fr: "" };
  const obj = value as Record<string, unknown>;
  return {
    en: typeof obj.en === "string" ? obj.en : "",
    ar: typeof obj.ar === "string" ? obj.ar : "",
    fr: typeof obj.fr === "string" ? obj.fr : "",
  };
}

function asLocalizedArray(value: unknown): LocalizedStringArray {
  const toArray = (input: unknown): string[] =>
    Array.isArray(input) ? input.filter((item): item is string => typeof item === "string") : [];
  if (Array.isArray(value)) return { en: toArray(value), ar: [], fr: [] };
  if (!value || typeof value !== "object") return { en: [], ar: [], fr: [] };
  const obj = value as Record<string, unknown>;
  return {
    en: toArray(obj.en),
    ar: toArray(obj.ar),
    fr: toArray(obj.fr),
  };
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
        quote: row.quote === undefined ? undefined : asLocalizedString(row.quote),
        bio: asLocalizedString(row.bio),
        highlights: asLocalizedArray(row.highlights),
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
