import { NextResponse } from "next/server";
import { getWhishClient, parseCallbackUrl } from "@/lib/payments/whish";
import {
  appendBookingState,
  getPaymentEventByExternalId,
  recordPaymentEvent,
} from "@/lib/server/payment-events";
import { dispatchWizardSync } from "@/lib/server/wizard-sync";

export async function GET(request: Request) {
  const callback = parseCallbackUrl(request.url);
  if (!callback.externalId || !callback.currency) {
    return NextResponse.json({ message: "Missing callback parameters." }, { status: 400 });
  }

  const payment = await getPaymentEventByExternalId(callback.externalId);
  if (!payment?.booking_reference) {
    return NextResponse.json({ message: "Unknown payment external id." }, { status: 404 });
  }

  const whish = getWhishClient();
  const status = await whish.getPaymentStatus(callback.currency, callback.externalId);
  if (status.collectStatus !== "success") {
    return NextResponse.json(
      { message: "Payment not confirmed.", status: status.collectStatus },
      { status: 400 },
    );
  }

  await recordPaymentEvent({
    bookingReference: payment.booking_reference,
    provider: "whish",
    externalId: callback.externalId,
    status: "success",
    currency: callback.currency,
    amount: status.amount,
    payload: status as unknown as Record<string, unknown>,
  });
  await appendBookingState(payment.booking_reference, "confirmed", {
    paymentStatus: "paid",
    provider: "whish",
    transactionId: status.transactionId ?? null,
  });
  await dispatchWizardSync(payment.booking_reference, {
    lifecycleState: "confirmed",
    paymentStatus: "paid",
    paidAmount: status.amount,
    paymentMethod: "whish",
    paymentReference: status.transactionId,
    paymentDate: new Date().toISOString().slice(0, 10),
    message: "Payment confirmed via Whish callback.",
  });

  return NextResponse.json({ ok: true });
}
