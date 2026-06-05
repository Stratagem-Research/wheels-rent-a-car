"use client";

import * as React from "react";
import Link from "next/link";
import { Building2, HelpCircle, MapPinned } from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { useCorporateTiers, useFaqs, useItineraries, useTrips } from "@/lib/admin/useAdminStore";

/** /admin — dashboard with live counts from Supabase CMS API. */
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
      body: "Trip articles on the homepage Explore Lebanon carousel and /trips.",
    },
    {
      href: "/admin/itineraries",
      icon: <MapPinned className="size-5" aria-hidden="true" />,
      eyebrow: "Chauffeur tours",
      title: "Itineraries",
      count: `${itineraries.length} ${itineraries.length === 1 ? "itinerary" : "itineraries"}`,
      body: "Chauffeur itineraries on /chauffeur and /itineraries.",
    },
    {
      href: "/admin/faqs",
      icon: <HelpCircle className="size-5" aria-hidden="true" />,
      eyebrow: "Help centre",
      title: "FAQs",
      count: `${faqs.length} sections · ${totalFaqQuestions} questions`,
      body: "FAQ sections and questions on /help/faq.",
    },
    {
      href: "/admin/corporate",
      icon: <Building2 className="size-5" aria-hidden="true" />,
      eyebrow: "B2B",
      title: "Corporate",
      count: `${corporate.length} ${corporate.length === 1 ? "tier" : "tiers"}`,
      body: "Tier comparison and inclusions on /corporate.",
    },
  ];

  return (
    <AdminPageShell
      eyebrow="Welcome"
      title="What would you like to manage?"
      description="Edits save to the website Supabase database and appear on the customer-facing site."
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
    </AdminPageShell>
  );
}
