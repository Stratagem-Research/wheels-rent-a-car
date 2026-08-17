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
import { PaymentMethodSelector } from "@/components/booking/PaymentMethodSelector";
import { useBookingFunnelPage } from "@/hooks/useBookingFunnelPage";
import { useSession } from "@/hooks/useSession";
import { whatsAppHref } from "@/lib/whatsapp";
import { api, ApiError } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import { isValidPhoneNational, phoneValueFromStored, toE164 } from "@/lib/booking/phone";
import { computePrice, formatUsd } from "@/lib/booking/pricing";
import { draftToSearchParams } from "@/lib/booking/draft-to-search-params";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import type { BookingDriver, PaymentMethod, SubmitBookingResponse, User, UserDocument } from "@/types/domain";
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
  whatsappOptIn: false, // Outbound WhatsApp not implemented; opt-in UI removed at checkout.
  licenceNumber: "",
  licenceIssue: "",
  licenceExpiry: "",
  licenceCountry: "LB",
  flightNumber: "",
  deliveryAddress: "",
  paymentMethod: null,
  termsAccepted: false,
  marketing: false,
  promoOpen: false,
  promoCode: "",
});

export default function CheckoutPage() {
  const tPayment = useTranslations("checkoutPayment");
  const t = useTranslations("bookingFlow.checkout");
  const router = useRouter();
  const {
    draft,
    setDraft,
    ready,
    vehicle,
    showSkeleton,
    addOns: ADD_ONS,
    protectionTiers: PROTECTION_TIERS,
    branches: BRANCHES,
  } = useBookingFunnelPage({ requireProtection: true });
  const { session, ready: sessionReady } = useSession();
  const [form, setForm] = React.useState<CheckoutFormState>(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const firedStarted = React.useRef(false);
  const verifiedAvailability = React.useRef(false);

  // Prefill empty fields from draft.driver and/or logged-in profile + licence vault.
  // Safe to re-run: only fills blanks (won’t clobber typed values). No “done” ref —
  // React Strict Mode remounts wipe state but leave refs, which would skip fill.
  React.useEffect(() => {
    if (!ready || !sessionReady) return;

    const driver = draft?.driver;
    const user = session?.user;

    setForm((prev) => {
      let next = prev;
      if (driver) next = applyDriverToForm(next, driver);
      if (user) next = applyProfileToForm(next, user);
      return next;
    });

    if (!user) return;

    let cancelled = false;
    void api
      .get<{ items: UserDocument[] }>(endpoints.accountDocuments)
      .then((res) => {
        if (cancelled) return;
        const licence = res.items.find((d) => d.type === "licence");
        if (!licence) return;
        setForm((prev) => applyLicenceToForm(prev, licence));
      })
      .catch(() => {
        // Vault optional — leave licence fields empty if unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [ready, sessionReady, session?.user?.id, draft?.driver]);

  // Re-check Wizard availability before the customer fills the form.
  React.useEffect(() => {
    if (!ready || !draft?.vehicle?.vehicleId || verifiedAvailability.current) return;
    verifiedAvailability.current = true;
    void api
      .post<{ available: boolean; reason?: string | null }>(endpoints.bookingVerifyVehicle, {
        vehicleId: draft.vehicle.vehicleId,
        pickup: draft.pickup,
        return: draft.return,
      })
      .then((result) => {
        if (result.available) return;
        const detail = result.reason ? ` (${result.reason})` : "";
        toast.warning(`${t("vehicleTaken")}${detail}`);
        const params = draftToSearchParams(draft);
        params.set("step", "1");
        router.replace(`/vehicles?${params.toString()}`);
      })
      .catch(() => {
        // Non-blocking — submit path re-checks anyway.
      });
  }, [draft, ready, router, t]);

  // Fire checkout_started once.
  React.useEffect(() => {
    if (!ready || !draft || firedStarted.current) return;
    firedStarted.current = true;
    track(EVENTS.CHECKOUT_STARTED);
  }, [ready, draft]);

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

  if (showSkeleton || !draft || !draft.vehicle) {
    return (
      <>
        <Stepper current={4} />
        <div className="mx-auto max-w-[var(--container-full)] px-5 py-10 sm:px-5">
          <Skeleton className="h-40 rounded-lg" />
        </div>
      </>
    );
  }

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
    else if (!isValidPhoneNational(form.phone.countryIso, form.phone.national)) {
      e.phone = t("mobileInvalid");
    }
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
    const completeDraft = {
      ...draft,
      pickup:
        draft.pickup.type === "address-delivery" && form.deliveryAddress.trim()
          ? { ...draft.pickup, address: form.deliveryAddress.trim() }
          : draft.pickup,
      driver: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: toE164(form.phone.countryIso, form.phone.national),

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

    try {
      // Update the draft so confirmation page reads consistent state.
      setDraft(completeDraft);

      const response = await api.post<SubmitBookingResponse>(endpoints.bookingSubmit, {
        draft: completeDraft,
      });

      if (form.paymentMethod === "whish-online") {
        const whish = await api.post<{ collectUrl: string; externalId: number }>(
          endpoints.paymentsWhishCreate,
          {
            bookingReference: response.booking.ref,
            customerEmail: completeDraft.driver.email,
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

      if (form.paymentMethod === "neo") {
        const neo = await api.post<{ collectUrl: string; externalId: string }>(
          endpoints.paymentsNeoCreate,
          {
            bookingReference: response.booking.ref,
            customerEmail: completeDraft.driver.email,
            amount: Number((price.totalCents / 100).toFixed(2)),
            currency: "USD",
            invoice: `Wheels booking ${response.booking.ref}`,
          },
        );
        track(EVENTS.PAYMENT_METHOD_SELECTED, {
          method: "neo",
          bookingRef: response.booking.ref,
        });
        clearHold();
        window.location.href = neo.collectUrl;
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
        const errBody = err.body as { reason?: string; message?: string } | null;
        const detail = errBody?.reason ?? errBody?.message;
        toast.warning(detail ? `${t("vehicleTaken")} (${detail})` : t("vehicleTaken"));
        router.push(`/vehicles?${(() => {
          const params = draftToSearchParams(completeDraft);
          params.set("step", "1");
          return params.toString();
        })()}`);
      } else if (err instanceof ApiError && err.status === 429) {
        toast.warning(t("rateLimited"));
      } else if (err instanceof ApiError && err.status === 503) {
        toast.warning(tPayment("whishUnavailable"));
      } else if (err instanceof ApiError) {
        const errBody = err.body as { message?: string; reason?: string } | null;
        const detail = errBody?.reason ?? errBody?.message;
        toast.error(detail ?? t("submitError"));
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
      case "neo":
        return `${tPayment("continueToNeo")} ${formatUsd(price.totalCents)}`;
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
              />
              {errors.paymentMethod ? <ErrorText>{errors.paymentMethod}</ErrorText> : null}
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
              className="h-auto min-h-14 whitespace-normal text-balance text-center leading-snug py-3 sm:w-auto sm:self-start"
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

function applyDriverToForm(form: CheckoutFormState, driver: BookingDriver): CheckoutFormState {
  const country = normalizeCountryCode(driver.country) ?? form.country;
  return {
    ...form,
    firstName: form.firstName || driver.firstName,
    lastName: form.lastName || driver.lastName,
    email: form.email || driver.email,
    phone: form.phone.national ? form.phone : phoneValueFromStored(driver.phone, country),
    dob: form.dob || driver.dob,
    country: form.country !== "LB" || !driver.country ? form.country || country : country,
    licenceNumber: form.licenceNumber || driver.licenceNumber,
    licenceIssue: form.licenceIssue || driver.licenceIssue,
    licenceExpiry: form.licenceExpiry || driver.licenceExpiry,
  };
}

function applyProfileToForm(form: CheckoutFormState, user: User): CheckoutFormState {
  const country = normalizeCountryCode(user.country) ?? form.country;
  return {
    ...form,
    firstName: form.firstName || user.firstName,
    lastName: form.lastName || user.lastName,
    email: form.email || user.email,
    phone: form.phone.national
      ? form.phone
      : phoneValueFromStored(user.phone, country),
    dob: form.dob || user.dob || "",
    country: form.country === "LB" && user.country ? country : form.country || country,
    marketing: form.marketing || user.preferences.marketing,
  };
}

function applyLicenceToForm(form: CheckoutFormState, licence: UserDocument): CheckoutFormState {
  return {
    ...form,
    licenceNumber: form.licenceNumber || licence.number,
    licenceIssue: form.licenceIssue || licence.issueDate,
    licenceExpiry: form.licenceExpiry || licence.expiryDate,
    licenceCountry:
      form.licenceCountry !== "LB" || !licence.issuingCountry
        ? form.licenceCountry
        : normalizeCountryCode(licence.issuingCountry) ?? form.licenceCountry,
  };
}

function normalizeCountryCode(code: string | undefined | null): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  if ((COUNTRY_CODES as readonly string[]).includes(upper)) return upper;
  if (upper === "OTHER") return "OTHER";
  return null;
}
