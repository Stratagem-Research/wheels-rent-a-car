import { NextResponse } from "next/server";
import { appendBookingState, getPaymentEventByExternalId, recordPaymentEvent } from "@/lib/server/payment-events";
import { getSiteUrl } from "@/lib/server/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const externalId = url.searchParams.get("external_id");
  if (!externalId) {
    return NextResponse.json({ message: "Missing external_id." }, { status: 400 });
  }

  const payment = await getPaymentEventByExternalId(externalId);
  if (!payment?.booking_reference) {
    return NextResponse.json({ message: "Unknown payment external id." }, { status: 404 });
  }

  await recordPaymentEvent({
    bookingReference: payment.booking_reference,
    provider: "neo",
    externalId,
    status: "failed",
    currency: "USD",
    amount: payment.amount ?? 0,
    payload: { reason: "neo_callback_failure" },
  });
  await appendBookingState(payment.booking_reference, "pending", {
    paymentStatus: "failed",
    provider: "neo",
  });

  const failureRedirect = `${getSiteUrl()}/book/checkout?payment=failed`;
  return NextResponse.redirect(failureRedirect);
}
