"use client";

import * as React from "react";
import { RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

type AboutContent = {
  storyParagraphs: string[];
  pullQuote: string;
  fleetPhilosophy: {
    heading: string;
    paragraphs: string[];
  };
  stats: Array<{ value: string; label: string }>;
  teamIntro: string;
  teamDedication: string;
  team: Array<{
    name: string;
    role: string;
    photo: string;
    quote?: string;
    bio: string;
    highlights?: string[];
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
          className="border-border font-mono mt-4 min-h-[620px] w-full rounded-xl border p-3 text-xs"
          value={jsonValue}
          onChange={(e) => setJsonValue(e.target.value)}
          spellCheck={false}
        />
      </section>
    </AdminPageShell>
  );
}

function csrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return {};
  return { "x-admin-csrf": decodeURIComponent(match[1] ?? "") };
}
