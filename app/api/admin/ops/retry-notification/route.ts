import { NextResponse } from "next/server";
import { z } from "zod";
import { retryNotificationOutbox, writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

const PayloadSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(request: Request) {
  const auth = requireAdminSession(request, ["ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const body = await request.json().catch(() => null);
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid retry payload." }, { status: 400 });
  }
  try {
    await retryNotificationOutbox(parsed.data.id);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "notification_outbox",
      action: "retry",
      details: { id: parsed.data.id },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retry notification.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
