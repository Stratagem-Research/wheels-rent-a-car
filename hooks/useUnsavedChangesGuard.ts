"use client";

import * as React from "react";

/**
 * useUnsavedChangesGuard — single source of truth for the admin portal's
 * "you have unsaved changes" navigation guard.
 *
 * One hook per form. While any form is dirty:
 *   - `beforeunload` prompts on tab close / refresh / hard navigation.
 *   - a capture-phase document click listener prompts on internal `<a>` clicks
 *     (sidebar links, mobile-bar logo, in-page back links) and cancels the
 *     navigation if the user declines. Next.js `<Link>` renders an `<a>` and
 *     dispatches in the bubble phase, so `preventDefault` + `stopPropagation`
 *     in capture stops the client-side push.
 *
 * Programmatic navigation that bypasses `<a>` (e.g. the mobile section
 * `<select>` → `router.push`, or a Cancel button) is not caught here — those
 * entry points should call `confirmUnsavedChanges()` before pushing.
 */

const DEFAULT_MESSAGE =
  "You have unsaved changes that will be lost if you leave this page.";

const activeGuards = new Map<string, string>();
let beforeunloadInstalled = false;
let clickInterceptorInstalled = false;

function onBeforeUnload(event: BeforeUnloadEvent) {
  if (activeGuards.size === 0) return;
  event.preventDefault();
  event.returnValue = DEFAULT_MESSAGE;
}

function isInternalAnchor(anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute("href");
  if (!href) return false;
  if (href.startsWith("#") || href.startsWith("javascript:")) return false;
  if (
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  ) {
    return false;
  }
  return true;
}

function onClickCapture(event: MouseEvent) {
  if (activeGuards.size === 0) return;
  if (event.defaultPrevented) return;
  // New-tab / modified clicks don't discard the current tab's draft.
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target as Element | null;
  if (!target || typeof target.closest !== "function") return;
  const anchor = target.closest("a") as HTMLAnchorElement | null;
  if (!anchor) return;
  if (anchor.target === "_blank") return;
  if (!isInternalAnchor(anchor)) return;
  if (!window.confirm(currentMessage())) {
    event.preventDefault();
    event.stopPropagation();
  }
}

function currentMessage(): string {
  const first = activeGuards.values().next();
  return first.done ? DEFAULT_MESSAGE : first.value;
}

function ensureBeforeunload() {
  if (beforeunloadInstalled || typeof window === "undefined") return;
  beforeunloadInstalled = true;
  window.addEventListener("beforeunload", onBeforeUnload);
}

function ensureClickInterceptor() {
  if (clickInterceptorInstalled || typeof document === "undefined") return;
  clickInterceptorInstalled = true;
  document.addEventListener("click", onClickCapture, true);
}

/** True when any mounted form is currently dirty. */
export function hasUnsavedChanges(): boolean {
  return activeGuards.size > 0;
}

/** Confirm prompt for programmatic navigation entry points (e.g. `<select>`
 *  onChange → `router.push`). Returns `true` when there is nothing to discard
 *  or the user accepts. */
export function confirmUnsavedChanges(): boolean {
  if (activeGuards.size === 0) return true;
  return window.confirm(currentMessage());
}

export function useUnsavedChangesGuard(dirty: boolean, message: string = DEFAULT_MESSAGE) {
  const token = React.useId();

  React.useEffect(() => {
    if (!dirty) return;
    activeGuards.set(token, message);
    ensureBeforeunload();
    ensureClickInterceptor();
    return () => {
      activeGuards.delete(token);
    };
  }, [dirty, token, message]);
}
