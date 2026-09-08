"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
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
import { WIZARD_VEHICLE_UNKNOWN } from "@/lib/booking/wizard-vehicle-id";
import {
  writePendingLicence,
  writePendingAdditionalDriver,
  writePendingIdentity,
} from "@/lib/booking/pending-licence";
import { ADDITIONAL_DRIVER_ADDON_ID } from "@/lib/booking/addons";
import { AdditionalDriverFields } from "@/components/booking/AdditionalDriverFields";
import { track } from "@/lib/analytics/dataLayer";
import { EVENTS } from "@/lib/analytics/events";
import type { BookingDriver, PaymentMethod, SubmitBookingResponse, User, UserDocument } from "@/types/domain";
import { LicenceScanFields } from "@/components/account/LicenceScanFields";
import { DocumentScanPreview } from "@/components/account/DocumentScanPreview";
import { FileUpload } from "@/components/ui/FileUpload";
import {
  findIdentityDocument,
  isLebaneseResident,
} from "@/lib/booking/identity-document";

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
  licenceFrontFile: File | null;
  licenceBackFile: File | null;
  licenceFrontUrl: string;
  licenceBackUrl: string;
  // National ID or passport — Lebanese may choose either; international must use passport
  identityDocType: "id" | "passport";
  identityFrontFile: File | null;
  identityBackFile: File | null;
  identityFrontUrl: string;
  identityBackUrl: string;
  // Additional driver (only shown when that add-on is active)
  additionalDriverFirstName: string;
  additionalDriverLastName: string;
  additionalDriverFrontFile: File | null;
  additionalDriverBackFile: File | null;
  additionalDriverFrontUrl: string;
  additionalDriverBackUrl: string;
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
  licenceFrontFile: null,
  licenceBackFile: null,
  licenceFrontUrl: "",
  licenceBackUrl: "",
  identityDocType: "id",
  identityFrontFile: null,
  identityBackFile: null,
  identityFrontUrl: "",
  identityBackUrl: "",
  additionalDriverFirstName: "",
  additionalDriverLastName: "",
  additionalDriverFrontFile: null,
  additionalDriverBackFile: null,
  additionalDriverFrontUrl: "",
  additionalDriverBackUrl: "",
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
    goToStep,
    addOns: ADD_ONS,
    protectionTiers: PROTECTION_TIERS,
    branches: BRANCHES,
    deliveryPricing: DELIVERY_PRICING,
  } = useBookingFunnelPage({ requireProtection: true });
  const { session, ready: sessionReady } = useSession();
  const [form, setForm] = React.useState<CheckoutFormState>(emptyForm);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const firedStarted = React.useRef(false);
  const verifiedAvailability = React.useRef(false);

  const driver = draft?.driver;
  const user = session?.user;
  const vaultDocsRef = React.useRef<UserDocument[]>([]);
  const prefillReady = ready && sessionReady;
  const prefillKey = prefillReady
    ? `${user?.id ?? "guest"}:${driver?.firstName ?? ""}:${driver?.lastName ?? ""}:${driver?.email ?? ""}:${driver?.phone ?? ""}`
    : "";
  const [appliedPrefillKey, setAppliedPrefillKey] = React.useState("");
  if (prefillReady && prefillKey !== appliedPrefillKey) {
    setAppliedPrefillKey(prefillKey);
    setForm((prev) => {
      let next = prev;
      if (driver) next = applyDriverToForm(next, driver);
      if (user) next = applyProfileToForm(next, user);
      return next;
    });
  }

  // Prefill licence / identity / additional-driver fields from the vault.
  // setState lives in the async callbacks — not the effect body — so it stays
  // off the cascading-render path.
  React.useEffect(() => {
    if (!ready || !sessionReady || !session?.user) return;

    let cancelled = false;
    void api
      .get<{ items: UserDocument[] }>(endpoints.accountDocuments)
      .then((res) => {
        if (cancelled) return;
        vaultDocsRef.current = res.items;
        const licence = res.items.find((d) => d.type === "licence");
        setForm((prev) => {
          let next = prev;
          if (licence) next = applyLicenceToForm(next, licence);
          const country = session.user.country || next.country;
          const identity = findIdentityDocument(res.items, country);
          if (identity) next = applyIdentityToForm(next, identity, true);
          return next;
        });
      })
      .catch(() => {
        // Vault optional — leave document fields empty if unavailable.
      });

    void api
      .get<{ driver: { firstName: string; lastName: string; scanFrontUrl?: string; scanBackUrl?: string } | null }>(
        endpoints.accountAdditionalDriver,
      )
      .then((res) => {
        if (cancelled || !res.driver) return;
        setForm((prev) => applyAdditionalDriverToForm(prev, res.driver!));
      })
      .catch(() => {
        // Optional — leave additional-driver fields empty if unavailable.
      });

    return () => {
      cancelled = true;
    };
  }, [ready, sessionReady, session?.user]);

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
        if (result.reason === "unknown_vehicle") {
          toast.warning(WIZARD_VEHICLE_UNKNOWN);
          router.replace("/vehicles");
          return;
        }
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
        <div className="mx-auto max-w-(--container-full) px-4 py-8 sm:px-5">
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
    branches: BRANCHES,
    deliveryPricing: DELIVERY_PRICING,
  });

  const hasAdditionalDriver = draft.extras.some(
    (e) => e.addOnId === ADDITIONAL_DRIVER_ADDON_ID && e.qty > 0,
  );

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
    if (!form.licenceFrontFile && !form.licenceFrontUrl) e.licenceFront = t("licenceFrontRequired");
    if (!form.licenceBackFile && !form.licenceBackUrl) e.licenceBack = t("licenceBackRequired");
    if (isLebaneseResident(form.country)) {
      if (form.identityDocType === "id") {
        if (!form.identityFrontFile && !form.identityFrontUrl) e.identityFront = t("idFrontRequired");
        if (!form.identityBackFile && !form.identityBackUrl) e.identityBack = t("idBackRequired");
      } else {
        if (!form.identityFrontFile && !form.identityFrontUrl) e.identityFront = t("passportRequired");
      }
    } else {
      if (!form.identityFrontFile && !form.identityFrontUrl) e.identityFront = t("passportRequired");
    }
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
    if (hasAdditionalDriver) {
      if (!form.additionalDriverFirstName.trim()) {
        e.additionalDriverFirstName = t("additionalDriverFirstNameRequired");
      }
      if (!form.additionalDriverLastName.trim()) {
        e.additionalDriverLastName = t("additionalDriverLastNameRequired");
      }
      if (!form.additionalDriverFrontFile && !form.additionalDriverFrontUrl) {
        e.additionalDriverFront = t("licenceFrontRequired");
      }
      if (!form.additionalDriverBackFile && !form.additionalDriverBackUrl) {
        e.additionalDriverBack = t("licenceBackRequired");
      }
    }
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
        licenceFrontPath: undefined as string | undefined,
        licenceBackPath: undefined as string | undefined,
      },
      additionalDriver: hasAdditionalDriver
        ? {
          firstName: form.additionalDriverFirstName.trim(),
          lastName: form.additionalDriverLastName.trim(),
        }
        : undefined,
      flightNumber: draft.pickup.type === "airport" ? form.flightNumber.trim() : undefined,
      paymentMethod: form.paymentMethod ?? undefined,
      marketingConsent: form.marketing,
      whatsappOptIn: form.whatsappOptIn,
      promoCode: form.promoCode.trim() || draft.promoCode,
    };

    try {
      if (session?.user.id) {
        try {
          await persistLicenceToProfile(form);
        } catch {
          toast.warning(t("licenceProfileSaveFailed"));
        }
        try {
          await persistIdentityToProfile(form);
        } catch {
          toast.warning(t("identityProfileSaveFailed"));
        }
        if (hasAdditionalDriver) {
          try {
            await persistAdditionalDriverToProfile(form);
          } catch {
            toast.warning(t("additionalDriverProfileSaveFailed"));
          }
        }
      } else {
        try {
          const { frontUrl, backUrl, frontPath, backPath } = await uploadGuestScans(
            form.licenceFrontFile,
            form.licenceBackFile,
          );
          if (frontUrl || backUrl) {
            writePendingLicence({
              licenceNumber: form.licenceNumber.trim(),
              licenceIssue: form.licenceIssue,
              licenceExpiry: form.licenceExpiry,
              licenceCountry: form.licenceCountry,
              licenceFrontUrl: frontUrl,
              licenceBackUrl: backUrl,
            });
          }
          // Also persist the permanent storage paths onto the booking record
          // itself — a durable fallback for the account/documents page to
          // backfill from later, in case the sessionStorage handoff above
          // (consumed once by the register page) never completes.
          if (frontPath) completeDraft.driver.licenceFrontPath = frontPath;
          if (backPath) completeDraft.driver.licenceBackPath = backPath;
        } catch {
          // Best-effort — a guest can still add their licence from their
          // account later, so this never blocks the booking itself.
        }
        try {
          const { identityDocType } = form;
          const { frontUrl, backUrl } = await uploadGuestScans(
            form.identityFrontFile,
            identityDocType === "id" ? form.identityBackFile : null,
          );
          if (frontUrl || backUrl) {
            writePendingIdentity({
              type: identityDocType,
              country: form.country,
              frontUrl,
              backUrl,
            });
          }
        } catch {
          // Best-effort — same as the primary licence above.
        }
      }

      if (hasAdditionalDriver) {
        try {
          const { frontUrl, backUrl, frontPath, backPath } = await uploadGuestScans(
            form.additionalDriverFrontFile,
            form.additionalDriverBackFile,
          );
          if (!session?.user.id) {
            writePendingAdditionalDriver({
              firstName: form.additionalDriverFirstName.trim(),
              lastName: form.additionalDriverLastName.trim(),
              licenceFrontUrl: frontUrl,
              licenceBackUrl: backUrl,
            });
          }
          completeDraft.additionalDriver = {
            firstName: form.additionalDriverFirstName.trim(),
            lastName: form.additionalDriverLastName.trim(),
            ...(frontPath ? { licenceFrontPath: frontPath } : {}),
            ...(backPath ? { licenceBackPath: backPath } : {}),
          };
        } catch {
          // Best-effort — same as the primary licence above.
        }
      }

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
      <section className="mx-auto max-w-(--container-full) px-4 py-6 sm:px-5 sm:pb-8 sm:pt-4">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <form
            className="flex flex-col gap-6"
            onSubmit={(e) => {
              e.preventDefault();
              onSubmit();
            }}
            noValidate
          >
            <Button
              type="button"
              variant="tertiary"
              size="sm"
              className="self-start"
              onClick={() => goToStep("/book/protection")}
            >
              <ArrowLeft className="size-4" aria-hidden="true" /> {t("backToProtection")}
            </Button>
            <DriverInfoSection form={form} setForm={setForm} errors={errors} vaultDocsRef={vaultDocsRef} />
            <DriverLicenceSection form={form} setForm={setForm} errors={errors} />
            <IdentityDocumentSection form={form} setForm={setForm} errors={errors} />
            {hasAdditionalDriver ? (
              <AdditionalDriverFields
                firstName={form.additionalDriverFirstName}
                lastName={form.additionalDriverLastName}
                onFirstNameChange={(value) =>
                  setForm((f) => ({ ...f, additionalDriverFirstName: value }))
                }
                onLastNameChange={(value) =>
                  setForm((f) => ({ ...f, additionalDriverLastName: value }))
                }
                frontFile={form.additionalDriverFrontFile}
                backFile={form.additionalDriverBackFile}
                frontUrl={form.additionalDriverFrontUrl || undefined}
                backUrl={form.additionalDriverBackUrl || undefined}
                onFrontChange={(file) =>
                  setForm((f) => ({ ...f, additionalDriverFrontFile: file }))
                }
                onBackChange={(file) => setForm((f) => ({ ...f, additionalDriverBackFile: file }))}
                firstNameError={errors.additionalDriverFirstName}
                lastNameError={errors.additionalDriverLastName}
                frontError={errors.additionalDriverFront}
                backError={errors.additionalDriverBack}
              />
            ) : null}
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
                    <Link
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-ink-100 underline-offset-2 hover:underline"
                    >
                      {chunks}
                    </Link>
                  ),
                  privacy: (chunks) => (
                    <Link
                      href="/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
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
              deliveryPricing={DELIVERY_PRICING}
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
  vaultDocsRef,
}: {
  form: CheckoutFormState;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormState>>;
  errors: Record<string, string>;
  vaultDocsRef: React.RefObject<UserDocument[]>;
}) {
  const t = useTranslations("bookingFlow.checkout");
  const onCountryChange = (country: string) => {
    setForm((f) => {
      const next = {
        ...f,
        country,
        identityDocType: isLebaneseResident(country) ? f.identityDocType : ("passport" as const),
        identityFrontFile: null,
        identityBackFile: null,
        identityFrontUrl: "",
        identityBackUrl: "",
      };
      const identity = findIdentityDocument(vaultDocsRef.current, country);
      return identity ? applyIdentityToForm(next, identity, false) : next;
    });
  };
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
              onChange={(e) => onCountryChange(e.target.value)}
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
      <LicenceScanFields
        frontFile={form.licenceFrontFile}
        backFile={form.licenceBackFile}
        frontUrl={form.licenceFrontUrl || undefined}
        backUrl={form.licenceBackUrl || undefined}
        onFrontChange={(file) => setForm((f) => ({ ...f, licenceFrontFile: file }))}
        onBackChange={(file) => setForm((f) => ({ ...f, licenceBackFile: file }))}
        frontError={errors.licenceFront}
        backError={errors.licenceBack}
        frontLabel={t("licenceFront")}
        backLabel={t("licenceBack")}
        helper={t("licenceUploadHelper")}
      />
    </section>
  );
}

function IdentityDocumentSection({
  form,
  setForm,
  errors,
}: {
  form: CheckoutFormState;
  setForm: React.Dispatch<React.SetStateAction<CheckoutFormState>>;
  errors: Record<string, string>;
}) {
  const t = useTranslations("bookingFlow.checkout");
  const lebanese = isLebaneseResident(form.country);
  const isId = form.identityDocType === "id";

  const onTypeChange = (type: "id" | "passport") => {
    setForm((f) => ({
      ...f,
      identityDocType: type,
      identityFrontFile: null,
      identityBackFile: null,
      identityFrontUrl: "",
      identityBackUrl: "",
    }));
  };

  return (
    <section aria-labelledby="identity-info" className="flex flex-col gap-5">
      <h2 id="identity-info" className="headline-md text-ink-95">
        {t("identityHeading")}
      </h2>
      <p className="body-sm text-ink-60 -mt-2">
        {lebanese ? t("identityHelperLebanese") : t("passportHelper")}
      </p>

      {lebanese ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onTypeChange("id")}
            className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
              isId
                ? "bg-ink-100 text-paper border-ink-100"
                : "border-ink-20 text-ink-60 hover:border-ink-60"
            }`}
          >
            {t("identityTypeId")}
          </button>
          <button
            type="button"
            onClick={() => onTypeChange("passport")}
            className={`rounded-pill border px-4 py-2 text-sm font-medium transition-colors ${
              !isId
                ? "bg-ink-100 text-paper border-ink-100"
                : "border-ink-20 text-ink-60 hover:border-ink-60"
            }`}
          >
            {t("identityTypePassport")}
          </button>
        </div>
      ) : null}

      {isId ? (
        <LicenceScanFields
          frontFile={form.identityFrontFile}
          backFile={form.identityBackFile}
          frontUrl={form.identityFrontUrl || undefined}
          backUrl={form.identityBackUrl || undefined}
          onFrontChange={(file) => setForm((f) => ({ ...f, identityFrontFile: file }))}
          onBackChange={(file) => setForm((f) => ({ ...f, identityBackFile: file }))}
          frontError={errors.identityFront}
          backError={errors.identityBack}
          frontLabel={t("idFront")}
          backLabel={t("idBack")}
          helper={t("identityUploadHelper")}
        />
      ) : (
        <div className="w-full max-w-sm">
          <Field label={t("passportPhoto")} required error={errors.identityFront}>
            {({ id, invalid }) => (
              <div className="flex flex-col gap-2">
                {form.identityFrontUrl && !form.identityFrontFile ? (
                  <DocumentScanPreview
                    scanUrl={form.identityFrontUrl}
                    alt={t("passportPhoto")}
                    size="md"
                  />
                ) : null}
                <FileUpload
                  id={id}
                  label={t("passportPhoto")}
                  accept=".jpg,.jpeg,.png,.webp,.pdf"
                  maxSizeBytes={5 * 1024 * 1024}
                  files={form.identityFrontFile ? [form.identityFrontFile] : []}
                  onFilesChange={(files) =>
                    setForm((f) => ({ ...f, identityFrontFile: files[0] ?? null }))
                  }
                  onFileRemove={() => setForm((f) => ({ ...f, identityFrontFile: null }))}
                  helper={t("identityUploadHelper")}
                  invalid={invalid}
                />
              </div>
            )}
          </Field>
        </div>
      )}
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
  const frontUrl = licence.scanFrontUrl || licence.scanUrl || "";
  const backUrl = licence.scanBackUrl || "";
  const bothSides = Boolean(frontUrl && backUrl);
  return {
    ...form,
    licenceNumber: form.licenceNumber || licence.number,
    licenceIssue: form.licenceIssue || licence.issueDate,
    licenceExpiry: form.licenceExpiry || licence.expiryDate,
    licenceCountry:
      form.licenceCountry !== "LB" || !licence.issuingCountry
        ? form.licenceCountry
        : normalizeCountryCode(licence.issuingCountry) ?? form.licenceCountry,
    licenceFrontUrl: bothSides ? form.licenceFrontUrl || frontUrl : form.licenceFrontUrl,
    licenceBackUrl: bothSides ? form.licenceBackUrl || backUrl : form.licenceBackUrl,
  };
}

function applyIdentityToForm(
  form: CheckoutFormState,
  identity: UserDocument,
  setType: boolean,
): CheckoutFormState {
  const type = identity.type as "id" | "passport";
  const frontUrl = identity.scanFrontUrl || identity.scanUrl || "";
  const backUrl = identity.scanBackUrl || "";
  return {
    ...form,
    ...(setType ? { identityDocType: type } : {}),
    identityFrontUrl: form.identityFrontUrl || frontUrl,
    identityBackUrl: type === "id" ? form.identityBackUrl || backUrl : "",
  };
}

function applyAdditionalDriverToForm(
  form: CheckoutFormState,
  driver: { firstName: string; lastName: string; scanFrontUrl?: string; scanBackUrl?: string },
): CheckoutFormState {
  return {
    ...form,
    additionalDriverFirstName: form.additionalDriverFirstName || driver.firstName,
    additionalDriverLastName: form.additionalDriverLastName || driver.lastName,
    additionalDriverFrontUrl: form.additionalDriverFrontUrl || driver.scanFrontUrl || "",
    additionalDriverBackUrl: form.additionalDriverBackUrl || driver.scanBackUrl || "",
  };
}

/**
 * Guest checkout has no account yet to save the scans to — upload them to
 * booking-scoped storage instead, so "Create account" on the confirmation
 * page can carry the actual photos over instead of asking to re-upload.
 */
async function uploadGuestScans(
  frontFile: File | null,
  backFile: File | null,
): Promise<{ frontUrl?: string; backUrl?: string; frontPath?: string; backPath?: string }> {
  const uploadSide = async (
    side: "front" | "back",
    file: File | null,
  ): Promise<{ url?: string; path?: string }> => {
    if (!file) return {};
    const body = new FormData();
    body.set("side", side);
    body.set("file", file);
    const res = await fetch(endpoints.bookingLicenceScan, { method: "POST", body });
    if (!res.ok) return {};
    const data = (await res.json().catch(() => null)) as { url?: string; path?: string } | null;
    return { url: data?.url, path: data?.path };
  };
  const [front, back] = await Promise.all([
    uploadSide("front", frontFile),
    uploadSide("back", backFile),
  ]);
  return { frontUrl: front.url, backUrl: back.url, frontPath: front.path, backPath: back.path };
}

async function persistLicenceToProfile(form: CheckoutFormState): Promise<void> {
  if (!form.licenceFrontFile && !form.licenceBackFile) return;
  const body = new FormData();
  body.set("type", "licence");
  body.set("number", form.licenceNumber.trim());
  body.set("issueDate", form.licenceIssue);
  body.set("expiryDate", form.licenceExpiry);
  body.set("issuingCountry", form.licenceCountry);
  if (form.licenceFrontFile) body.set("fileFront", form.licenceFrontFile);
  if (form.licenceBackFile) body.set("fileBack", form.licenceBackFile);
  const res = await fetch(endpoints.accountDocuments, {
    method: "POST",
    body,
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to save licence to profile.");
}

async function persistIdentityToProfile(form: CheckoutFormState): Promise<void> {
  const { identityDocType: type } = form;
  const hasNewFiles =
    Boolean(form.identityFrontFile) || (type === "id" && Boolean(form.identityBackFile));
  if (!hasNewFiles) return;
  const body = new FormData();
  body.set("type", type);
  body.set("number", "");
  body.set("issueDate", "");
  body.set("expiryDate", "");
  body.set("issuingCountry", form.country);
  if (type === "id") {
    if (form.identityFrontFile) body.set("fileFront", form.identityFrontFile);
    if (form.identityBackFile) body.set("fileBack", form.identityBackFile);
  } else if (form.identityFrontFile) {
    body.set("file", form.identityFrontFile);
  }
  const res = await fetch(endpoints.accountDocuments, {
    method: "POST",
    body,
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to save identity document to profile.");
}

async function persistAdditionalDriverToProfile(form: CheckoutFormState): Promise<void> {
  const body = new FormData();
  body.set("firstName", form.additionalDriverFirstName.trim());
  body.set("lastName", form.additionalDriverLastName.trim());
  if (form.additionalDriverFrontFile) body.set("fileFront", form.additionalDriverFrontFile);
  if (form.additionalDriverBackFile) body.set("fileBack", form.additionalDriverBackFile);
  const res = await fetch(endpoints.accountAdditionalDriver, {
    method: "POST",
    body,
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("Failed to save additional driver to profile.");
}

function normalizeCountryCode(code: string | undefined | null): string | null {
  if (!code) return null;
  const upper = code.trim().toUpperCase();
  if ((COUNTRY_CODES as readonly string[]).includes(upper)) return upper;
  if (upper === "OTHER") return "OTHER";
  return null;
}
