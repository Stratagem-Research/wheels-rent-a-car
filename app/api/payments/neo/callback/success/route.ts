import { NextResponse } from "next/server";
import {
  appendBookingState,
  getPaymentEventByExternalId,
  recordPaymentEvent,
} from "@/lib/server/payment-events";
import { dispatchWizardSync } from "@/lib/server/wizard-sync";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const externalId = url.searchParams.get("external_id");
  const redirect = url.searchParams.get("redirect");
  const sandbox = url.searchParams.get("sandbox");

  if (!externalId) {
    return NextResponse.json({ message: "Missing external_id." }, { status: 400 });
  }

  const payment = await getPaymentEventByExternalId(externalId);
  if (!payment?.booking_reference) {
    return NextResponse.json({ message: "Unknown payment external id." }, { status: 404 });
  }

  const amount = Number(url.searchParams.get("amount") ?? payment.amount ?? 0);
  await recordPaymentEvent({
    bookingReference: payment.booking_reference,
    provider: "neo",
    externalId,
    status: "success",
    currency: (url.searchParams.get("currency") as "USD" | "LBP" | null) ?? "USD",
    amount,
    payload: { sandbox: sandbox === "1" },
  });
  await appendBookingState(payment.booking_reference, "confirmed", {
    paymentStatus: "paid",
    provider: "neo",
  });
  await dispatchWizardSync(payment.booking_reference, {
    lifecycleState: "confirmed",
    paymentStatus: "paid",
    paidAmount: amount,
    paymentMethod: "website_payment",
    paymentReference: externalId,
    paymentDate: new Date().toISOString().slice(0, 10),
    message: "Payment confirmed via Bank Audi NEO callback.",
  });

  if (redirect) {
    return NextResponse.redirect(redirect);
  }

  return NextResponse.json({ ok: true });
}
