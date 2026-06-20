import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listProtectionTiersFromDb,
  replaceProtectionTiersInDb,
} from "@/lib/supabase/catalog-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import type { ProtectionTier } from "@/types/domain";

const TierSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  perDayCents: z.number().int().nonnegative(),
  deductibleCents: z.number().int().nonnegative(),
  inclusions: z.array(z.string()),
  popular: z.boolean(),
});

const PayloadSchema = z.object({ items: z.array(TierSchema) });

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listProtectionTiersFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load protection tiers.";
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
    return NextResponse.json({ message: "Expected { items: ProtectionTier[] }." }, { status: 400 });
  }
  try {
    await replaceProtectionTiersInDb(parsed.data.items as ProtectionTier[]);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "catalog_protection_tiers",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save protection tiers.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
