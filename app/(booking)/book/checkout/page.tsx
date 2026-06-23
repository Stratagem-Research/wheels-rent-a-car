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
import { useBookingCatalog } from "@/hooks/useBookingCatalog";
import { whatsAppHref } from "@/lib/whatsapp";
import { api, ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { computePrice, formatUsd } from "@/lib/booking/pricing";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import type { PaymentMethod, SubmitBookingResponse } from "@/types/domain";
import { Link } from "@/i18n/navigation";

const COUNTRY_CODES = ["LB", "US", "GB", "FR", "DE", "AE", "SA", "OTHER"] as const;

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
  const t = useTranslations("bookingFlow.checkout");
  const router = useRouter();
  const { draft, setDraft, ready } = useBookingDraft();
  const {
    addOns: ADD_ONS,
    protectionTiers: PROTECTION_TIERS,
    vehicles: VEHICLES,
    branches: BRANCHES,
  } = useBookingCatalog();
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
            {t("idlePrompt")}{" "}
            <a
              href={whatsAppHref("checkout")}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:no-underline"
            >
              {t("idlePromptLink")}
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
  }, [t]);

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
    if (!form.firstName.trim()) e.firstName = t("firstNameRequired");
    if (!form.lastName.trim()) e.lastName = t("lastNameRequired");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) e.email = t("emailInvalid");
    if (!form.phone.national.trim()) e.phone = t("mobileRequired");
    if (!form.dob) e.dob = t("dobRequired");
    if (!form.licenceNumber.trim()) e.licenceNumber = t("licenceNumberRequired");
    if (!form.licenceIssue) e.licenceIssue = t("issueDateRequired");
    if (!form.licenceExpiry) e.licenceExpiry = t("expiryDateRequired");
    if (draft.pickup.type === "airport" && !form.flightNumber.trim()) {
      e.flightNumber = t("flightRequired");
    }
    if (
      draft.pickup.type === "address-delivery" &&
      !form.deliveryAddress.trim() &&
      !draft.pickup.address
    ) {
      e.deliveryAddress = t("deliveryRequired");
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
    if (!form.termsAccepted) e.terms = t("acceptTerms");
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
      const tokenQuery = response.booking.publicToken
        ? `&token=${encodeURIComponent(response.booking.publicToken)}`
        : "";
      router.push(
        `/book/confirmation/${response.booking.ref}?email=${encodeURIComponent(completeDraft.driver.email)}${tokenQuery}`,
      );
    } catch (err) {
      console.error(err);
      if (err instanceof ApiError && err.status === 409) {
        // Vehicle was booked under us between availability and submit.
        // Per 04_booking_flow.md edge-case "Vehicle becomes unavailable
        // after step 1", redirect back with an explanatory toast.
        toast.warning(t("vehicleTaken"));
        router.push("/vehicles?step=1");
      } else if (err instanceof ApiError && err.status === 503) {
        toast.warning(tPayment("whishUnavailable"));
      } else {
        toast.error(t("submitError"));
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
      <HoldTimer onExpire={() => toast.warning(t("holdExpired"))} />
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
                label={t.rich("agreeTerms", {
                  terms: (chunks) => (
                    <Link href="/terms" className="text-ink-100 underline-offset-2 hover:underline">
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link
                      href="/privacy"
                      className="text-ink-100 underline-offset-2 hover:underline"
                    >
                      {chunks}
                    </Link>
                  ),
                })}
              />
              {errors.terms ? <ErrorText>{errors.terms}</ErrorText> : null}
              <Checkbox
                checked={form.marketing}
                onCheckedChange={(c) => setForm((f) => ({ ...f, marketing: c === true }))}
                label={t("marketing")}
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
  const t = useTranslations("bookingFlow.checkout");
  return (
    <section aria-labelledby="driver-info" className="flex flex-col gap-5">
      <h2 id="driver-info" className="headline-md text-ink-95">
        {t("yourInformation")}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("firstName")} required error={errors.firstName}>
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
        <Field label={t("lastName")} required error={errors.lastName}>
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
        <Field label={t("email")} required error={errors.email}>
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
        <Field label={t("mobile")} required error={errors.phone}>
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
        <Field label={t("dob")} required error={errors.dob}>
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
        <Field label={t("countryOfResidence")} required>
          {({ id }) => (
            <Select
              id={id}
              value={form.country}
              onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
            >
              {COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`countries.${code}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>
      <Checkbox
        checked={form.whatsappOptIn}
        onCheckedChange={(c) => setForm((f) => ({ ...f, whatsappOptIn: c === true }))}
        label={t("whatsappOptIn")}
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
  const t = useTranslations("bookingFlow.checkout");
  return (
    <section aria-labelledby="licence-info" className="flex flex-col gap-5">
      <h2 id="licence-info" className="headline-md text-ink-95">
        {t("licenceHeading")}
      </h2>
      <p className="body-sm text-ink-60 -mt-2">{t("licenceHelper")}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("licenceNumber")} required error={errors.licenceNumber}>
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
        <Field label={t("issuingCountry")} required>
          {({ id }) => (
            <Select
              id={id}
              value={form.licenceCountry}
              onChange={(e) => setForm((f) => ({ ...f, licenceCountry: e.target.value }))}
            >
              {COUNTRY_CODES.map((code) => (
                <option key={code} value={code}>
                  {t(`countries.${code}`)}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Field label={t("issueDate")} required error={errors.licenceIssue}>
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
        <Field label={t("expiryDate")} required error={errors.licenceExpiry}>
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
  const t = useTranslations("bookingFlow.checkout");
  return (
    <section aria-labelledby="pickup-details" className="flex flex-col gap-5">
      <h2 id="pickup-details" className="headline-md text-ink-95">
        {t("pickupDetails")}
      </h2>
      {type === "airport" ? (
        <Field
          label={t("flightNumber")}
          required
          helper={t("flightHelper")}
          error={errors.flightNumber}
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              placeholder={t("flightPlaceholder")}
              value={form.flightNumber}
              onChange={(e) => setForm((f) => ({ ...f, flightNumber: e.target.value }))}
            />
          )}
        </Field>
      ) : null}
      {type === "address-delivery" ? (
        <Field
          label={t("deliveryAddress")}
          required
          helper={t("deliveryHelper")}
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
  const t = useTranslations("bookingFlow.checkout");
  return (
    <section className="flex flex-col gap-3">
      {form.promoOpen ? (
        <Field label={t("promoLabel")} helper={t("promoHelper")}>
          {({ id }) => (
            <Input
              id={id}
              placeholder={t("promoPlaceholder")}
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
          {t("havePromo")}
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
