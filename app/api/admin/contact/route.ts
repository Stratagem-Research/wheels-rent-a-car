import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getContactSettings,
  replaceContactSettings,
  writeAdminAuditLog,
} from "@/lib/supabase/admin-repository";
import { DEFAULT_CONTACT_SETTINGS } from "@/lib/contact/settings";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

/**
 * A phone number as it should be dialed: an optional leading "+" (kept only
 * when the number needs a country code, e.g. an international WhatsApp
 * number), then 8-15 digits with optional spaces, dashes, or parens for
 * readability. Stored as typed; hrefs strip the separators.
 */
const phoneSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^\+?[\d\s()-]{7,20}$/, "Use digits only, with an optional leading +, e.g. 05 959 860")
  .refine((value) => {
    const digits = value.replace(/\D/g, "").length;
    return digits >= 8 && digits <= 15;
  }, "Must contain between 8 and 15 digits");

const SettingsSchema = z.object({
  phone: phoneSchema,
  whatsapp: phoneSchema,
});

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const settings = await getContactSettings();
    return NextResponse.json({ settings: settings ?? DEFAULT_CONTACT_SETTINGS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load contact settings.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;
  const body = await request.json().catch(() => null);
  const parsed = SettingsSchema.safeParse((body as { settings?: unknown } | null)?.settings);
  if (!parsed.success) {
    return NextResponse.json(
      {
        message: parsed.error.issues[0]?.message ?? "Invalid contact settings payload.",
      },
      { status: 400 },
    );
  }
  try {
    await replaceContactSettings(parsed.data);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "contact_settings",
      action: "replace",
      details: parsed.data,
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save contact settings.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
