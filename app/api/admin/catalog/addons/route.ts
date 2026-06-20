import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listAddOnsFromDb,
  replaceAddOnsInDb,
} from "@/lib/supabase/catalog-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import type { AddOn } from "@/types/domain";

const AddOnSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  category: z.string(),
  pricing: z.enum(["per-day", "per-rental"]),
  priceCents: z.number().int().nonnegative(),
  multiQuantity: z.boolean(),
  maxQuantity: z.number().int().positive().optional(),
  icon: z.string(),
});

const PayloadSchema = z.object({ items: z.array(AddOnSchema) });

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listAddOnsFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load add-ons.";
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
    return NextResponse.json({ message: "Expected { items: AddOn[] }." }, { status: 400 });
  }
  try {
    await replaceAddOnsInDb(parsed.data.items as AddOn[]);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "catalog_addons",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save add-ons.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
