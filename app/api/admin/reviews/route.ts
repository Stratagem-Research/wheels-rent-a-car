import { NextResponse } from "next/server";
import { z } from "zod";
import { listReviewsFromDb, replaceReviewsInDb } from "@/lib/supabase/reviews-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import type { Review } from "@/types/domain";

const ReviewSchema = z.object({
  id: z.string().min(1),
  source: z.enum(["google", "trustpilot"]),
  rating: z.number().int().min(1).max(5),
  author: z.string().min(1),
  body: z.string().min(1),
  date: z.string().min(1),
});

const PayloadSchema = z.object({ items: z.array(ReviewSchema) });

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const items = await listReviewsFromDb(100);
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load reviews.";
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
    return NextResponse.json({ message: "Expected { items: Review[] }." }, { status: 400 });
  }
  try {
    await replaceReviewsInDb(parsed.data.items as Review[]);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "cms_reviews",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save reviews.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
