"use client";

import { useTranslations } from "next-intl";
import { Field } from "@/components/ui/FormAtoms";
import { Input } from "@/components/ui/Input";
import { LicenceScanFields } from "@/components/account/LicenceScanFields";

/**
 * Shown at checkout when the "Additional driver" add-on is active — just
 * enough to add them to the rental agreement: name + their own licence
 * scans. No number/dates, unlike the primary driver's licence section.
 */
export function AdditionalDriverFields({
  firstName,
  lastName,
  onFirstNameChange,
  onLastNameChange,
  frontFile,
  backFile,
  frontUrl,
  backUrl,
  onFrontChange,
  onBackChange,
  firstNameError,
  lastNameError,
  frontError,
  backError,
}: {
  firstName: string;
  lastName: string;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  frontFile: File | null;
  backFile: File | null;
  frontUrl?: string;
  backUrl?: string;
  onFrontChange: (file: File | null) => void;
  onBackChange: (file: File | null) => void;
  firstNameError?: string;
  lastNameError?: string;
  frontError?: string;
  backError?: string;
}) {
  const t = useTranslations("bookingFlow.checkout");

  return (
    <section aria-labelledby="additional-driver-info" className="flex flex-col gap-5">
      <h2 id="additional-driver-info" className="headline-md text-ink-95">
        {t("additionalDriverHeading")}
      </h2>
      <p className="body-sm text-ink-60 -mt-2">{t("additionalDriverHelper")}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t("additionalDriverFirstName")} required error={firstNameError}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={firstName}
              onChange={(e) => onFirstNameChange(e.target.value)}
            />
          )}
        </Field>
        <Field label={t("additionalDriverLastName")} required error={lastNameError}>
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              aria-describedby={describedBy}
              invalid={invalid}
              value={lastName}
              onChange={(e) => onLastNameChange(e.target.value)}
            />
          )}
        </Field>
      </div>
      <LicenceScanFields
        frontFile={frontFile}
        backFile={backFile}
        frontUrl={frontUrl}
        backUrl={backUrl}
        onFrontChange={onFrontChange}
        onBackChange={onBackChange}
        frontError={frontError}
        backError={backError}
        frontLabel={t("licenceFront")}
        backLabel={t("licenceBack")}
        helper={t("licenceUploadHelper")}
        required
      />
    </section>
  );
}
