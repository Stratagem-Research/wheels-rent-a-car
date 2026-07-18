import { NextResponse } from "next/server";
import { z } from "zod";
import { getWhishClient } from "@/lib/payments/whish";
import { getWhishEnv } from "@/lib/server/env";
import { appendBookingState, recordPaymentEvent } from "@/lib/server/payment-events";

const CreateWhishPaymentSchema = z.object({
  bookingReference: z.string().min(1),
  amount: z.number().positive(),
  currency: z.enum(["USD", "LBP", "AED"]).default("USD"),
  invoice: z.string().min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = CreateWhishPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid Whish create payload." }, { status: 400 });
  }

  const envResult = safeGetServerEnv();
  if (!envResult.success) {
    return NextResponse.json(
      {
        message:
          "Whish online payment is not configured in this environment. Choose cash, bank transfer, or manual OMT/Whish for local testing.",
      },
      { status: 503 },
    );
  }

  const env = envResult.data;
  const whish = getWhishClient();
  const externalId = whish.generateExternalId();
  const result = await whish.createPayment({
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    invoice: parsed.data.invoice,
    externalId,
    successCallbackUrl: `${env.WEBSITE_URL}/api/payments/whish/callback/success`,
    failureCallbackUrl: `${env.WEBSITE_URL}/api/payments/whish/callback/failure`,
    successRedirectUrl: `${env.WEBSITE_URL}/book/confirmation/${encodeURIComponent(parsed.data.bookingReference)}`,
    failureRedirectUrl: `${env.WEBSITE_URL}/book/checkout?payment=failed`,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        message: result.dialog?.message ?? "Whish payment initialization failed.",
        code: result.code,
      },
      { status: 400 },
    );
  }

  await recordPaymentEvent({
    bookingReference: parsed.data.bookingReference,
    provider: "whish",
    externalId,
    status: "awaiting_payment",
    currency: parsed.data.currency,
    amount: parsed.data.amount,
    payload: { invoice: parsed.data.invoice },
  });
  await appendBookingState(parsed.data.bookingReference, "pending", {
    paymentMethod: "whish-online",
    externalId,
  });

  return NextResponse.json({ collectUrl: result.collectUrl, externalId });
}

function safeGetServerEnv():
  | { success: true; data: ReturnType<typeof getWhishEnv> }
  | { success: false } {
  try {
    return { success: true, data: getWhishEnv() };
  } catch {
    return { success: false };
  }
}
