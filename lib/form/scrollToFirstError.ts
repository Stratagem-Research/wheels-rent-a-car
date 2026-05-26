"use client";

/**
 * On submit failure, scroll to the first field flagged with aria-invalid and
 * focus it. RHF's shouldFocusError handles focus, but on long forms the
 * focused element may sit above the fold — this also ensures it's visible.
 */
export function scrollToFirstError(rootElement?: HTMLElement | null) {
  const root = rootElement ?? document;
  const first = root.querySelector<HTMLElement>('[aria-invalid="true"]');
  if (!first) return;
  first.scrollIntoView({ behavior: "smooth", block: "center" });
  if (first instanceof HTMLElement && typeof first.focus === "function") {
    first.focus({ preventScroll: true });
  }
}
