/**
 * In-app hash anchors without document navigation.
 *
 * Full `path#id` navigations can be intercepted by the MSW service worker in
 * dev and surface as failed passthrough fetches. `replaceState` + scroll keeps
 * shareable URLs without reloading the page.
 */

export function readLocationHash(): string {
  if (typeof window === "undefined") return "";
  return window.location.hash.slice(1);
}

export function isHashInSet(id: string, validIds: ReadonlySet<string>): boolean {
  return id.length > 0 && validIds.has(id);
}

export function hashFromSet(validIds: ReadonlySet<string>): string {
  const id = readLocationHash();
  return isHashInSet(id, validIds) ? id : "";
}

export function replaceLocationHash(id: string): void {
  if (typeof window === "undefined") return;
  const base = `${window.location.pathname}${window.location.search}`;
  const previous = window.location.hash;
  const url = id ? `${base}#${id}` : base;
  window.history.replaceState(null, "", url);
  const next = id ? `#${id}` : "";
  if (previous !== next) {
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }
}

export function scrollToHashTarget(
  id: string,
  options?: { behavior?: ScrollBehavior; block?: ScrollLogicalPosition },
): void {
  if (!id || typeof document === "undefined") return;
  const el = document.getElementById(id);
  if (!el || typeof el.scrollIntoView !== "function") return;
  el.scrollIntoView({
    behavior: options?.behavior ?? "smooth",
    block: options?.block ?? "start",
  });
}
