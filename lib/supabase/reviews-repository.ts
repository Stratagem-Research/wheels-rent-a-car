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
};

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    rating: row.rating,
    body: row.body,
    author: row.reviewer_name,
    date: row.review_date,
    source: row.source,
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
    sort_order: index,
    active: true,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await supabase.from("cms_reviews").insert(rows);
  if (error) throw new Error(error.message);
}
