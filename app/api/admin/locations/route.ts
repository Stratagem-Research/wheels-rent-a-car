import { NextResponse } from "next/server";
import { z } from "zod";
import type { BranchHours } from "@/types/domain";
import { listLocations, replaceLocations, writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

const BranchHoursSchema: z.ZodType<BranchHours> = z.object({
  day: z.number().int().min(0).max(6),
  open: z.string(),
  close: z.string(),
  open24h: z.boolean().optional(),
});

const LocationSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  phone: z.string().min(1),
  whatsapp: z.string().optional(),
  hours: z.array(BranchHoursSchema),
  isAirport: z.boolean(),
  temporarilyClosed: z.boolean().optional(),
  closedReason: z.string().optional(),
});

const PayloadSchema = z.object({ items: z.array(LocationSchema) });

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listLocations();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load locations.";
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
    return NextResponse.json({ message: "Expected { items: Branch[] }." }, { status: 400 });
  }
  try {
    await replaceLocations(parsed.data.items);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "locations",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save locations.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
