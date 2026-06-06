import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listVehicleMetadata,
  replaceVehicleMetadata,
  writeAdminAuditLog,
} from "@/lib/supabase/admin-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

const MetadataItemSchema = z.object({
  frontend_vehicle_id: z.string().min(1),
  slug: z.string().min(1),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  features: z.array(z.string()).optional().default([]),
  badges: z.array(z.string()).optional().default([]),
  media: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  updated_at: z.string().optional(),
});

const PayloadSchema = z.object({ items: z.array(MetadataItemSchema) });

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listVehicleMetadata();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load vehicle metadata.";
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
      { message: "Expected { items: VehicleMetadata[] }." },
      { status: 400 },
    );
  }
  try {
    await replaceVehicleMetadata(
      parsed.data.items.map((item) => ({
        frontend_vehicle_id: item.frontend_vehicle_id,
        slug: item.slug,
        tagline: item.tagline ?? null,
        description: item.description ?? null,
        features: item.features,
        badges: item.badges,
        media: item.media,
        updated_at: item.updated_at ?? new Date().toISOString(),
      })),
    );
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "vehicle_metadata",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save vehicle metadata.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
