import { NextResponse } from "next/server";
import { listFaqsFromDb, replaceFaqsInDb } from "@/lib/supabase/cms-repository";
import type { FaqGroup } from "@/types/domain";

export async function GET() {
  try {
    const items = await listFaqsFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load FAQs.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as { items?: FaqGroup[] };
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ message: "Expected { items: FaqGroup[] }." }, { status: 400 });
    }
    await replaceFaqsInDb(body.items);
    return NextResponse.json({ ok: true, count: body.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save FAQs.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
