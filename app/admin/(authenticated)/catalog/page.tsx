"use client";

import * as React from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { Chip } from "@/components/ui/Chip";
import { AddonsEditor } from "./_components/AddonsEditor";
import { LongTermTiersEditor } from "./_components/LongTermTiersEditor";
import { ProtectionTiersEditor } from "./_components/ProtectionTiersEditor";

type Tab = "addons" | "protection" | "long-term";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "addons", label: "Add-ons", hint: "Booking step 2 — /book/extras" },
  { id: "protection", label: "Protection", hint: "Booking step 3 — /book/protection" },
  { id: "long-term", label: "Long-term", hint: "Marketing — /long-term tier cards" },
];

/** /admin/catalog — booking catalog (add-ons, protection, long-term tiers). */
export default function AdminCatalogPage() {
  const [tab, setTab] = React.useState<Tab>("addons");
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <AdminPageShell
      eyebrow="Booking catalog"
      title="Catalog"
      description="Add-ons, protection tiers, and long-term pricing shown in the booking funnel and on /long-term."
    >
      <div className="mb-6 flex flex-col gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Catalog sections">
          {TABS.map((t) => (
            <Chip
              key={t.id}
              role="tab"
              aria-selected={tab === t.id}
              variant={tab === t.id ? "selected" : "default"}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Chip>
          ))}
        </div>
        <p className="body-sm text-ink-60">{active.hint}</p>
      </div>
      {tab === "addons" ? <AddonsEditor /> : null}
      {tab === "protection" ? <ProtectionTiersEditor /> : null}
      {tab === "long-term" ? <LongTermTiersEditor /> : null}
    </AdminPageShell>
  );
}
