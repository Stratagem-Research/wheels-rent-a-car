"use client";

import * as React from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminFormShell } from "@/components/admin/AdminFormShell";
import { useFaqs } from "@/lib/admin/useAdminStore";
import { writeFaqs } from "@/lib/admin/store";
import type { FaqEntry, FaqGroup } from "@/types/domain";
import { cn } from "@/lib/utils";

/**
 * /admin/faqs — sections + questions editor.
 *
 * Two-pane layout:
 *   left  → list of FAQ sections (FaqGroup[]). Add / rename / delete.
 *   right → questions inside the active section. Add / edit / delete.
 *
 * Mutations persist via `writeFaqs()` (Supabase) and reflect on
 * /help and the page-local accordions where the central store is read.
 */
export default function AdminFaqsPage() {
  const faqs = useFaqs();
  // `explicitId` is what the user clicked; `activeId` falls back to the
  // first section when nothing is explicitly selected. Computing this
  // during render (instead of via an effect) avoids the lint warning and
  // keeps the selection in sync with the live store automatically.
  const [explicitId, setExplicitId] = React.useState<string | null>(null);
  const activeId = explicitId ?? faqs[0]?.id ?? null;
  const setActiveId = setExplicitId;
  const [editingEntry, setEditingEntry] = React.useState<FaqEntry | null>(null);

  const activeGroup = faqs.find((g) => g.id === activeId) ?? null;

  // ── Group mutations ──────────────────────────────────────────────
  const persistFaqs = async (next: FaqGroup[]) => {
    try {
      await writeFaqs(next);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Could not save FAQs.");
    }
  };

  const addGroup = () => {
    const title = prompt("Section title (e.g. 'Insurance', 'Pickup & return')")?.trim();
    if (!title) return;
    const id = `g-${slugify(title)}-${Date.now().toString(36).slice(-4)}`;
    const next: FaqGroup[] = [...faqs, { id, title, entries: [] }];
    void persistFaqs(next);
    setActiveId(id);
  };

  const renameGroup = (id: string) => {
    const current = faqs.find((g) => g.id === id);
    if (!current) return;
    const title = prompt("Rename section", current.title)?.trim();
    if (!title) return;
    void persistFaqs(faqs.map((g) => (g.id === id ? { ...g, title } : g)));
  };

  const deleteGroup = (id: string) => {
    if (!confirm("Delete this section and all its questions?")) return;
    const next = faqs.filter((g) => g.id !== id);
    void persistFaqs(next);
    if (activeId === id) setActiveId(next[0]?.id ?? null);
  };

  // ── Entry mutations ──────────────────────────────────────────────
  const saveEntry = (entry: FaqEntry) => {
    if (!activeGroup) return;
    const exists = activeGroup.entries.findIndex((e) => e.id === entry.id);
    const nextEntries =
      exists >= 0
        ? activeGroup.entries.map((e, idx) => (idx === exists ? entry : e))
        : [...activeGroup.entries, entry];
    const next = faqs.map((g) =>
      g.id === activeGroup.id ? { ...g, entries: nextEntries } : g,
    );
    void persistFaqs(next);
    setEditingEntry(null);
  };

  const deleteEntry = (entryId: string) => {
    if (!activeGroup) return;
    if (!confirm("Delete this question?")) return;
    const next = faqs.map((g) =>
      g.id === activeGroup.id
        ? { ...g, entries: g.entries.filter((e) => e.id !== entryId) }
        : g,
    );
    void persistFaqs(next);
  };

  const newEntry = () => {
    if (!activeGroup) return;
    setEditingEntry({
      id: `f-${activeGroup.id.replace(/^g-/, "")}-${Date.now().toString(36).slice(-4)}`,
      group: activeGroup.id,
      question: "",
      answer: "",
    });
  };

  return (
    <AdminPageShell
      eyebrow="Help centre"
      title="FAQs"
      description="Manage the central FAQ used on /help and around the site. Sections show as topic tiles; questions render as accordion entries."
    >
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sections panel. */}
        <div className="bg-paper border-border flex flex-col gap-2 rounded-xl border p-4">
          <div className="flex items-center justify-between">
            <h2 className="headline-sm text-ink-100">Sections</h2>
            <Button variant="secondary" size="sm" onClick={addGroup}>
              <Plus className="size-4" aria-hidden="true" />
              New
            </Button>
          </div>
          <ul className="flex flex-col gap-1">
            {faqs.map((g) => {
              const active = g.id === activeId;
              return (
                <li key={g.id}>
                  <div
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-3 py-2",
                      active ? "bg-ink-100 text-paper" : "hover:bg-ink-10",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => setActiveId(g.id)}
                      className="label-md flex-1 truncate text-left"
                    >
                      {g.title}{" "}
                      <span className={cn("ml-2", active ? "text-paper/60" : "text-ink-50")}>
                        ({g.entries.length})
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => renameGroup(g.id)}
                      aria-label={`Rename ${g.title}`}
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full",
                        active ? "text-paper/80 hover:bg-white/10" : "text-ink-60 hover:bg-ink-20",
                      )}
                    >
                      <Pencil className="size-3.5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteGroup(g.id)}
                      aria-label={`Delete ${g.title}`}
                      className={cn(
                        "inline-flex size-7 items-center justify-center rounded-full",
                        active ? "text-paper/80 hover:bg-white/10" : "text-ink-60 hover:bg-ink-20",
                      )}
                    >
                      <Trash2 className="size-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
            {faqs.length === 0 ? (
              <li className="body-sm text-ink-60 p-4 text-center">
                No sections yet. Click <strong>New</strong> to add one.
              </li>
            ) : null}
          </ul>
        </div>

        {/* Questions panel. */}
        <div className="bg-paper border-border flex flex-col gap-4 rounded-xl border p-6">
          {activeGroup ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-ink-60 overline">Section</p>
                  <h2 className="headline-md text-ink-100">{activeGroup.title}</h2>
                </div>
                <Button variant="primary" size="sm" onClick={newEntry}>
                  <Plus className="size-4" aria-hidden="true" />
                  New question
                </Button>
              </div>

              {editingEntry ? (
                <FaqEntryEditor
                  entry={editingEntry}
                  onCancel={() => setEditingEntry(null)}
                  onSave={saveEntry}
                />
              ) : null}

              <ul className="flex flex-col gap-3">
                {activeGroup.entries.length === 0 ? (
                  <li className="bg-ink-10 body-sm text-ink-60 rounded-lg p-6 text-center">
                    No questions in this section yet.
                  </li>
                ) : (
                  activeGroup.entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="border-border flex flex-col gap-2 rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="headline-sm text-ink-100">{entry.question}</h3>
                        <div className="flex gap-1">
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => setEditingEntry(entry)}
                            aria-label="Edit"
                          >
                            <Pencil className="size-4" aria-hidden="true" />
                          </Button>
                          <Button
                            variant="tertiary"
                            size="sm"
                            onClick={() => deleteEntry(entry.id)}
                            aria-label="Delete"
                          >
                            <Trash2 className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </div>
                      <p className="body-sm text-ink-70 whitespace-pre-line">{entry.answer}</p>
                    </li>
                  ))
                )}
              </ul>
            </>
          ) : (
            <div className="bg-ink-10 flex flex-col items-center gap-2 rounded-lg p-12 text-center">
              <h2 className="headline-md text-ink-100">No section selected.</h2>
              <p className="body-sm text-ink-60">Add a section on the left to get started.</p>
            </div>
          )}
        </div>
      </div>
    </AdminPageShell>
  );
}

function FaqEntryEditor({
  entry,
  onSave,
  onCancel,
}: {
  entry: FaqEntry;
  onSave: (e: FaqEntry) => void;
  onCancel: () => void;
}) {
  const [question, setQuestion] = React.useState(entry.question);
  const [answer, setAnswer] = React.useState(entry.answer);

  return (
    <AdminFormShell
      title={entry.question ? "Edit question" : "New question"}
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={() => {
              if (!question.trim() || !answer.trim()) return;
              onSave({ ...entry, question: question.trim(), answer: answer.trim() });
            }}
          >
            Save
          </Button>
        </>
      }
    >
      <Field label="Question" required>
        {({ id }) => (
          <Input id={id} value={question} onChange={(e) => setQuestion(e.target.value)} />
        )}
      </Field>
      <Field label="Answer" required>
        {({ id }) => (
          <Textarea id={id} rows={5} value={answer} onChange={(e) => setAnswer(e.target.value)} />
        )}
      </Field>
    </AdminFormShell>
  );
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 30);
}
