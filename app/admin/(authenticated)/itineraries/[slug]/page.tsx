"use client";

import { use } from "react";
import { ItineraryForm } from "@/components/admin/ItineraryForm";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EditItineraryPage({ params }: PageProps) {
  const { slug } = use(params);
  return (
    <AdminPageShell
      backHref="/admin/itineraries"
      backLabel="All itineraries"
      eyebrow="Chauffeur tours"
      title="Edit itinerary"
      description="Update this itinerary. Save to push the changes live on /chauffeur and /itineraries."
    >
      <ItineraryForm slug={slug} />
    </AdminPageShell>
  );
}
