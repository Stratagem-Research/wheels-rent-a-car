import { NextResponse } from "next/server";
import { listReviewsFromDb } from "@/lib/supabase/reviews-repository";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "10");
    const items = await listReviewsFromDb(Number.isFinite(limit) ? limit : 10);
    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load reviews.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
