import { NextResponse } from "next/server";
import { listFaqsFromDb } from "@/lib/supabase/cms-repository";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    if (!q) {
      return NextResponse.json({ items: [] });
    }

    const groups = await listFaqsFromDb();
    const matches = groups
      .flatMap((g) => g.entries)
      .filter(
        (entry) =>
          entry.question.toLowerCase().includes(q) || entry.answer.toLowerCase().includes(q),
      )
      .slice(0, 12);

    return NextResponse.json({ items: matches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAQ search failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
