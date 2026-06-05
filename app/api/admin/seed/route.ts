import { NextResponse } from "next/server";
import { seedWebsiteData, type SeedResource } from "@/lib/supabase/seed";

const ALLOWED: SeedResource[] = [
  "all",
  "trips",
  "itineraries",
  "faqs",
  "corporate",
  "vehicle_metadata",
  "vehicle_wizard_map",
];

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as { resources?: SeedResource[] };
    const resources = Array.isArray(body.resources) ? body.resources : (["all"] as SeedResource[]);
    const invalid = resources.filter((r) => !ALLOWED.includes(r));
    if (invalid.length > 0) {
      return NextResponse.json(
        { message: `Unknown resources: ${invalid.join(", ")}` },
        { status: 400 },
      );
    }

    const results = await seedWebsiteData(resources);
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
