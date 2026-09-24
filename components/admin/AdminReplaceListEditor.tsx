"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import type { AdminReplaceListControls } from "@/hooks/useAdminReplaceList";

type AdminReplaceListEditorProps<T> = {
  editor: AdminReplaceListControls<T>;
  loadingMessage: string;
  saveLabel: string;
  children: (ctx: Pick<AdminReplaceListControls<T>, "items" | "update" | "remove" | "append">) =>
    React.ReactNode;
};

/**
 * Reload toolbar for an admin replace-on-save editor. Rendered by the page
 * (typically in `AdminPageShell`'s `actions` slot, next to the title) rather
 * than by `AdminReplaceListEditor` itself, so it sits beside the page title
 * instead of above the item list.
 *
 * Save lives per-card instead of here — each card's own Save button (see
 * each editor component) calls the same `editor.save()`.
 */
export function AdminReplaceListToolbar<T>({ editor }: { editor: AdminReplaceListControls<T> }) {
  const { saving, load } = editor;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="tertiary" onClick={() => void load()} disabled={saving}>
        Reload
      </Button>
    </div>
  );
}

/**
 * Loading and list body for admin replace-on-save editors. Load/save
 * failures surface as toasts from `useAdminReplaceList` itself, not here.
 */
export function AdminReplaceListEditor<T>({
  editor,
  loadingMessage,
  children,
}: Omit<AdminReplaceListEditorProps<T>, "saveLabel">) {
  const { loading, items, update, remove, append } = editor;

  if (loading) return <p className="body-md text-ink-60">{loadingMessage}</p>;

  return (
    <div className="flex flex-col gap-4">{children({ items, update, remove, append })}</div>
  );
}
