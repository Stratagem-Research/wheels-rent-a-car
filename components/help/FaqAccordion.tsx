"use client";

import * as React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { hashFromSet, replaceLocationHash, scrollToHashTarget } from "@/lib/navigation/hashAnchor";
import type { FaqEntry } from "@/types/domain";

/**
 * Topic-grouped FAQ accordion per 10_help_faq.md §3.
 *
 * Controlled from the first paint (`value=""` when collapsed) so Radix never
 * flips between uncontrolled and controlled. Hash deep-links use replaceState
 * instead of document navigation to stay compatible with the MSW worker in dev.
 */

export function FaqAccordion({ entries }: { entries: FaqEntry[] }) {
  const entryIds = React.useMemo(() => new Set(entries.map((e) => e.id)), [entries]);
  const [open, setOpen] = React.useState("");

  React.useEffect(() => {
    const syncFromHash = () => {
      const id = hashFromSet(entryIds);
      setOpen(id);
      if (id) scrollToHashTarget(`acc-${id}`, { block: "start" });
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, [entryIds]);

  const onValueChange = (next: string) => {
    setOpen(next);
    replaceLocationHash(next);
  };

  return (
    <Accordion type="single" collapsible value={open} onValueChange={onValueChange}>
      {entries.map((entry) => (
        <div key={entry.id} id={`acc-${entry.id}`} className="scroll-mt-24">
          <AccordionItem value={entry.id}>
            <AccordionTrigger>{entry.question}</AccordionTrigger>
            <AccordionContent>{entry.answer}</AccordionContent>
          </AccordionItem>
        </div>
      ))}
    </Accordion>
  );
}
