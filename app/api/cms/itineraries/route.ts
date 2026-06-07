import { NextResponse } from "next/server";
import { listItinerariesFromDb, replaceItinerariesInDb } from "@/lib/supabase/cms-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { itineraryPayloadSchema } from "@/lib/cms/schemas";

export async function GET() {
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
    const body = await request.json().catch(() => null);
    const parsed = itineraryPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Expected { items: Itinerary[] }." }, { status: 400 });
    }
    await replaceItinerariesInDb(parsed.data.items);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "cms_itineraries",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save itineraries.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
