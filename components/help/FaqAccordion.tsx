"use client";

import * as React from "react";
import { useLocale } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/Accordion";
import { hashFromSet, replaceLocationHash, scrollToHashTarget } from "@/lib/navigation/hashAnchor";
import { getLocalizedString } from "@/lib/i18n/localized";
import type { LocalizedStringValue } from "@/types/domain";

type FaqAccordionEntry = {
  id: string;
  question: LocalizedStringValue;
  answer: LocalizedStringValue;
};

/**
 * Topic-grouped FAQ accordion per 10_help_faq.md §3.
 *
 * Controlled from the first paint (`value=""` when collapsed) so Radix never
 * flips between uncontrolled and controlled. Hash deep-links use replaceState
 * to avoid a redundant route navigation.
 */

export function FaqAccordion({
  entries,
  locale,
}: {
  entries: FaqAccordionEntry[];
  locale?: string;
}) {
  const activeLocale = useLocale();
  const resolvedLocale = locale ?? activeLocale;
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
            <AccordionTrigger>{getLocalizedString(entry.question, resolvedLocale)}</AccordionTrigger>
            <AccordionContent>{getLocalizedString(entry.answer, resolvedLocale)}</AccordionContent>
          </AccordionItem>
        </div>
      ))}
    </Accordion>
  );
}
