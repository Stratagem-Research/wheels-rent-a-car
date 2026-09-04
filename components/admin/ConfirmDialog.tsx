"use client";

import * as React from "react";
import { Button } from "@/components/ui/Button";
import { Modal, ModalContent, ModalDescription, ModalFooter, ModalTitle } from "@/components/ui/Modal";
import { cn } from "@/lib/utils";

/**
 * Admin-wide replacement for `window.confirm`. Mount `<ConfirmDialogProvider>`
 * once (admin authenticated layout) and call `useConfirmDialog()` anywhere
 * below it — same "ask, then act" shape as `confirm()`, but resolves a
 * Promise<boolean> from a proper modal instead of the native browser dialog.
 */

export interface ConfirmOptions {
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders the confirm button in the destructive (red) style. Default true. */
  danger?: boolean;
}

type PendingConfirm = ConfirmOptions & { resolve: (value: boolean) => void };

const ConfirmDialogContext = React.createContext<
  ((options: ConfirmOptions | string) => Promise<boolean>) | null
>(null);

export function ConfirmDialogProvider({ children }: { children: React.ReactNode }) {
  const [pending, setPending] = React.useState<PendingConfirm | null>(null);

  const confirmDialog = React.useCallback((options: ConfirmOptions | string) => {
    const normalized: ConfirmOptions =
      typeof options === "string" ? { title: options } : options;
    return new Promise<boolean>((resolve) => {
      setPending({ ...normalized, resolve });
    });
  }, []);

  const settle = (value: boolean) => {
    pending?.resolve(value);
    setPending(null);
  };

  return (
    <ConfirmDialogContext.Provider value={confirmDialog}>
      {children}
      <Modal open={pending != null} onOpenChange={(open) => !open && settle(false)}>
        <ModalContent size="sm">
          {pending ? (
            <>
              <ModalTitle>{pending.title}</ModalTitle>
              {pending.description ? (
                <ModalDescription>{pending.description}</ModalDescription>
              ) : null}
              <ModalFooter>
                <Button type="button" variant="secondary" size="md" onClick={() => settle(false)}>
                  {pending.cancelLabel ?? "Cancel"}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className={cn(
                    pending.danger !== false &&
                      "bg-signal-red hover:bg-signal-red-hover active:bg-signal-red-press disabled:bg-ink-15 disabled:text-ink-50",
                  )}
                  onClick={() => settle(true)}
                >
                  {pending.confirmLabel ?? "Confirm"}
                </Button>
              </ModalFooter>
            </>
          ) : null}
        </ModalContent>
      </Modal>
    </ConfirmDialogContext.Provider>
  );
}

/** Returns an async replacement for `window.confirm`: `if (!(await confirmDialog("..."))) return;` */
export function useConfirmDialog() {
  const confirmDialog = React.useContext(ConfirmDialogContext);
  if (!confirmDialog) {
    throw new Error("useConfirmDialog must be used within a ConfirmDialogProvider.");
  }
  return confirmDialog;
}
