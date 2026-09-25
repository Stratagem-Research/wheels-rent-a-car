import { NextResponse } from "next/server";
import { z } from "zod";
import {
  frontendVehicleIdFromWizard,
  parseWizardVehicleId,
  slugifyVehicleName,
} from "@/lib/booking/wizard-vehicle-id";
import {
  deleteVehicleMetadataByIds,
  listVehicleMetadata,
  upsertVehicleMetadata,
  writeAdminAuditLog,
  type VehicleMetadataRow,
} from "@/lib/supabase/admin-repository";
import { listWebsiteEnabledWizardVehicles, type WizardVehicleRow } from "@/lib/supabase/wizard-vehicles-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { parseOperational } from "@/lib/vehicles/vehicle-operational";
import { listHeldFrontendVehicleIds } from "@/lib/supabase/vehicle-booking-holds-repository";

const MetadataItemSchema = z.object({
  frontend_vehicle_id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().nullable().optional(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  tagline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  features: z.array(z.string()).optional().default([]),
  badges: z.array(z.string()).optional().default([]),
  media: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  operational: z.record(z.string(), z.unknown()).optional().default({}),
  class_label: z.string().nullable().optional(),
  updated_at: z.string().optional(),
});

const PayloadSchema = z.object({
  items: z.array(MetadataItemSchema),
  deleted_ids: z.array(z.string()).optional().default([]),
});

function firstText(...values: Array<string | null | undefined>): string | null {
  for (const value of values) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

function wizardName(wiz: WizardVehicleRow): string | null {
  const operational = wiz.operational ?? {};
  return (
    (typeof operational.name === "string" && operational.name.trim()) ||
    wiz.display_name?.trim() ||
    null
  );
}

function itemFromWizard(wiz: WizardVehicleRow, meta: VehicleMetadataRow | undefined) {
  const frontendId = frontendVehicleIdFromWizard(wiz.wizard_vehicle_id);
  const defaultSlug = slugifyVehicleName(wiz.display_name) || frontendId;
  const name = wizardName(wiz);
  const brand = firstText(meta?.brand, wiz.brand);
  const model = firstText(meta?.model, wiz.model);
  const metaOp = parseOperational(meta?.operational);
  const wizDailyRate = wiz.operational?.daily_rate;
  const dailyRate =
    typeof metaOp.daily_rate === "number" && metaOp.daily_rate > 0
      ? metaOp.daily_rate
      : typeof wizDailyRate === "number"
        ? wizDailyRate
        : null;
  return {
    frontend_vehicle_id: frontendId,
    slug: meta?.slug ?? defaultSlug,
    title: firstText(meta?.title, name),
    brand,
    model,
    tagline: meta?.tagline ?? null,
    description: meta?.description ?? null,
    features: meta?.features ?? [],
    badges: meta?.badges ?? [],
    media: meta?.media ?? [],
    operational: { ...metaOp, daily_rate: dailyRate },
    class_label: meta?.class_label ?? null,
    updated_at: meta?.updated_at,
    wizard_vehicle_id: wiz.wizard_vehicle_id,
    wizard_display_name: name,
    wizard_brand: wiz.brand,
    wizard_model: wiz.model,
    source: "wizard" as const,
  };
}

function itemFromManualMetadata(meta: VehicleMetadataRow) {
  return {
    frontend_vehicle_id: meta.frontend_vehicle_id,
    slug: meta.slug,
    title: meta.title,
    brand: meta.brand,
    model: meta.model,
    tagline: meta.tagline,
    description: meta.description,
    features: meta.features ?? [],
    badges: meta.badges ?? [],
    media: meta.media ?? [],
    operational: meta.operational ?? {},
    class_label: meta.class_label ?? null,
    updated_at: meta.updated_at,
    wizard_vehicle_id: parseWizardVehicleId(meta.frontend_vehicle_id),
    wizard_display_name: parseOperational(meta.operational).display_name || meta.title,
    wizard_brand: meta.brand,
    wizard_model: meta.model,
    source: "website" as const,
  };
}

/**
 * Website-enabled Wizard vehicles plus manually created metadata rows.
 * Disabled Wizard units stay in the DB (sync does not prune) but are omitted here.
 */
export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const [wizardRows, metadataRows, heldIds] = await Promise.all([
      listWebsiteEnabledWizardVehicles(),
      listVehicleMetadata(),
      listHeldFrontendVehicleIds(),
    ]);

    const metaById = new Map(
      metadataRows.map((row) => [row.frontend_vehicle_id, row] as const),
    );
    const wizardFrontendIds = new Set(
      wizardRows.map((wiz) => frontendVehicleIdFromWizard(wiz.wizard_vehicle_id)),
    );

    const items = [
      ...wizardRows.map((wiz) =>
        itemFromWizard(wiz, metaById.get(frontendVehicleIdFromWizard(wiz.wizard_vehicle_id))),
      ),
      ...metadataRows
        .filter((row) => !wizardFrontendIds.has(row.frontend_vehicle_id))
        .map(itemFromManualMetadata),
    ];

    return NextResponse.json({
      items,
      total: items.length,
      held_ids: [...heldIds],
      source: "wizard_vehicles_website_enabled_plus_manual",
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
      { message: "Expected { items: VehicleMetadata[], deleted_ids?: string[] }." },
      { status: 400 },
    );
  }
  try {
    const keepIds = new Set(parsed.data.items.map((item) => item.frontend_vehicle_id));
    const deletedIds = parsed.data.deleted_ids.filter((id) => !keepIds.has(id));
    await upsertVehicleMetadata(
      parsed.data.items.map((item) => ({
        frontend_vehicle_id: item.frontend_vehicle_id,
        slug: item.slug,
        title: item.title?.trim() ? item.title.trim() : null,
        brand: item.brand?.trim() ? item.brand.trim() : null,
        model: item.model?.trim() ? item.model.trim() : null,
        tagline: item.tagline ?? null,
        description: item.description ?? null,
        features: item.features,
        badges: item.badges,
        media: item.media,
        operational: item.operational ?? {},
        class_label: item.class_label?.trim() ? item.class_label.trim() : null,
        updated_at: item.updated_at ?? new Date().toISOString(),
      })),
    );
    await deleteVehicleMetadataByIds(deletedIds);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "vehicle_metadata",
      action: "upsert",
      details: { count: parsed.data.items.length, deleted: deletedIds.length },
    }).catch(() => undefined);
    return NextResponse.json({
      ok: true,
      count: parsed.data.items.length,
      deleted: deletedIds.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save vehicle metadata.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
