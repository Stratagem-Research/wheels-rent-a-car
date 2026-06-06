import { NextResponse } from "next/server";
import { z } from "zod";
import { listPromotions, replacePromotions, writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

const PromotionSchema = z.object({
  id: z.string().min(1),
  message: z.string().min(1),
  href: z.string().nullable().optional(),
  active: z.boolean(),
  starts_at: z.string().nullable().optional(),
  ends_at: z.string().nullable().optional(),
});

const PayloadSchema = z.object({ items: z.array(PromotionSchema) });

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listPromotions();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load promotions.";
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
    return NextResponse.json({ message: "Expected { items: Promotion[] }." }, { status: 400 });
  }
  try {
    await replacePromotions(
      parsed.data.items.map((item) => ({
        id: item.id,
        message: item.message,
        href: item.href ?? null,
        active: item.active,
        starts_at: item.starts_at ?? null,
        ends_at: item.ends_at ?? null,
      })),
    );
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "promotions",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save promotions.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
