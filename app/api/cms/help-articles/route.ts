import { NextResponse } from "next/server";
import { listHelpArticlesFromDb } from "@/lib/supabase/cms-repository";

/**
 * /api/cms/help-articles — list of CMS help articles.
 *
 * Public GET so the marketing help pages can hydrate. Per-article
 * read/write/delete live on /api/cms/help-articles/[slug].
 */
export async function GET() {
  try {
    const items = await listHelpArticlesFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load help articles.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
