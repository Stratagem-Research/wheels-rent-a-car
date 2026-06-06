import { NextResponse } from "next/server";
import { listItinerariesFromDb, replaceItinerariesInDb } from "@/lib/supabase/cms-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import type { Itinerary } from "@/types/domain";

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listItinerariesFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load itineraries.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  try {
    const body = (await request.json()) as { items?: Itinerary[] };
    if (!Array.isArray(body.items)) {
      return NextResponse.json({ message: "Expected { items: Itinerary[] }." }, { status: 400 });
    }
    await replaceItinerariesInDb(body.items);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "cms_itineraries",
      action: "replace",
      details: { count: body.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: body.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save itineraries.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
