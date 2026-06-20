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

/** Loading, error, save/reload toolbar, and list body for admin replace-on-save editors. */
export function AdminReplaceListEditor<T>({
  editor,
  loadingMessage,
  saveLabel,
  children,
}: AdminReplaceListEditorProps<T>) {
  const { loading, saving, dirty, error, load, save, items, update, remove, append } = editor;

  if (loading) return <p className="body-md text-ink-60">{loadingMessage}</p>;

  return (
    <div className="flex flex-col gap-4">
      {error ? <p className="body-md text-danger">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => void save()} loading={saving} disabled={!dirty}>
          {dirty ? saveLabel : "Saved"}
        </Button>
        <Button variant="tertiary" onClick={() => void load()} disabled={saving}>
          Reload
        </Button>
      </div>
      {children({ items, update, remove, append })}
    </div>
  );
}
