import type { Review } from "@/types/domain";
import { REVIEWS as FALLBACK_REVIEWS } from "@/lib/api/fixtures/content";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type ReviewRow = {
  id: string;
  rating: number;
  body: string;
  reviewer_name: string;
  review_date: string;
  source: Review["source"];
  sort_order: number;
  active: boolean;
  link: string | null;
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    rating: row.rating,
    body: row.body,
    author: row.reviewer_name,
    date: row.review_date,
    source: row.source,
    link: row.link ?? undefined,
  };
}

export async function listReviewsFromDb(limit = 10): Promise<Review[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cms_reviews")
    .select("*")
    .eq("active", true)
    .order("sort_order")
    .limit(limit);
  if (error) throw new Error(error.message);
  const rows = (data ?? []) as ReviewRow[];
  if (rows.length === 0) return FALLBACK_REVIEWS.slice(0, limit);
  return rows.map(toReview);
}

export async function replaceReviewsInDb(items: Review[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const { error: clearError } = await supabase.from("cms_reviews").delete().neq("id", "");
  if (clearError) throw new Error(clearError.message);
  if (items.length === 0) return;
  const rows = items.map((item, index) => ({
    id: item.id,
    rating: item.rating,
    body: item.body,
    reviewer_name: item.author,
    review_date: item.date,
    source: item.source,
    link: item.link?.trim() ? item.link.trim() : null,
    sort_order: index,
    active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("cms_reviews").insert(rows);
  if (error) {
    // PostgREST schema-cache lag after the `link` column is added by a
    // direct-pg migration: the cache hasn't refreshed, so it rejects the
    // `link` field. Retry without `link` so the save still lands; the next
    // save (after the cache refreshes) will persist `link`. Matches the
    // graceful-degradation pattern used for contact_settings.email.
    if (/link/i.test(error.message) && /schema cache|could not find/i.test(error.message)) {
      const rowsWithoutLink = rows.map(({ link: _link, ...rest }) => rest);
      const { error: retryError } = await supabase.from("cms_reviews").insert(rowsWithoutLink);
      if (retryError) throw new Error(retryError.message);
      return;
    }
    throw new Error(error.message);
  }
}
