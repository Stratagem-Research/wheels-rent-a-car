import { NextResponse } from "next/server";
import { z } from "zod";
import {
  listLongTermTiersFromDb,
  replaceLongTermTiersInDb,
} from "@/lib/supabase/catalog-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import type { LongTermTier } from "@/types/domain";

const TierSchema = z.object({
  id: z.string().min(1),
  durationMonths: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
  perDayCents: z.number().int().nonnegative(),
  savingsPercent: z.number().int().nonnegative(),
  inclusions: z.array(z.string()),
  popular: z.boolean().optional(),
});

const PayloadSchema = z.object({ items: z.array(TierSchema) });

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listLongTermTiersFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load long-term tiers.";
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
    return NextResponse.json({ message: "Expected { items: LongTermTier[] }." }, { status: 400 });
  }
  try {
    await replaceLongTermTiersInDb(parsed.data.items as LongTermTier[]);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "catalog_long_term_tiers",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save long-term tiers.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
