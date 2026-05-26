"use client";

import { TripForm } from "@/components/admin/TripForm";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

export default function NewTripPage() {
  return (
    <AdminPageShell
      backHref="/admin/trips"
      backLabel="All trips"
      eyebrow="Self-drive blog"
      title="New trip"
      description="Add a self-drive trip article. It appears on the homepage Explore Lebanon carousel and the /trips listing immediately after save."
    >
      <TripForm />
    </AdminPageShell>
  );
}
