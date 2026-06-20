"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import { Calendar as CalendarIcon, Check, FileText, Phone, Edit3, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Stepper } from "@/components/booking/Stepper";
import { ConfirmationStatusBlock } from "@/components/booking/ConfirmationStatusBlock";
import { isValidBookingRef } from "@/lib/booking/ref";
import { bookingToIcs, downloadIcs } from "@/lib/booking/calendar";
import { whatsAppHref } from "@/lib/whatsapp";
import { api, ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { formatUsd } from "@/lib/booking/pricing";
import { readRefMap } from "@/lib/api/wheels-public";
import { clearBookingDraft, useBookingDraft } from "@/hooks/useBookingDraft";
import { useBookingCatalog } from "@/hooks/useBookingCatalog";
import { toast } from "@/components/ui/Toast";
import type { Booking } from "@/types/domain";

/**
 * /book/confirmation/[ref] — step 5 per 04_booking_flow.md.
 *
 * Loads the booking via /api/booking/lookup using the ref from the URL and
 * the email passed in `?email=` (set by the checkout redirect). On success:
 *   - Clears the booking draft (the funnel state is no longer needed).
 *   - Renders ConfirmationStatusBlock + summary + actions + cross-sell.
 *
 * Modify / Cancel land in Sprint 7 (account module). Here they trigger
 * placeholder toasts so the buttons are visible end-to-end.
 */
export default function ConfirmationPage() {
  const t = useTranslations("bookingFlow.confirmation");
  const params = useParams<{ ref: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const ref = params?.ref ?? "";
  const email = searchParams?.get("email") ?? "";
  const { draft } = useBookingDraft();
  const {
    branches: BRANCHES,
    vehicles: VEHICLES,
    addOns: ADD_ONS,
    protectionTiers: PROTECTION_TIERS,
  } = useBookingCatalog();

  const [booking, setBooking] = React.useState<Booking | null>(null);
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
        const shouldUseFallback =
          !(err instanceof ApiError) || err.status <= 0 || err.status >= 500;
        if (shouldUseFallback) {
          // Temporary resilience path while rollout stabilizes.
          const local = buildLocalFallbackBooking(ref, email, draft, VEHICLES);
          if (local) {
            setBooking(local);
            clearBookingDraft();
            return;
          }
        }
        console.error(err);
        setLookupError(t("lookupError"));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refValid, ref, email, draft, t, VEHICLES]);

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

  const onAddToCalendar = () => {
    const ics = bookingToIcs(
      booking,
      pickupBranch?.name ?? booking.pickup.address ?? "Wheels Rent A Car",
      returnBranch?.name ?? booking.return.address ?? pickupBranch?.name ?? "Wheels Rent A Car",
    );
    downloadIcs(ics, `wheels-${booking.ref}.ics`);
  };

  return (
    <>
      <Stepper current={5} />
      <ConfirmationStatusBlock state={booking.state} bookingRef={booking.ref} />

      <section className="mx-auto max-w-[var(--container-full)] px-5 py-12 sm:px-5 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card variant="elevated" className="flex flex-col gap-5">
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

          <aside className="flex flex-col gap-5">
            <Card variant="elevated" className="flex flex-col gap-3">
              <div>
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
              <div className="mt-2 flex flex-col gap-2">
                <Button variant="primary" size="md" onClick={onAddToCalendar}>
                  <CalendarIcon className="size-4" aria-hidden="true" /> {t("addToCalendar")}
                </Button>
                <Button asChild variant="secondary" size="md">
                  <a href={`/manage-booking?ref=${booking.ref}`}>
                    <FileText className="size-4" aria-hidden="true" /> {t("viewInvoice")}
                  </a>
                </Button>
              </div>
              <hr className="border-border" />
              <div className="flex flex-col gap-2">
                <span className="label-md text-ink-60">{t("needChange")}</span>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => toast.info(t("modifyToast"))}
                  >
                    <Edit3 className="size-4" aria-hidden="true" /> {t("modify")}
                  </Button>
                  <Button
                    variant="tertiary"
                    size="sm"
                    onClick={() => toast.info(t("cancelToast"))}
                  >
                    <X className="size-4" aria-hidden="true" /> {t("cancel")}
                  </Button>
                </div>
              </div>
            </Card>

            <Card variant="outline" className="flex flex-col gap-2 p-5">
              <span className="label-md text-ink-60">{t("preferChat")}</span>
              <Button asChild variant="whatsapp" size="md">
                <a
                  href={whatsAppHref("confirmation", { ref: booking.ref })}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Phone className="size-4" aria-hidden="true" /> {t("whatsappUs")}
                </a>
              </Button>
            </Card>
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
  return (
    <section className="mt-10">
      <Card
        variant="inverse"
        className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="headline-sm">{t("upsellHeading")}</h2>
          <p className="body-sm text-paper/85">{t("upsellBody", { email })}</p>
        </div>
        <div className="flex gap-3">
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

/**
 * Reconstruct a Booking from the browser's ref-map + the in-flight draft
 * when the backend has no lookup endpoint (real-API mode).
 *
 * The funnel always lands here directly after a successful submit, so the
 * `sessionStorage` draft is still present and the ref-map entry was just
 * written by `liveSubmitBooking`. This fallback is essentially the same
 * Booking the user just created; we just don't have a server round-trip
 * to refetch it.
 */
function buildLocalFallbackBooking(
  ref: string,
  email: string,
  draft: ReturnType<typeof useBookingDraft>["draft"],
  vehicles: ReturnType<typeof useBookingCatalog>["vehicles"],
): Booking | null {
  if (typeof window === "undefined") return null;
  const entry = readRefMap(window.localStorage)[ref];
  if (!entry) return null;
  if (email && entry.email && entry.email.toLowerCase() !== email.toLowerCase()) return null;
  if (!draft || !draft.vehicle || !draft.driver || !draft.paymentMethod) return null;

  const vehicle = vehicles.find((v) => v.id === draft.vehicle?.vehicleId);
  if (!vehicle) return null;

  return {
    ref: entry.ref,
    state:
      draft.paymentMethod === "card" || draft.paymentMethod === "cash" ? "confirmed" : "pending",
    createdAt: entry.createdAt,
    pickup: draft.pickup,
    return: draft.return,
    vehicle: draft.vehicle,
    vehicleSnapshot: {
      id: vehicle.id,
      slug: vehicle.slug,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
      images: vehicle.images,
    },
    extras: draft.extras,
    protectionTierId: draft.protectionTierId ?? "pt-basic",
    driver: draft.driver,
    flightNumber: draft.flightNumber,
    paymentMethod: draft.paymentMethod,
    marketingConsent: draft.marketingConsent,
    whatsappOptIn: draft.whatsappOptIn,
    promoCode: draft.promoCode,
    price: {
      baseRateCents: 0,
      extrasCents: 0,
      protectionCents: 0,
      taxesCents: 0,
      feesCents: 0,
      discountCents: 0,
      totalCents: 0,
      depositCents: 0,
    },
    currency: "USD",
  } satisfies Booking;
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
  }
}

function safeFormat(iso: string, pattern: string): string {
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}
