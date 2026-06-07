import { NextResponse } from "next/server";
import { listFaqsFromDb } from "@/lib/supabase/cms-repository";
import { getLocalizedString } from "@/lib/i18n/localized";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
    const locale = (url.searchParams.get("locale") ?? "en").toLowerCase();
    if (!q) {
      return NextResponse.json({ items: [] });
    }

    const groups = await listFaqsFromDb();
    const matches = groups
      .flatMap((g) => g.entries)
      .filter(
        (entry) =>
          getLocalizedString(entry.question, locale).toLowerCase().includes(q) ||
          getLocalizedString(entry.answer, locale).toLowerCase().includes(q),
      )
      .map((entry) => ({
        ...entry,
        question: getLocalizedString(entry.question, locale),
        answer: getLocalizedString(entry.answer, locale),
      }))
      .slice(0, 12);

    return NextResponse.json({ items: matches });
  } catch (error) {
    const message = error instanceof Error ? error.message : "FAQ search failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
