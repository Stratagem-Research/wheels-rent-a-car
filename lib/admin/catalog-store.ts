import type { AddOn, CarWashPackage, LongTermTier, ProtectionTier, Review } from "@/types/domain";
import { getAdminCsrfHeader } from "@/lib/admin/csrf";

async function adminGet<T>(path: string): Promise<T[]> {
  const res = await fetch(path, { cache: "no-store" });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? `Failed to load ${path}`);
  }
  const data = (await res.json()) as { items?: T[] };
  if (!Array.isArray(data.items)) throw new Error(`Invalid response from ${path}`);
  return data.items;
}

async function adminPut<T>(path: string, items: T[]): Promise<void> {
  const res = await fetch(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...getAdminCsrfHeader() },
    body: JSON.stringify({ items }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { message?: string };
    throw new Error(data.message ?? "Save failed.");
  }
}

export function fetchAdminAddons(): Promise<AddOn[]> {
  return adminGet<AddOn>("/api/admin/catalog/addons");
}

export function writeAdminAddons(items: AddOn[]): Promise<void> {
  return adminPut("/api/admin/catalog/addons", items);
}

export function fetchAdminProtectionTiers(): Promise<ProtectionTier[]> {
  return adminGet<ProtectionTier>("/api/admin/catalog/protection-tiers");
}

export function writeAdminProtectionTiers(items: ProtectionTier[]): Promise<void> {
  return adminPut("/api/admin/catalog/protection-tiers", items);
}

export function fetchAdminLongTermTiers(): Promise<LongTermTier[]> {
  return adminGet<LongTermTier>("/api/admin/catalog/long-term-tiers");
}

export function writeAdminLongTermTiers(items: LongTermTier[]): Promise<void> {
  return adminPut("/api/admin/catalog/long-term-tiers", items);
}

export function fetchAdminCarWashPackages(): Promise<CarWashPackage[]> {
  return adminGet<CarWashPackage>("/api/admin/catalog/car-wash-packages");
}

export function writeAdminCarWashPackages(items: CarWashPackage[]): Promise<void> {
  return adminPut("/api/admin/catalog/car-wash-packages", items);
}

export function fetchAdminReviews(): Promise<Review[]> {
  return adminGet<Review>("/api/admin/reviews");
}

export function writeAdminReviews(items: Review[]): Promise<void> {
  return adminPut("/api/admin/reviews", items);
}
