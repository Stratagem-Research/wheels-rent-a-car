import { NextResponse } from "next/server";
import { listFaqsFromDb, replaceFaqsInDb } from "@/lib/supabase/cms-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { faqPayloadSchema } from "@/lib/cms/schemas";

export async function GET() {
  try {
    const items = await listFaqsFromDb();
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load FAQs.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  try {
    const body = await request.json().catch(() => null);
    const parsed = faqPayloadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Expected { items: FaqGroup[] }." }, { status: 400 });
    }
    await replaceFaqsInDb(parsed.data.items);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "cms_faqs",
      action: "replace",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save FAQs.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
