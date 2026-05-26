"use client";

import Link from "next/link";
import { Building2, HelpCircle, MapPinned } from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { useCorporateTiers, useFaqs, useItineraries, useTrips } from "@/lib/admin/useAdminStore";

/**
 * /admin — dashboard. Four quick-action tiles linking to each CRUD
 * surface, with live counts pulled from the admin store.
 */
export default function AdminDashboardPage() {
  const trips = useTrips();
  const itineraries = useItineraries();
  const faqs = useFaqs();
  const corporate = useCorporateTiers();

  const totalFaqQuestions = faqs.reduce((sum, g) => sum + g.entries.length, 0);

  const tiles = [
    {
      href: "/admin/trips",
      icon: <MapPinned className="size-5" aria-hidden="true" />,
      eyebrow: "Self-drive blog",
      title: "Trips",
      count: `${trips.length} ${trips.length === 1 ? "article" : "articles"}`,
      body: "Create and edit the trip articles that appear in Explore Lebanon and /trips.",
    },
    {
      href: "/admin/itineraries",
      icon: <MapPinned className="size-5" aria-hidden="true" />,
      eyebrow: "Chauffeur tours",
      title: "Itineraries",
      count: `${itineraries.length} ${itineraries.length === 1 ? "itinerary" : "itineraries"}`,
      body: "Manage chauffeur-led itineraries shown on /chauffeur and /itineraries.",
    },
    {
      href: "/admin/faqs",
      icon: <HelpCircle className="size-5" aria-hidden="true" />,
      eyebrow: "Help centre",
      title: "FAQs",
      count: `${faqs.length} sections · ${totalFaqQuestions} questions`,
      body: "Maintain FAQ sections + questions used across /help and the homepage.",
    },
    {
      href: "/admin/corporate",
      icon: <Building2 className="size-5" aria-hidden="true" />,
      eyebrow: "B2B",
      title: "Corporate",
      count: `${corporate.length} ${corporate.length === 1 ? "tier" : "tiers"}`,
      body: "Tier comparison, inclusions, and tagline content on /corporate.",
    },
  ];

  return (
    <AdminPageShell
      eyebrow="Welcome"
      title="What would you like to manage?"
      description="Add, edit, or remove the content that appears on the customer-facing site. Changes save instantly and reflect on the live pages."
    >
      <ul className="grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-2">
        {tiles.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="bg-paper border-border hover:border-ink-100 group flex h-full flex-col gap-3 rounded-xl border p-6 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="bg-ink-10 text-ink-100 inline-flex size-10 items-center justify-center rounded-md">
                  {t.icon}
                </span>
                <span className="label-md text-ink-60">{t.count}</span>
              </div>
              <p className="text-ink-50 overline">{t.eyebrow}</p>
              <h2 className="headline-md text-ink-100">{t.title}</h2>
              <p className="body-sm text-ink-60">{t.body}</p>
            </Link>
          </li>
        ))}
      </ul>

      <div className="bg-paper border-border mt-10 flex flex-col gap-2 rounded-xl border p-6">
        <h2 className="headline-sm text-ink-100">Demo notes</h2>
        <p className="body-sm text-ink-60">
          Edits persist in your browser&apos;s local storage, not a real backend yet. Clearing
          browser data resets everything to the seeded defaults. The credentials, gate, and
          storage layer are all designed for staging only — the swap-in path to the real backend
          lives in <code className="mono-md">lib/admin/store.ts</code> and{" "}
          <code className="mono-md">lib/admin/auth.ts</code>.
        </p>
      </div>
    </AdminPageShell>
  );
}
