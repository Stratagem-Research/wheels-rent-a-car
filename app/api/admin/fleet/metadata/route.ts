import { NextResponse } from "next/server";
import { z } from "zod";
import {
  frontendVehicleIdFromWizard,
  slugifyVehicleName,
} from "@/lib/booking/wizard-vehicle-id";
import {
  listVehicleMetadata,
  replaceVehicleMetadata,
  writeAdminAuditLog,
  type VehicleMetadataRow,
} from "@/lib/supabase/admin-repository";
import { listWebsiteEnabledWizardVehicles } from "@/lib/supabase/wizard-vehicles-repository";
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

/**
 * Fleet admin list is driven by website-enabled Wizard vehicles (sync mirror),
 * not every historical `vehicle_metadata` row — that inflated count past the
 * 65 synced from Wizard.
 */
export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const [wizardRows, metadataRows] = await Promise.all([
      listWebsiteEnabledWizardVehicles(),
      listVehicleMetadata(),
    ]);

    const metaById = new Map(
      metadataRows.map((row) => [row.frontend_vehicle_id, row] as const),
    );

    const items = wizardRows.map((wiz) => {
      const frontendId = frontendVehicleIdFromWizard(wiz.wizard_vehicle_id);
      const meta: VehicleMetadataRow | undefined = metaById.get(frontendId);
      const operational = wiz.operational ?? {};
      const defaultSlug = slugifyVehicleName(wiz.display_name) || frontendId;
      const wizardName =
        (typeof operational.name === "string" && operational.name.trim()) ||
        wiz.display_name?.trim() ||
        null;

      return {
        frontend_vehicle_id: frontendId,
        slug: meta?.slug ?? defaultSlug,
        tagline: meta?.tagline ?? null,
        description: meta?.description ?? null,
        features: meta?.features ?? [],
        badges: meta?.badges ?? [],
        media: meta?.media ?? [],
        updated_at: meta?.updated_at,
        wizard_vehicle_id: wiz.wizard_vehicle_id,
        wizard_display_name: wizardName,
        wizard_brand: wiz.brand,
        wizard_model: wiz.model,
      };
    });

    return NextResponse.json({
      items,
      total: items.length,
      source: "wizard_vehicles_website_enabled",
    });
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
