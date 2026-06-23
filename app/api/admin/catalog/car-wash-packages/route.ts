import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listCarWashPackagesFromDb,
  replaceCarWashPackagesInDb,
} from "@/lib/supabase/catalog-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import type { CarWashPackage } from "@/types/domain";

const LocalizedSchema = z.union([
  z.string(),
  z.object({
    en: z.string(),
    ar: z.string().optional(),
    fr: z.string().optional(),
  }),
]);

const VehiclePriceSchema = z.object({
  vehicleClass: z.enum(["car", "suv"]),
  amount: z.number().int().nonnegative(),
});

const PackageSchema = z.object({
  id: z.string().min(1),
  name: LocalizedSchema,
  description: LocalizedSchema,
  durationMinutes: z.number().int().positive(),
  turnaroundHours: z.number().int().positive().optional(),
  currency: z.enum(["USD", "LBP"]),
  pricingMode: z.enum(["fixed", "by_vehicle_class"]),
  priceCents: z.number().int().nonnegative().optional(),
  priceLbp: z.number().int().nonnegative().optional(),
  vehiclePrices: z.array(VehiclePriceSchema).optional(),
  quoteOnly: z.boolean().optional(),
  popular: z.boolean().optional(),
  icon: z.string().min(1),
  active: z.boolean().optional(),
});

const PayloadSchema = z.object({ items: z.array(PackageSchema) });

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listCarWashPackagesFromDb(false);
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load car wash packages.";
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
    return NextResponse.json({ message: "Expected { items: CarWashPackage[] }." }, { status: 400 });
  }
  try {
    await replaceCarWashPackagesInDb(parsed.data.items as CarWashPackage[]);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "catalog_car_wash_packages",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save car wash packages.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
