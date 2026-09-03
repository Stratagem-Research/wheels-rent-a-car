import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { LocalizedString } from "@/lib/i18n/localized";

export type PageSeoKind = "page" | "vehicle";

export interface PageSeoRow {
  id: string;
  page_key: string;
  label: string;
  kind: PageSeoKind;
  meta_title: LocalizedString | null;
  meta_description: LocalizedString | null;
  og_image_url: string | null;
  canonical_url: string | null;
  noindex: boolean;
  created_at: string;
  updated_at: string;
}

export const VEHICLE_PAGE_KEY_PREFIX = "vehicle:";

/**
 * Keyed by slug, not by inventory unit — every unit of the same
 * brand/model shares one public page at /vehicles/[slug], so they share
 * one page_seo row too.
 */
export function vehiclePageKey(slug: string): string {
  return `${VEHICLE_PAGE_KEY_PREFIX}${slug}`;
}

export async function listAllPageSeo(): Promise<PageSeoRow[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("page_seo")
    .select("*")
    .order("kind")
    .order("label");
  if (error) throw new Error(error.message);
  return (data ?? []) as PageSeoRow[];
}

export async function getPageSeoByKey(pageKey: string): Promise<PageSeoRow | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("page_seo")
    .select("*")
    .eq("page_key", pageKey)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data as PageSeoRow | null) ?? null;
}

export type PageSeoUpsertInput = {
  page_key: string;
  label: string;
  kind: PageSeoKind;
  meta_title?: LocalizedString | null;
  meta_description?: LocalizedString | null;
  og_image_url?: string | null;
  canonical_url?: string | null;
  noindex?: boolean;
};

export async function upsertPageSeo(rows: PageSeoUpsertInput[]): Promise<void> {
  if (rows.length === 0) return;
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("page_seo").upsert(
    rows.map((row) => ({
      page_key: row.page_key,
      label: row.label,
      kind: row.kind,
      meta_title: row.meta_title ?? null,
      meta_description: row.meta_description ?? null,
      og_image_url: row.og_image_url ?? null,
      canonical_url: row.canonical_url ?? null,
      noindex: row.noindex ?? false,
      updated_at: new Date().toISOString(),
    })),
    { onConflict: "page_key" },
  );
  if (error) throw new Error(error.message);
}

export async function deletePageSeoByKeys(pageKeys: string[]): Promise<void> {
  if (pageKeys.length === 0) return;
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("page_seo").delete().in("page_key", pageKeys);
  if (error) throw new Error(error.message);
}

/**
 * Insert a `page_seo` row for each distinct vehicle *slug* that doesn't
 * already have one, so newly added or synced vehicles surface in /admin/seo
 * without an extra step. One row per slug, not per inventory unit — several
 * units of the same brand/model share the one /vehicles/[slug] page. Only
 * touches `label` on existing rows — never overwrites admin-edited
 * meta_title/meta_description.
 */
export async function ensureVehicleSeoRows(
  vehicles: { slug: string; label: string }[],
): Promise<void> {
  if (vehicles.length === 0) return;
  const supabase = getSupabaseAdminClient();

  // Dedupe by slug — first occurrence wins the label.
  const bySlug = new Map<string, string>();
  for (const v of vehicles) {
    if (!bySlug.has(v.slug)) bySlug.set(v.slug, v.label);
  }

  const keys = [...bySlug.keys()].map(vehiclePageKey);
  const { data: existing, error: fetchError } = await supabase
    .from("page_seo")
    .select("page_key")
    .in("page_key", keys);
  if (fetchError) throw new Error(fetchError.message);
  const existingKeys = new Set((existing ?? []).map((row) => row.page_key as string));

  const toInsert = [...bySlug.entries()]
    .filter(([slug]) => !existingKeys.has(vehiclePageKey(slug)))
    .map(([slug, label]) => ({
      page_key: vehiclePageKey(slug),
      label,
      kind: "vehicle" as const,
      noindex: false,
    }));
  if (toInsert.length > 0) {
    const { error } = await supabase.from("page_seo").insert(toInsert);
    if (error) throw new Error(error.message);
  }

  const toRelabel = [...bySlug.entries()].filter(([slug]) => existingKeys.has(vehiclePageKey(slug)));
  await Promise.all(
    toRelabel.map(([slug, label]) =>
      supabase.from("page_seo").update({ label }).eq("page_key", vehiclePageKey(slug)),
    ),
  );
}
