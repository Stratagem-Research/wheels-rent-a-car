"use client";

import * as React from "react";
import { HashLink } from "@/components/ui/HashLink";
import { readLocationHash } from "@/lib/navigation/hashAnchor";
import { cn } from "@/lib/utils";

export interface TocEntry {
  id: string;
  label: string;
}

/**
 * Sticky table of contents for long-form articles per 10_help_faq.md §6.
 *
 * Active section is detected via IntersectionObserver so the link
 * highlights as the user scrolls past matching <h2 id="..." /> targets.
 * TOC clicks use HashLink to avoid MSW intercepting `path#section` fetches.
 */
export function TocSidebar({ entries, className }: { entries: TocEntry[]; className?: string }) {
  const [activeId, setActiveId] = React.useState<string | null>(entries[0]?.id ?? null);

  // Pull the active section from the URL hash on mount. Synchronising
  // React state with a browser-only source (location.hash) is exactly
  // what an effect is for; the lint exception is intentional.
  /* eslint-disable react-hooks/set-state-in-effect */
  React.useEffect(() => {
    const fromHash = readLocationHash();
    if (fromHash && entries.some((e) => e.id === fromHash)) {
      setActiveId(fromHash);
    }
  }, [entries]);
  /* eslint-enable react-hooks/set-state-in-effect */

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const headings = entries
      .map((e) => document.getElementById(e.id))
      .filter((el): el is HTMLElement => el !== null);
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((r) => r.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length === 0) return;
        const id = visible[0]?.target?.id;
        if (id) setActiveId(id);
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [entries]);

  return (
    <nav aria-label="On this page" className={cn("flex flex-col gap-1", className)}>
      <span className="text-ink-50 mb-3 overline">On this page</span>
      <ol className="flex flex-col gap-1">
        {entries.map((entry) => (
          <li key={entry.id}>
            <HashLink
              targetId={entry.id}
              scrollBlock="start"
              aria-current={activeId === entry.id ? "true" : undefined}
              onClick={() => setActiveId(entry.id)}
              className={cn(
                "label-md rounded-pill block px-3.5 py-2 transition-colors",
                "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                activeId === entry.id
                  ? "bg-ink-100 text-paper"
                  : "hover:bg-ink-10 hover:text-ink-100 text-ink-60",
              )}
            >
              {entry.label}
            </HashLink>
          </li>
        ))}
      </ol>
    </nav>
  );
}
