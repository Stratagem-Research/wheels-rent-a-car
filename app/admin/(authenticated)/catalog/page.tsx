"use client";

import * as React from "react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { AdminReplaceListToolbar } from "@/components/admin/AdminReplaceListEditor";
import { Chip } from "@/components/ui/Chip";
import { trimInclusions, useAdminReplaceList } from "@/hooks/useAdminReplaceList";
import {
  fetchAdminAddons,
  writeAdminAddons,
  fetchAdminProtectionTiers,
  writeAdminProtectionTiers,
  fetchAdminLongTermTiers,
  writeAdminLongTermTiers,
} from "@/lib/admin/catalog-store";
import type { AddOn, LongTermTier, ProtectionTier } from "@/types/domain";
import { AddonsEditor } from "./_components/AddonsEditor";
import { LongTermTiersEditor } from "./_components/LongTermTiersEditor";
import { ProtectionTiersEditor } from "./_components/ProtectionTiersEditor";

type Tab = "addons" | "protection" | "long-term";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "addons", label: "Add-ons", hint: "Booking step 2 — /book/extras" },
  { id: "protection", label: "Protection", hint: "Booking step 3 — /book/protection" },
  { id: "long-term", label: "Long-term", hint: "Marketing — /long-term tier cards" },
];

/**
 * /admin/catalog — booking catalog (add-ons, protection, long-term tiers).
 *
 * Each tab's replace-on-save state is owned here (not inside the tab's own
 * editor component) so its Save/Reload toolbar can render in the page
 * title row via `AdminPageShell`'s `actions` slot, instead of floating
 * above the item list. All three load on mount regardless of which tab is
 * active — an acceptable tradeoff for 3 small catalogs on a low-traffic
 * admin page, in exchange for a single toolbar-hoisting mechanism.
 */
export default function AdminCatalogPage() {
  const [tab, setTab] = React.useState<Tab>("addons");
  const active = TABS.find((t) => t.id === tab)!;

  const addOns = useAdminReplaceList<AddOn>({
    fetch: fetchAdminAddons,
    write: writeAdminAddons,
    loadError: "Failed to load add-ons.",
    saveError: "Failed to save add-ons.",
  });
  const protectionTiers = useAdminReplaceList<ProtectionTier>({
    fetch: fetchAdminProtectionTiers,
    write: writeAdminProtectionTiers,
    loadError: "Failed to load protection tiers.",
    saveError: "Failed to save protection tiers.",
    beforeSave: trimInclusions,
  });
  const longTermTiers = useAdminReplaceList<LongTermTier>({
    fetch: fetchAdminLongTermTiers,
    write: writeAdminLongTermTiers,
    loadError: "Failed to load long-term tiers.",
    saveError: "Failed to save long-term tiers.",
    beforeSave: trimInclusions,
  });

  const toolbar =
    tab === "addons" ? (
      <AdminReplaceListToolbar editor={addOns} />
    ) : tab === "protection" ? (
      <AdminReplaceListToolbar editor={protectionTiers} />
    ) : (
      <AdminReplaceListToolbar editor={longTermTiers} />
    );

  return (
    <AdminPageShell
      eyebrow="Booking catalog"
      title="Catalog"
      description="Add-ons, protection tiers, and long-term pricing shown in the booking funnel and on /long-term."
      actions={toolbar}
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
      {tab === "addons" ? <AddonsEditor editor={addOns} /> : null}
      {tab === "protection" ? <ProtectionTiersEditor editor={protectionTiers} /> : null}
      {tab === "long-term" ? <LongTermTiersEditor editor={longTermTiers} /> : null}
    </AdminPageShell>
  );
}
