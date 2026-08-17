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
 * Save/Reload toolbar for an admin replace-on-save editor. Rendered by the
 * page (typically in `AdminPageShell`'s `actions` slot, next to the title)
 * rather than by `AdminReplaceListEditor` itself, so the buttons can sit
 * beside the page title instead of above the item list.
 */
export function AdminReplaceListToolbar<T>({
  editor,
  saveLabel,
}: {
  editor: AdminReplaceListControls<T>;
  saveLabel: string;
}) {
  const { saving, dirty, load, save } = editor;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="tertiary" onClick={() => void load()} disabled={saving}>
        Reload
      </Button>
      <Button variant="primary" onClick={() => void save()} loading={saving} disabled={!dirty}>
        {dirty ? saveLabel : "Saved"}
      </Button>
    </div>
  );
}

/** Loading, error, and list body for admin replace-on-save editors. */
export function AdminReplaceListEditor<T>({
  editor,
  loadingMessage,
  children,
}: Omit<AdminReplaceListEditorProps<T>, "saveLabel">) {
  const { loading, error, items, update, remove, append } = editor;

  if (loading) return <p className="body-md text-ink-60">{loadingMessage}</p>;

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="body-md text-danger">{error}</p> : null}
      {children({ items, update, remove, append })}
    </div>
  );
}
