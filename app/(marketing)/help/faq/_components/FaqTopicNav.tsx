"use client";

import { HashLink } from "@/components/ui/HashLink";

export function FaqTopicNav({ topics }: { topics: { id: string; title: string }[] }) {
  return (
    <nav
      aria-label="FAQ topics"
      className="border-border bg-surface/95 sticky top-16 z-20 border-b backdrop-blur"
    >
      <ul className="mx-auto flex max-w-[var(--container-default)] items-center gap-2 overflow-x-auto px-5 py-3 sm:px-10">
        {topics.map((group) => (
          <li key={group.id} className="shrink-0">
            <HashLink
              targetId={group.id}
              scrollBlock="start"
              className="label-lg rounded-pill bg-ink-10 text-ink-80 hover:bg-signal-blue-bg hover:text-ink-80 focus-visible:outline-ink-100 inline-flex h-9 items-center px-3.5 focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {group.title}
            </HashLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
