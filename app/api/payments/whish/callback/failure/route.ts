import { NextResponse } from "next/server";
import { parseCallbackUrl } from "@/lib/payments/whish";
import {
  appendBookingState,
  getPaymentEventByExternalId,
  recordPaymentEvent,
} from "@/lib/server/payment-events";

export async function GET(request: Request) {
  const callback = parseCallbackUrl(request.url);
  if (!callback.externalId) {
    return NextResponse.json({ message: "Missing callback parameters." }, { status: 400 });
  }

  const payment = await getPaymentEventByExternalId(callback.externalId);
  if (!payment?.booking_reference) {
    return NextResponse.json({ message: "Unknown payment external id." }, { status: 404 });
  }

  await recordPaymentEvent({
    bookingReference: payment.booking_reference,
    provider: "whish",
    externalId: callback.externalId,
    status: "failed",
    currency: callback.currency ?? (payment.currency as string),
    payload: {
      errorCode: callback.errorCode ?? null,
      errorMessage: callback.errorMessage ?? null,
    },
  });
  await appendBookingState(payment.booking_reference, "pending", {
    paymentStatus: "failed",
    provider: "whish",
    errorCode: callback.errorCode ?? null,
  });

  return NextResponse.json({ ok: true });
}
