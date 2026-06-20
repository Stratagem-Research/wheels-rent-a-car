"use client";

import * as React from "react";
import Link from "next/link";
import {
  Building2,
  HelpCircle,
  Info,
  MapPinned,
  Megaphone,
  Package,
  Route,
  Settings2,
  Star,
  Users,
} from "lucide-react";
import { AdminPageShell } from "@/components/admin/AdminPageShell";
import { fetchAdminLeads } from "@/lib/admin/store";
import { useCorporateTiers, useFaqs, useItineraries, useTrips } from "@/lib/admin/useAdminStore";

/** /admin — dashboard with live counts from Supabase CMS API. */
export default function AdminDashboardPage() {
  const trips = useTrips();
  const itineraries = useItineraries();
  const faqs = useFaqs();
  const corporate = useCorporateTiers();
  const [leadCounts, setLeadCounts] = React.useState({ total: 0, new: 0 });

  React.useEffect(() => {
    let cancelled = false;
    fetchAdminLeads()
      .then((result) => {
        if (!cancelled) setLeadCounts({ total: result.counters.total, new: result.counters.new });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

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
    {
      href: "/admin/about",
      icon: <Info className="size-5" aria-hidden="true" />,
      eyebrow: "Brand",
      title: "About",
      count: "Story + team",
      body: "About story, team cards, and fleet philosophy copy.",
    },
    {
      href: "/admin/leads",
      icon: <Users className="size-5" aria-hidden="true" />,
      eyebrow: "Pipeline",
      title: "Leads",
      count: `${leadCounts.total} total · ${leadCounts.new} new`,
      body: "Long-term, corporate, and chauffeur enquiries.",
    },
    {
      href: "/admin/fleet",
      icon: <Route className="size-5" aria-hidden="true" />,
      eyebrow: "Catalog",
      title: "Fleet",
      count: "Metadata + map",
      body: "Vehicle metadata and frontend-to-Wizard ID mapping.",
    },
    {
      href: "/admin/locations",
      icon: <MapPinned className="size-5" aria-hidden="true" />,
      eyebrow: "Content",
      title: "Locations",
      count: "Branch records",
      body: "Branch profile data used by /locations and search.",
    },
    {
      href: "/admin/promotions",
      icon: <Megaphone className="size-5" aria-hidden="true" />,
      eyebrow: "Marketing",
      title: "Promotions",
      count: "Campaigns",
      body: "Promo strip copy, links, active windows, and toggles.",
    },
    {
      href: "/admin/catalog",
      icon: <Package className="size-5" aria-hidden="true" />,
      eyebrow: "Booking",
      title: "Catalog",
      count: "Add-ons · protection · long-term",
      body: "Extras, protection tiers, and long-term pricing for the booking funnel.",
    },
    {
      href: "/admin/reviews",
      icon: <Star className="size-5" aria-hidden="true" />,
      eyebrow: "Marketing",
      title: "Reviews",
      count: "Homepage marquee",
      body: "Google and Trustpilot quotes on the landing page.",
    },
    {
      href: "/admin/ops",
      icon: <Settings2 className="size-5" aria-hidden="true" />,
      eyebrow: "Operations",
      title: "Ops",
      count: "Read-only monitors",
      body: "Payments, booking timeline, notifications, and retry tooling.",
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
