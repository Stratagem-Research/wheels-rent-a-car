"use client";

import { ItineraryForm } from "@/components/admin/ItineraryForm";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export default function NewItineraryPage() {
  return (
    <AdminPageShell
      backHref="/admin/itineraries"
      backLabel="All itineraries"
      eyebrow="Chauffeur tours"
      title="New itinerary"
      description="Add a chauffeur-led itinerary. It appears on /chauffeur and /itineraries immediately after save."
    >
      <ItineraryForm />
    </AdminPageShell>
  );
}
