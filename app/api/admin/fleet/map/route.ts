import { NextResponse } from "next/server";
import { z } from "zod";
/** Staging-only fallback. Production fleet uses POST /api/admin/fleet/sync. */
import {
  listVehicleWizardMap,
  replaceVehicleWizardMap,
  writeAdminAuditLog,
} from "@/lib/supabase/admin-repository";
import { listWizardVehicles } from "@/lib/supabase/wizard-vehicles-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

const MapItemSchema = z.object({
  frontend_vehicle_id: z.string().min(1),
  wizard_vehicle_id: z.number().int().positive(),
});
const PayloadSchema = z.object({ items: z.array(MapItemSchema) });

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const [items, wizardRows] = await Promise.all([
      listVehicleWizardMap(),
      listWizardVehicles().catch(() => []),
    ]);
    const byWizardId = new Map(wizardRows.map((row) => [row.wizard_vehicle_id, row.display_name]));
    const enriched = items.map((item) => ({
      ...item,
      wizard_display_name: byWizardId.get(item.wizard_vehicle_id) ?? null,
    }));
    return NextResponse.json({ items: enriched });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load wizard map.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const body = await request.json().catch(() => null);
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Expected { items: { frontend_vehicle_id, wizard_vehicle_id }[] }." },
      { status: 400 },
    );
  }
  try {
    await replaceVehicleWizardMap(parsed.data.items);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "vehicle_wizard_map",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save wizard map.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
