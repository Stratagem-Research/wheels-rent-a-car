import { NextResponse } from "next/server";
import { z } from "zod";
import { getNeoClient } from "@/lib/payments/neo";
import { appendBookingState, recordPaymentEvent } from "@/lib/server/payment-events";
import { isPaymentMethodAvailable } from "@/lib/server/payment-methods";

const CreateNeoPaymentSchema = z.object({
  bookingReference: z.string().min(1),
  customerEmail: z.string().email(),
  amount: z.number().positive(),
  currency: z.enum(["USD", "LBP"]).default("USD"),
  invoice: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isPaymentMethodAvailable("neo")) {
    return NextResponse.json(
      {
        message:
          "Bank Audi NEO is not enabled or configured in this environment. Choose another payment method.",
      },
      { status: 503 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = CreateNeoPaymentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid NEO create payload." }, { status: 400 });
  }

  const websiteUrl = process.env.WEBSITE_URL?.trim();
  if (!websiteUrl) {
    return NextResponse.json(
      { message: "Bank Audi NEO is not configured (WEBSITE_URL missing). Choose another payment method." },
      { status: 503 },
    );
  }
  const neo = getNeoClient();
  const externalId = neo.generateExternalId();
  const result = await neo.createPayment({
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    invoice: parsed.data.invoice,
    externalId,
    successCallbackUrl: `${websiteUrl}/api/payments/neo/callback/success`,
    failureCallbackUrl: `${websiteUrl}/api/payments/neo/callback/failure`,
    successRedirectUrl: `${websiteUrl}/book/confirmation/${encodeURIComponent(parsed.data.bookingReference)}?email=${encodeURIComponent(parsed.data.customerEmail)}`,
    failureRedirectUrl: `${websiteUrl}/book/checkout?payment=failed`,
  });

  if (!result.success || !result.collectUrl) {
    return NextResponse.json(
      { message: result.message ?? "NEO payment initialization failed." },
      { status: 400 },
    );
  }

  await recordPaymentEvent({
    bookingReference: parsed.data.bookingReference,
    provider: "neo",
    externalId,
    status: "awaiting_payment",
    currency: parsed.data.currency,
    amount: parsed.data.amount,
    payload: { invoice: parsed.data.invoice },
  });
  await appendBookingState(parsed.data.bookingReference, "pending", {
    paymentMethod: "neo",
    externalId,
  });

  return NextResponse.json({ collectUrl: result.collectUrl, externalId: String(externalId) });
}
