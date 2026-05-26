"use client";

import * as React from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { FaqEntry } from "@/types/domain";

/**
 * Help-desk centred search bar per 10_help_faq.md §2.
 *
 * Queries the mocked /api/help/search endpoint. Renders a card list of
 * matching FAQ entries below the search input on submit. Empty-state
 * surfaces the WhatsApp fallback.
 */
export function HelpSearchBar({ className }: { className?: string }) {
  const [query, setQuery] = React.useState("");
  const [results, setResults] = React.useState<FaqEntry[] | null>(null);
  const [loading, setLoading] = React.useState(false);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await api.get<{ items: FaqEntry[] }>(
        `${endpoints.helpSearch}?q=${encodeURIComponent(query.trim())}`,
      );
      setResults(res.items);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <form onSubmit={onSearch} className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an answer…"
          startAdornment={<Search className="size-4" aria-hidden="true" />}
          aria-label="Search help articles"
        />
        <Button type="submit" variant="primary" size="md" loading={loading}>
          Search
        </Button>
      </form>

      {results !== null ? (
        results.length === 0 ? (
          <div className="bg-surface border-border flex flex-col items-center gap-2 rounded-lg border p-6 text-center">
            <span aria-hidden="true" className="text-3xl">
              🤔
            </span>
            <h3 className="headline-xs text-ink-95">No matches.</h3>
            <p className="body-sm text-ink-60">
              Try different keywords or chat with us on WhatsApp.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {results.map((entry) => (
              <li key={entry.id}>
                <Link
                  href={`/help/faq#${entry.id}`}
                  className="bg-surface border-border hover:border-ink-100 flex flex-col gap-1 rounded-lg border p-4 transition-colors"
                >
                  <span className="headline-xs text-ink-95">{entry.question}</span>
                  <span className="body-sm text-ink-60 line-clamp-2">{entry.answer}</span>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
