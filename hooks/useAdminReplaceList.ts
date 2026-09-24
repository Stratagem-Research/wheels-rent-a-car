"use client";

import * as React from "react";
import { toast } from "@/components/ui/Toast";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";

export type UseAdminReplaceListOptions<T> = {
  fetch: () => Promise<T[]>;
  write: (items: T[]) => Promise<void>;
  loadError?: string;
  saveError?: string;
  /** Toast shown on a successful save. Defaults to a generic "Saved." */
  saveSuccess?: string;
  beforeSave?: (items: T[]) => T[];
};

export type AdminReplaceListControls<T> = {
  items: T[];
  loading: boolean;
  saving: boolean;
  dirty: boolean;
  load: () => Promise<void>;
  save: () => Promise<void>;
  update: (index: number, patch: Partial<T>) => void;
  remove: (index: number, confirmMessage: string) => void;
  append: (item: T) => void;
};

export function useAdminReplaceList<T>({
  fetch,
  write,
  loadError = "Failed to load.",
  saveError = "Failed to save.",
  saveSuccess = "Saved.",
  beforeSave,
}: UseAdminReplaceListOptions<T>): AdminReplaceListControls<T> {
  const [items, setItems] = React.useState<T[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  useUnsavedChangesGuard(dirty);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      setItems(await fetch());
      setDirty(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : loadError);
    } finally {
      setLoading(false);
    }
  }, [fetch, loadError]);

  React.useEffect(() => {
    // `load` sets `loading` back to `true` as its first statement (already the
    // initial state) before awaiting the fetch — an idempotent, intentional
    // fetch-on-mount, not a cascading-render risk.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const update = React.useCallback((index: number, patch: Partial<T>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
    setDirty(true);
  }, []);

  const remove = React.useCallback((index: number, confirmMessage: string) => {
    if (!confirm(confirmMessage)) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
    setDirty(true);
  }, []);

  const append = React.useCallback((item: T) => {
    setItems((prev) => [...prev, item]);
    setDirty(true);
  }, []);

  const save = React.useCallback(async () => {
    setSaving(true);
    try {
      const payload = beforeSave ? beforeSave(items) : items;
      await write(payload);
      setDirty(false);
      await load();
      toast.success(saveSuccess);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : saveError);
    } finally {
      setSaving(false);
    }
  }, [beforeSave, items, load, saveError, saveSuccess, write]);

  return {
    items,
    loading,
    saving,
    dirty,
    load,
    save,
    update,
    remove,
    append,
  };
}

/** Trim and drop empty inclusion lines before replace-on-save. */
export function trimInclusions<T extends { inclusions: string[] }>(items: T[]): T[] {
  return items.map((item) => ({
    ...item,
    inclusions: item.inclusions.map((line) => line.trim()).filter(Boolean),
  }));
}
