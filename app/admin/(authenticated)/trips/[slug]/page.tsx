"use client";

import { use } from "react";
import { TripForm } from "@/components/admin/TripForm";
import { AdminPageShell } from "@/components/admin/AdminPageShell";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function EditTripPage({ params }: PageProps) {
  const { slug } = use(params);
  return (
    <AdminPageShell
      backHref="/admin/trips"
      backLabel="All trips"
      eyebrow="Self-drive blog"
      title="Edit trip"
      description="Update this article. Save to push the changes live on the homepage and /trips."
    >
      <TripForm slug={slug} />
    </AdminPageShell>
  );
}
