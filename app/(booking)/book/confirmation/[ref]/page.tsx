"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/booking/Stepper";
import { ConfirmationStatusBlock } from "@/components/booking/ConfirmationStatusBlock";
import { BookingStatusPoller } from "@/components/booking/BookingStatusPoller";
import { BookingSelfServiceActions } from "@/components/account/BookingSelfServiceActions";
import { isValidBookingRef } from "@/lib/booking/ref";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { formatUsd } from "@/lib/booking/pricing";
import { clearBookingDraft } from "@/hooks/useBookingDraft";
import { useBookingCatalog } from "@/hooks/useBookingCatalog";
import { useSession } from "@/hooks/useSession";
import type { Booking, BookingState } from "@/types/domain";

/**
 * /book/confirmation/[ref] — step 5 per 04_booking_flow.md.
 *
 * Loads the booking via /api/booking/lookup using the ref from the URL and
 * the email passed in `?email=` (set by the checkout redirect). On success:
 *   - Clears the booking draft (the funnel state is no longer needed).
 *   - Renders ConfirmationStatusBlock + summary + actions + cross-sell.
 *
 * Self-service actions (modify/cancel/calendar/invoice) reuse
 * BookingSelfServiceActions shared with manage-booking and account detail.
 */
export default function ConfirmationPage() {
  const t = useTranslations("bookingFlow.confirmation");
  const params = useParams<{ ref: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = params?.ref ?? "";
  const email = searchParams?.get("email") ?? "";
  const statusToken = searchParams?.get("token") ?? "";
  const {
    branches: BRANCHES,
    addOns: ADD_ONS,
    protectionTiers: PROTECTION_TIERS,
  } = useBookingCatalog();

  const [booking, setBooking] = React.useState<Booking | null>(null);
  const onBookingStateChange = React.useCallback((state: BookingState) => {
    setBooking((prev) => (prev ? { ...prev, state } : prev));
  }, []);
  const [lookupError, setLookupError] = React.useState<string | null>(null);
  const refValid = isValidBookingRef(ref);
  // Derive the invalid-ref error synchronously — keeps it out of useEffect.
  const error = !refValid ? t("invalidRef") : lookupError;

  React.useEffect(() => {
    if (!refValid) return;
    let cancelled = false;
    (async () => {
      try {
        const result = await api.post<Booking>(endpoints.bookingLookup, { ref, email });
        if (cancelled) return;
        setBooking(result);
        clearBookingDraft();
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setLookupError(t("lookupError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refValid, ref, email, t]);

  if (error) {
    return (
      <>
        <Stepper current={5} />
        <div className="mx-auto max-w-3xl px-5 py-16 text-center sm:px-5">
          <h1 className="headline-lg text-ink-95">{t("notFoundHeading")}</h1>
          <p className="body-md text-ink-60 mt-3">{error}</p>
          <Button asChild variant="primary" className="mt-6">
            <Link href="/manage-booking">{t("lookupAnother")}</Link>
          </Button>
        </div>
      </>
    );
  }

  if (!booking) {
    return (
      <>
        <Stepper current={5} />
        <div className="mx-auto max-w-3xl px-5 py-16 sm:px-5">
          <Skeleton className="mx-auto h-12 w-64 rounded-md" />
          <Skeleton className="mx-auto mt-3 h-6 w-40 rounded-md" />
          <Skeleton className="mt-8 h-64 rounded-lg" />
        </div>
      </>
    );
  }

  const pickupBranch = BRANCHES.find((b) => b.id === booking.pickup.locationId);
  const returnBranch = BRANCHES.find((b) => b.id === booking.return.locationId);
  const tier = PROTECTION_TIERS.find((t) => t.id === booking.protectionTierId);
  const heroImage = booking.vehicleSnapshot.images[0];

  return (
    <>
      <Stepper current={5} />
      <BookingStatusPoller
        booking={booking}
        publicToken={statusToken || booking.publicToken || null}
        onStateChange={onBookingStateChange}
      />
      <ConfirmationStatusBlock state={booking.state} bookingRef={booking.ref} />

      <section className="mx-auto max-w-[var(--container-full)] px-5 py-12 sm:px-5 sm:py-16">
        <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <Card variant="elevated" className="flex min-w-0 flex-col gap-5">
            <h2 className="headline-md text-ink-95">{t("yourCar")}</h2>
            <div className="flex items-center gap-4">
              {heroImage ? (
                <div className="bg-ink-10 relative size-20 shrink-0 overflow-hidden rounded-md">
                  <Image
                    src={heroImage.url}
                    alt={heroImage.alt}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                </div>
              ) : null}
              <div>
                <div className="headline-sm text-ink-95">
                  {booking.vehicleSnapshot.make} {booking.vehicleSnapshot.model}{" "}
                  <span className="body-sm text-ink-60 italic">{t("orSimilar")}</span>
                </div>
                <div className="label-md text-ink-60 capitalize">
                  {booking.vehicleSnapshot.category.replace("-", " ")}
                </div>
              </div>
            </div>

            <hr className="border-border" />

            <SummaryBlock
              title={t("pickup")}
              location={pickupBranch?.name ?? booking.pickup.address ?? "—"}
              datetime={booking.pickup.datetime}
            />
            <SummaryBlock
              title={t("return")}
              location={returnBranch?.name ?? booking.return.address ?? pickupBranch?.name ?? "—"}
              datetime={booking.return.datetime}
            />

            <hr className="border-border" />

            <div>
              <h3 className="text-ink-50 mb-2 overline">{t("driver")}</h3>
              <p className="body-md text-ink-95">
                {booking.driver.firstName} {booking.driver.lastName}
              </p>
              <p className="body-sm text-ink-60">
                {booking.driver.email} · {booking.driver.phone}
              </p>
            </div>

            {booking.extras.length > 0 ? (
              <div>
                <h3 className="text-ink-50 mb-2 overline">{t("addons")}</h3>
                <ul className="body-sm text-ink-80 flex flex-col gap-1">
                  {booking.extras.map((extra) => {
                    const addOn = ADD_ONS.find((a) => a.id === extra.addOnId);
                    if (!addOn) return null;
                    return (
                      <li key={extra.addOnId}>
                        {extra.qty > 1 ? `${extra.qty} × ` : ""}
                        {addOn.name}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null}

            {tier ? (
              <div>
                <h3 className="text-ink-50 mb-2 overline">{t("protection")}</h3>
                <p className="body-md text-ink-95">{tier.name}</p>
              </div>
            ) : null}
          </Card>

          <aside className="flex min-w-0 flex-col gap-5">
            <Card variant="elevated" className="flex min-w-0 flex-col gap-3">
              <div id="booking-payment">
                <span className="text-ink-50 overline">{t("total")}</span>
                <div className="price-lg text-ink-95">{formatUsd(booking.price.totalCents)}</div>
                <div className="body-sm text-ink-60">
                  {booking.state === "pending"
                    ? t("awaitingPayment")
                    : t("paidVia", { method: labelForMethod(booking.paymentMethod, t) })}
                </div>
              </div>
              {booking.price.depositCents > 0 ? (
                <div>
                  <span className="label-md text-ink-60">{t("depositHeld")}</span>
                  <div className="price-md text-ink-95">
                    {formatUsd(booking.price.depositCents)}
                  </div>
                  <div className="label-sm text-ink-50">{t("refundableOnReturn")}</div>
                </div>
              ) : null}
            </Card>
            <BookingSelfServiceActions
              booking={booking}
              context="confirmation"
              showCard={false}
            />
          </aside>
        </div>

        <NextSteps booking={booking} pickupBranch={pickupBranch?.name} />

        <AccountUpsell email={booking.driver.email} />

        <CrossSell />

      </section>

      <div aria-hidden="true">
        {/* hide stepper bottom margin on confirmation */}
        <span className="sr-only">router fallback for {router ? "navigation" : "none"}</span>
      </div>
    </>
  );
}

function SummaryBlock({
  title,
  location,
  datetime,
}: {
  title: string;
  location: string;
  datetime: string;
}) {
  return (
    <div>
      <h3 className="text-ink-50 mb-1 overline">{title}</h3>
      <p className="body-md text-ink-95">{location}</p>
      <p className="body-sm text-ink-60">{safeFormat(datetime, "EEE, dd MMM yyyy · HH:mm")}</p>
    </div>
  );
}

function NextSteps({
  booking,
  pickupBranch,
}: {
  booking: Booking;
  pickupBranch: string | undefined;
}) {
  const t = useTranslations("bookingFlow.confirmation");
  const items: string[] = [];
  items.push(t("stepBringLicence"));
  items.push(t("stepHaveRef"));
  items.push(t("stepWhatsapp24h"));
  if (booking.pickup.type === "branch" && pickupBranch) {
    items.push(t("stepPickupAt", { branch: pickupBranch }));
  }
  if (booking.pickup.type === "address-delivery" && booking.pickup.address) {
    items.push(t("stepDeliverTo", { address: booking.pickup.address }));
  }
  if (booking.paymentMethod === "cash") {
    items.push(t("stepBringCash"));
  }
  if (booking.state === "pending" && booking.paymentMethod === "transfer") {
    items.push(t("stepSendTransfer"));
  }
  if (booking.state === "pending" && booking.paymentMethod === "omt") {
    items.push(t("stepPayOmt"));
  }

  return (
    <section className="mt-10">
      <h2 className="headline-md text-ink-95">{t("nextSteps")}</h2>
      <ul className="mt-4 flex flex-col gap-2">
        {items.map((line) => (
          <li key={line} className="body-md text-ink-80 flex items-start gap-2">
            <Check className="text-success mt-1 size-4 shrink-0" aria-hidden="true" />
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AccountUpsell({ email }: { email: string }) {
  const t = useTranslations("bookingFlow.confirmation");
  const { session, ready } = useSession();

  // Guest-only CTA — skip while session hydrates and whenever already signed in.
  if (!ready || session) return null;

  return (
    <section className="mt-10">
      <Card
        variant="inverse"
        className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="min-w-0">
          <h2 className="headline-sm">{t("upsellHeading")}</h2>
          <p className="body-sm text-paper/85 break-words">
            {t("upsellBody", { email })}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-3">
          <Button asChild variant="cta" size="md">
            <Link href={`/register?email=${encodeURIComponent(email)}`}>{t("createAccount")}</Link>
          </Button>
          <Button
            asChild
            variant="tertiary"
            size="md"
            className="text-paper hover:text-paper hover:bg-white/10"
          >
            <Link href="/">{t("noThanks")}</Link>
          </Button>
        </div>
      </Card>
    </section>
  );
}

function CrossSell() {
  const t = useTranslations("bookingFlow.confirmation");
  return (
    <section className="mt-10">
      <Card
        variant="muted"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="headline-sm text-ink-95">{t("crossSellHeading")}</h2>
          <p className="body-sm text-ink-60">{t("crossSellBody")}</p>
        </div>
        <Button asChild variant="secondary" size="md">
          <Link href="/long-term">{t("crossSellCta")} →</Link>
        </Button>
      </Card>
    </section>
  );
}

function labelForMethod(
  method: Booking["paymentMethod"],
  t: ReturnType<typeof useTranslations<"bookingFlow.confirmation">>,
): string {
  switch (method) {
    case "card":
      return t("methodCard");
    case "cash":
      return t("methodCash");
    case "transfer":
      return t("methodTransfer");
    case "omt":
      return t("methodOmt");
    case "whish-online":
      return t("methodWhish");
    case "neo":
      return t("methodNeo");
    default:
      return method;
  }
}

function safeFormat(iso: string, pattern: string): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}
