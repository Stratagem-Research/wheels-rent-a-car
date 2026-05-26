"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Chip } from "@/components/ui/Chip";

/**
 * HeroSearchTabs — pill-chip tab row sitting directly above the hero search
 * card (DESIGN.md, landingpage.md §1.1).
 *
 * Phase 1 scope ships **two tabs**:
 *   - `cars`       (default, drives the search bar below)
 *   - `long-term`  (routes to /long-term — replaces the search bar there)
 *
 * Chauffeur + Airport-transfer tabs are intentionally dropped — both backing
 * routes were descoped in Phase 1. The component is structured so adding
 * more tabs later is a single line, without breaking the layout.
 */

const TABS = [
  { id: "cars", label: "Cars" },
  { id: "long-term", label: "Long-term" },
] as const;

export type HeroSearchTabId = (typeof TABS)[number]["id"];

export interface HeroSearchTabsProps {
  value?: HeroSearchTabId;
  onChange?: (next: HeroSearchTabId) => void;
  /** Render the tabs against a dark surface (inverse chips). */
  inverse?: boolean;
  className?: string;
}

export function HeroSearchTabs({
  value = "cars",
  onChange,
  inverse = false,
  className,
}: HeroSearchTabsProps) {
  const router = useRouter();

  return (
    <div
      role="tablist"
      aria-label="Search options"
      className={["flex flex-wrap items-center gap-2", className ?? ""].join(" ")}
    >
      {TABS.map((tab) => {
        const selected = value === tab.id;
        const variant = inverse
          ? selected
            ? "inverse-selected"
            : "inverse"
          : selected
            ? "selected"
            : "default";

        return (
          <Chip
            key={tab.id}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            variant={variant}
            onClick={() => {
              // Long-term is a route, not a tab state — jump to /long-term.
              if (tab.id === "long-term") {
                router.push("/long-term");
                return;
              }
              onChange?.(tab.id);
            }}
          >
            {tab.label}
          </Chip>
        );
      })}
    </div>
  );
}
