"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { ErrorText, Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { PhoneInput, type PhoneValue } from "@/components/ui/PhoneInput";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { toast } from "@/components/ui/Toast";
import { Stepper } from "@/components/booking/Stepper";
import { FlowSummaryPanel } from "@/components/booking/FlowSummaryPanel";
import { HoldTimer, clearHold } from "@/components/booking/HoldTimer";
import {
  PaymentMethodSelector,
  type CardFormValue,
} from "@/components/booking/PaymentMethodSelector";
import { useBookingDraft } from "@/hooks/useBookingDraft";
import { whatsAppHref } from "@/lib/whatsapp";
import { api, ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { formatUsd } from "@/lib/booking/pricing";
import { computePrice } from "@/lib/booking/pricing";
import { BRANCHES } from "@/lib/api/mocks/fixtures/branches";
import { VEHICLES } from "@/lib/api/mocks/fixtures/vehicles";
import { ADD_ONS, PROTECTION_TIERS } from "@/lib/api/mocks/fixtures/catalog";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import type { PaymentMethod, SubmitBookingResponse } from "@/types/domain";
import { Link } from "@/i18n/navigation";

const COUNTRIES = [
  { code: "LB", name: "Lebanon" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "OTHER", name: "Other" },
];

interface CheckoutFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: PhoneValue;
  dob: string;
  country: string;
  whatsappOptIn: boolean;
  // Licence
  licenceNumber: string;
  licenceIssue: string;
  licenceExpiry: string;
  licenceCountry: string;
  // Conditional pickup details
  flightNumber: string;
  deliveryAddress: string;
  // Payment
  paymentMethod: PaymentMethod | null;
  card: CardFormValue;
  transferProof: File | null;
  omtReceipt: File | null;
  // Consents
  termsAccepted: boolean;
  marketing: boolean;
  // Promo
  promoOpen: boolean;
  promoCode: string;
}

const emptyForm = (): CheckoutFormState => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: { countryIso: "LB", national: "" },
  dob: "",
  country: "LB",
  whatsappOptIn: true,
  licenceNumber: "",
  licenceIssue: "",
  licenceExpiry: "",
  licenceCountry: "LB",
  flightNumber: "",
  deliveryAddress: "",
  paymentMethod: null,
  card: { number: "", expiry: "", cvv: "", holder: "" },
  transferProof: null,
  omtReceipt: null,
  termsAccepted: false,
  marketing: false,
  promoOpen: false,
  promoCode: "",
});

export default function CheckoutPage() {
  const tPayment = useTranslations("checkoutPayment");
  const router = useRouter();
  const { draft, setDraft, ready } = useBookingDraft();
  const [form, setForm] = React.useState<CheckoutFormState>(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const firedStarted = React.useRef(false);

  // Fire checkout_started once.
  React.useEffect(() => {
    if (!ready || !draft || firedStarted.current) return;
    firedStarted.current = true;
    track(EVENTS.CHECKOUT_STARTED);
  }, [ready, draft]);

  // Guard: vehicle or protection missing → bounce back.
  React.useEffect(() => {
    if (!ready || !draft) return;
    if (!draft.vehicle) router.replace("/book/select-vehicle");
    else if (!draft.protectionTierId) router.replace("/book/protection");
  }, [ready, draft, router]);

  // Idle WhatsApp prompt at 30s on checkout (00_global.md §6 hide rules).
  React.useEffect(() => {
    let id: number | null = null;
    const arm = () => {
      if (id !== null) window.clearTimeout(id);
      id = window.setTimeout(() => {
        toast.info(
          <span>
            Need help completing your booking?{" "}
            <a
              href={whatsAppHref("checkout")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:no-underline"
            >
              Chat with our team
            </a>
            .
          </span>,
          { duration: 8000 },
        );
      }, 30_000);
    };
    const events: (keyof DocumentEventMap)[] = ["keydown", "pointerdown"];
    events.forEach((e) => document.addEventListener(e, arm));
    arm();
    return () => {
      events.forEach((e) => document.removeEventListener(e, arm));
      if (id !== null) window.clearTimeout(id);
    };
  }, []);

  if (!ready || !draft || !draft.vehicle) {
    return (
      <>
        <Stepper current={4} />
        <div className="mx-auto max-w-[var(--container-full)] px-5 py-10 sm:px-5">
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </>
    );
  }

  const vehicle = VEHICLES.find((v) => v.id === draft.vehicle?.vehicleId);
  const price = computePrice({
    draft,
    vehicle,
    addOns: ADD_ONS,
    tiers: PROTECTION_TIERS,
  });

  const onPaymentMethod = (m: PaymentMethod) => {
    setForm((f) => ({ ...f, paymentMethod: m }));
    track(EVENTS.PAYMENT_METHOD_SELECTED, { method: m });
  };

  const validate = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "First name is required.";
    if (!form.lastName.trim()) e.lastName = "Last name is required.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = "Enter a valid email.";
    if (!form.phone.national.trim()) e.phone = "Mobile number is required.";
    if (!form.dob) e.dob = "Date of birth is required.";
    if (!form.licenceNumber.trim()) e.licenceNumber = "Licence number is required.";
    if (!form.licenceIssue) e.licenceIssue = "Issue date is required.";
    if (!form.licenceExpiry) e.licenceExpiry = "Expiry date is required.";
    if (draft.pickup.type === "airport" && !form.flightNumber.trim()) {
      e.flightNumber = "Flight number is required for airport pickups.";
    }
    if (
      draft.pickup.type === "address-delivery" &&
      !form.deliveryAddress.trim() &&
      !draft.pickup.address
    ) {
      e.deliveryAddress = "Delivery address is required.";
    }
    if (!form.paymentMethod) e.paymentMethod = tPayment("choosePaymentMethod");
    if (form.paymentMethod === "card") {
      if (form.card.number.replace(/\s/g, "").length < 12) e.card = tPayment("cardErrorNumber");
      if (!form.card.expiry.match(/^\d{2}\/?\d{2}$/)) e.card = tPayment("cardErrorExpiry");
      if (!form.card.cvv.match(/^\d{3,4}$/)) e.card = tPayment("cardErrorCvv");
      if (!form.card.holder.trim()) e.card = tPayment("cardErrorHolder");
    }
    if (form.paymentMethod === "transfer" && !form.transferProof) {
      e.transferProof = tPayment("transferProofRequired");
    }
    if (!form.termsAccepted) e.terms = "Please accept the Terms & Conditions.";
    return e;
  };

  const onSubmit = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) {
      const first = document.querySelector<HTMLElement>('[aria-invalid="true"]');
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
      first?.focus?.({ preventScroll: true });
      return;
    }

    setSubmitting(true);
    try {
      const completeDraft = {
        ...draft,
        driver: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email.trim().toLowerCase(),
          phone: `+${getDial(form.phone.countryIso)}${form.phone.national.replace(/\D/g, "")}`,
          dob: form.dob,
          licenceNumber: form.licenceNumber.trim(),
          licenceIssue: form.licenceIssue,
          licenceExpiry: form.licenceExpiry,
          country: form.country,
        },
        flightNumber: draft.pickup.type === "airport" ? form.flightNumber.trim() : undefined,
        paymentMethod: form.paymentMethod ?? undefined,
        marketingConsent: form.marketing,
        whatsappOptIn: form.whatsappOptIn,
        promoCode: form.promoCode.trim() || draft.promoCode,
      };

      // Update the draft so confirmation page reads consistent state.
      setDraft(completeDraft);

      const response = await api.post<SubmitBookingResponse>(endpoints.bookingSubmit, {
        draft: completeDraft,
        paymentToken: form.paymentMethod === "card" ? "mock_pm_token" : undefined,
        proofFileId: form.transferProof ? "mock_proof_file" : undefined,
      });

      if (form.paymentMethod === "whish-online") {
        const whish = await api.post<{ collectUrl: string; externalId: number }>(
          endpoints.paymentsWhishCreate,
          {
            bookingReference: response.booking.ref,
            amount: Number((price.totalCents / 100).toFixed(2)),
            currency: "USD",
            invoice: `Wheels booking ${response.booking.ref}`,
          },
        );
        track(EVENTS.PAYMENT_METHOD_SELECTED, {
          method: "whish-online",
          bookingRef: response.booking.ref,
        });
        clearHold();
        window.location.href = whish.collectUrl;
        return;
      }

      track(EVENTS.BOOKING_COMPLETED, {
        ref: response.booking.ref,
        state: response.booking.state,
        method: form.paymentMethod ?? "",
      });

      clearHold();
      router.push(
        `/book/confirmation/${response.booking.ref}?email=${encodeURIComponent(completeDraft.driver.email)}`,
      );
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 409) {
        // Vehicle was booked under us between availability and submit.
        // Per 04_booking_flow.md edge-case "Vehicle becomes unavailable
        // after step 1", redirect back with an explanatory toast.
        toast.warning("That vehicle was just taken — choose another.");
        router.push("/vehicles?step=1");
      } else if (err instanceof ApiError && err.status === 503) {
        toast.warning(tPayment("whishUnavailable"));
      } else {
        toast.error(
          "We couldn't submit your booking. Please try again or chat with us on WhatsApp.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const ctaLabel = (() => {
    switch (form.paymentMethod) {
      case "card":
        return `${tPayment("payAndConfirm")} ${formatUsd(price.totalCents)}`;
      case "cash":
        return tPayment("confirmReservation");
      case "whish-online":
        return `${tPayment("continueToWhish")} ${formatUsd(price.totalCents)}`;
      case "transfer":
      case "omt":
        return tPayment("submitPendingVerification");
      default:
        return `${tPayment("payAndConfirm")} ${formatUsd(price.totalCents)}`;
    }
  })();

  return (
    <>
      <Stepper current={4} />
      <HoldTimer
        onExpire={() =>
          toast.warning("Your booking hold expired. We'll recheck pricing on submit.")
        }
      />
      <section className="mx-auto max-w-[var(--container-full)] px-5 py-8 sm:px-5 sm:py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <form
            className="flex flex-col gap-8"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            noValidate
          >
            <DriverInfoSection form={form} setForm={setForm} errors={errors} />
            <DriverLicenceSection form={form} setForm={setForm} errors={errors} />
            {draft.pickup.type === "airport" || draft.pickup.type === "address-delivery" ? (
              <PickupDetailsSection
                type={draft.pickup.type}
                addressPrefill={draft.pickup.address ?? ""}
                form={form}
                setForm={setForm}
                errors={errors}
              />
            ) : null}

            <section aria-labelledby="payment-heading" className="flex flex-col gap-3">
              <h2 id="payment-heading" className="headline-md text-ink-95">
                {tPayment("howWouldYouLikeToPay")}
              </h2>
              <PaymentMethodSelector
                value={form.paymentMethod}
                onValueChange={onPaymentMethod}
                card={form.card}
                onCardChange={(c) => setForm((f) => ({ ...f, card: c }))}
                cardError={errors.card}
                transferProof={form.transferProof}
                onTransferProofChange={(file) => setForm((f) => ({ ...f, transferProof: file }))}
                omtReceipt={form.omtReceipt}
                onOmtReceiptChange={(file) => setForm((f) => ({ ...f, omtReceipt: file }))}
              />
              {errors.paymentMethod ? <ErrorText>{errors.paymentMethod}</ErrorText> : null}
              {errors.transferProof ? <ErrorText>{errors.transferProof}</ErrorText> : null}
            </section>

            <PromoSection form={form} setForm={setForm} />

            <section className="flex flex-col gap-3">
              <Checkbox
                checked={form.termsAccepted}
                onCheckedChange={(c) => setForm((f) => ({ ...f, termsAccepted: c === true }))}
                label={
                  <>
                    I agree to the{" "}
                    <Link href="/terms" className="text-ink-100 underline-offset-2 hover:underline">
                      Terms &amp; Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="text-ink-100 underline-offset-2 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </>
                }
              />
              {errors.terms ? <ErrorText>{errors.terms}</ErrorText> : null}
              <Checkbox
                checked={form.marketing}
                onCheckedChange={(c) => setForm((f) => ({ ...f, marketing: c === true }))}
                label="Send me promotions and updates from Wheels."
              />
            </section>

            <Button
              type="submit"
              variant="cta"
              size="lg"
              loading={submitting}
              fullWidth
              className="sm:w-auto sm:self-start"
            >
              {ctaLabel}
            </Button>
          </form>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <FlowSummaryPanel
              draft={draft}
              vehicle={vehicle}
              branches={BRANCHES}
              addOns={ADD_ONS}
              tiers={PROTECTION_TIERS}
              primary={{
                label: ctaLabel,
                onClick: onSubmit,
                disabled: submitting,
              }}
            />
          </aside>
        </div>
      </section>
    </>
  );
}

function DriverInfoSection({
  form,
  setForm,
  errors,
}: {
  form: CheckoutFormState;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormState>>;
  errors: Record<string, string>;
}) {
  return (
    <section aria-labelledby="driver-info" className="flex flex-col gap-5">
      <h2 id="driver-info" className="headline-md text-ink-95">
        Your information
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" required error={errors.firstName}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="given-name"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Last name" required error={errors.lastName}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              autoComplete="family-name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Email" required error={errors.email}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Mobile" required error={errors.phone}>
          {({ id, describedBy, invalid }) => (
            <PhoneInput
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.phone}
              onValueChange={(phone) => setForm((f) => ({ ...f, phone }))}
            />
          )}
        </Field>
        <Field label="Date of birth" required error={errors.dob}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="date"
              autoComplete="bday"
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.dob}
              onChange={(e) => setForm((f) => ({ ...f, dob: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Country of residence" required>
          {({ id }) => (
            <Select
              id={id}
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Checkbox
        checked={form.whatsappOptIn}
        onCheckedChange={(c) => setForm((f) => ({ ...f, whatsappOptIn: c === true }))}
        label="Send my booking updates via WhatsApp."
      />
    </section>
  );
}

function DriverLicenceSection({
  form,
  setForm,
  errors,
}: {
  form: CheckoutFormState;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormState>>;
  errors: Record<string, string>;
}) {
  return (
    <section aria-labelledby="licence-info" className="flex flex-col gap-5">
      <h2 id="licence-info" className="headline-md text-ink-95">
        Driver&apos;s licence
      </h2>
      <p className="body-sm text-ink-60 -mt-2">
        We&apos;ll verify at pickup. Foreign licences must be in Latin script — bring your passport.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Licence number" required error={errors.licenceNumber}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.licenceNumber}
              onChange={(e) => setForm((f) => ({ ...f, licenceNumber: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Issuing country" required>
          {({ id }) => (
            <Select
              id={id}
              value={form.licenceCountry}
              onChange={(e) => setForm((f) => ({ ...f, licenceCountry: e.target.value }))}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label="Issue date" required error={errors.licenceIssue}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="date"
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.licenceIssue}
              onChange={(e) => setForm((f) => ({ ...f, licenceIssue: e.target.value }))}
            />
          )}
        </Field>
        <Field label="Expiry date" required error={errors.licenceExpiry}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="date"
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.licenceExpiry}
              onChange={(e) => setForm((f) => ({ ...f, licenceExpiry: e.target.value }))}
            />
          )}
        </Field>
      </div>
    </section>
  );
}

function PickupDetailsSection({
  type,
  addressPrefill,
  form,
  setForm,
  errors,
}: {
  type: "airport" | "address-delivery";
  addressPrefill: string;
  form: CheckoutFormState;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormState>>;
  errors: Record<string, string>;
}) {
  return (
    <section aria-labelledby="pickup-details" className="flex flex-col gap-5">
      <h2 id="pickup-details" className="headline-md text-ink-95">
        Pickup details
      </h2>
      {type === "airport" ? (
        <Field
          label="Flight number"
          required
          helper="Helps us track your arrival and adjust pickup time."
          error={errors.flightNumber}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              placeholder="e.g. ME203"
              value={form.flightNumber}
              onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value }))}
            />
          )}
        </Field>
      ) : null}
      {type === "address-delivery" ? (
        <Field
          label="Delivery address"
          required
          helper="We deliver anywhere in Greater Beirut."
          error={errors.deliveryAddress}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={form.deliveryAddress || addressPrefill}
              onChange={(e) => setForm((f) => ({ ...f, deliveryAddress: e.target.value }))}
            />
          )}
        </Field>
      ) : null}
    </section>
  );
}

function PromoSection({
  form,
  setForm,
}: {
  form: CheckoutFormState;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormState>>;
}) {
  return (
    <section className="flex flex-col gap-3">
      {form.promoOpen ? (
        <Field label="Promo code" helper="Applied automatically if valid.">
          {({ id }) => (
            <Input
              id={id}
              placeholder="SUMMER15"
              value={form.promoCode}
              onChange={(e) => setForm((f) => ({ ...f, promoCode: e.target.value }))}
            />
          )}
        </Field>
      ) : (
        <button
          type="button"
          onClick={() => setForm((f) => ({ ...f, promoOpen: true }))}
          className="label-lg text-ink-100 hover:text-ink-80 focus-visible:outline-ink-100 self-start rounded-sm underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          Have a promo code?
        </button>
      )}
    </section>
  );
}

/** Lookup helper for phone country dial codes used at submit time. */
function getDial(iso: string): string {
  const codes: Record<string, string> = {
    LB: "961",
    US: "1",
    GB: "44",
    FR: "33",
    DE: "49",
    AE: "971",
    SA: "966",
  };
  return codes[iso] ?? "1";
}
