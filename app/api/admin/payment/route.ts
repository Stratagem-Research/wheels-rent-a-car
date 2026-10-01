import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getPaymentSettings,
  replacePaymentSettings,
  writeAdminAuditLog,
} from "@/lib/supabase/admin-repository";
import { DEFAULT_PAYMENT_SETTINGS } from "@/lib/payments/payment-settings";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";

const SurchargeSchema = z.object({
  mode: z.enum(["none", "fixed", "percent"]),
  amountCents: z.number().int().min(0).max(1_000_000),
  percent: z.number().min(0).max(100),
});

const BankTransferSchema = z.object({
  bankName: z.string().trim().max(120),
  accountName: z.string().trim().max(120),
  accountNumber: z.string().trim().max(60),
  iban: z.string().trim().max(60),
  swift: z.string().trim().max(30),
  instructions: z.string().trim().max(500),
});

const SettingsSchema = z.object({
  bankTransfer: BankTransferSchema,
  surcharges: z.object({
    transfer: SurchargeSchema,
    omt: SurchargeSchema,
    "whish-online": SurchargeSchema,
    neo: SurchargeSchema,
  }),
});

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const settings = await getPaymentSettings();
    return NextResponse.json({ settings: settings ?? DEFAULT_PAYMENT_SETTINGS });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payment settings.";
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
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Invalid payment settings payload." },
      { status: 400 },
    );
  }
  try {
    await replacePaymentSettings(parsed.data);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "payment_settings",
      action: "replace",
      details: parsed.data,
    }).catch(() => undefined);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save payment settings.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
