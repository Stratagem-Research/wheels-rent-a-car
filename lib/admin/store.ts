"use client";

/**
 * Admin CMS client — reads/writes via /api/cms/* (Supabase-backed).
 */

import type { CorporateTier, FaqGroup, Itinerary, Trip } from "@/types/domain";
import { notifyCmsUpdated, type CmsResource } from "@/lib/admin/cms-events";
import type { CorporateLead, FleetPartnershipLead } from "@/lib/supabase/admin-repository";

async function cmsGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Failed to load ${path}`);
  }
  const data = (await res.json()) as { items?: T };
  if (!Array.isArray(data.items)) {
    throw new Error(`Invalid response from ${path}`);
  }
  return data.items;
}

async function cmsPut<T>(path: string, items: T[], resource: CmsResource): Promise<void> {
  const csrf = getAdminCsrfToken();
  const res = await fetch(path, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "x-admin-csrf": csrf } : {}),
    },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Save failed.");
  }
  notifyCmsUpdated(resource);
}

function getAdminCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return null;
  return decodeURIComponent(match[1] ?? "");
}

export async function fetchTrips(): Promise<Trip[]> {
  return cmsGet<Trip[]>("/api/cms/trips");
}

export async function writeTrips(items: Trip[]): Promise<void> {
  await cmsPut("/api/cms/trips", items, "trips");
}

export async function fetchItineraries(): Promise<Itinerary[]> {
  return cmsGet<Itinerary[]>("/api/cms/itineraries");
}

export async function writeItineraries(items: Itinerary[]): Promise<void> {
  await cmsPut("/api/cms/itineraries", items, "itineraries");
}

export async function fetchFaqs(): Promise<FaqGroup[]> {
  return cmsGet<FaqGroup[]>("/api/cms/faqs");
}

export async function writeFaqs(items: FaqGroup[]): Promise<void> {
  await cmsPut("/api/cms/faqs", items, "faqs");
}

export async function fetchCorporateTiers(): Promise<CorporateTier[]> {
  return cmsGet<CorporateTier[]>("/api/cms/corporate");
}

export async function writeCorporateTiers(items: CorporateTier[]): Promise<void> {
  await cmsPut("/api/cms/corporate", items, "corporate");
}

export type AdminLeadsResponse = {
  counters: {
    total: number;
    new: number;
    inProgress: number;
    won: number;
    lost: number;
  };
  corporate: CorporateLead[];
  fleetPartnership: FleetPartnershipLead[];
};

export async function fetchAdminLeads(): Promise<AdminLeadsResponse> {
  const res = await fetch("/api/admin/leads", { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Failed to load admin leads.");
  }
  return (await res.json()) as AdminLeadsResponse;
}

export async function updateAdminLeadStatus(input: {
  id: string;
  kind: "long-term" | "corporate" | "chauffeur" | "car-wash" | "fleet-partnership";
  status: "new" | "in-progress" | "won" | "lost";
  owner?: string;
  adminNotes?: string;
}): Promise<void> {
  const csrf = getAdminCsrfToken();
  const res = await fetch("/api/admin/leads", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(csrf ? { "x-admin-csrf": csrf } : {}),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Failed to update lead status.");
  }
}
