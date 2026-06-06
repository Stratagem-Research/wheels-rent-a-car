import { NextResponse } from "next/server";
import { seedWebsiteData, type SeedResource } from "@/lib/supabase/seed";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";

const ALLOWED: SeedResource[] = [
  "all",
  "trips",
  "itineraries",
  "faqs",
  "corporate",
  "vehicle_metadata",
  "vehicle_wizard_map",
  "locations",
  "promotions",
  "about",
];

export async function POST(request: Request) {
  const auth = requireAdminSession(request, ["ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
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
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "seed",
      action: "run",
      details: { resources },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, results });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Seed failed.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
