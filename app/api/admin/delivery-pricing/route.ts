import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getDeliveryPricingSettings,
  replaceDeliveryPricingSettings,
  writeAdminAuditLog,
} from "@/lib/supabase/admin-repository";
import { DEFAULT_DELIVERY_PRICING_SETTINGS } from "@/lib/booking/delivery-pricing";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

const SettingsSchema = z.object({
  baseFeeCents: z.number().int().min(0),
  freeRadiusKm: z.number().min(0),
  perKmCents: z.number().int().min(0),
});

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const settings = await getDeliveryPricingSettings();
    return NextResponse.json({ settings: settings ?? DEFAULT_DELIVERY_PRICING_SETTINGS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load delivery pricing.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireAdminSession(request, ["ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const body = await request.json().catch(() => null);
  const parsed = SettingsSchema.safeParse((body as { settings?: unknown } | null)?.settings);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid delivery pricing payload." }, { status: 400 });
  }
  try {
    await replaceDeliveryPricingSettings(parsed.data);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "delivery_pricing_settings",
      action: "replace",
      details: parsed.data,
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save delivery pricing.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
