/** E.164-ish phone built from country dial + national digits (checkout/forms). */

/** ISO → international dial digits (no leading +). */
export const PHONE_DIAL_BY_ISO: Record<string, string> = {
  LB: "961",
  US: "1",
  CA: "1",
  GB: "44",
  FR: "33",
  DE: "49",
  IT: "39",
  ES: "34",
  NL: "31",
  BE: "32",
  CH: "41",
  SE: "46",
  AU: "61",
  BR: "55",
  AE: "971",
  SA: "966",
  QA: "974",
  KW: "965",
  JO: "962",
  EG: "20",
  TR: "90",
};

export function getDialCode(iso: string): string {
  return PHONE_DIAL_BY_ISO[iso] ?? "1";
}

export type PhoneParts = {
  countryIso: string;
  national: string;
};

/**
 * Split a stored phone (E.164 like +96170123456, or national digits) into
 * PhoneInput parts. Prefers `preferredIso` when ambiguous.
 */
export function phoneValueFromStored(
  input: string | undefined | null,
  preferredIso = "LB",
): PhoneParts {
  if (!input?.trim()) {
    return { countryIso: preferredIso, national: "" };
  }
  const digits = input.replace(/\D/g, "");
  if (!digits) {
    return { countryIso: preferredIso, national: "" };
  }

  const preferredDial = getDialCode(preferredIso);
  if (digits.startsWith(preferredDial) && digits.length > preferredDial.length + 5) {
    return {
      countryIso: preferredIso,
      national: digits.slice(preferredDial.length),
    };
  }

  const sorted = Object.entries(PHONE_DIAL_BY_ISO).sort((a, b) => b[1].length - a[1].length);
  for (const [iso, dial] of sorted) {
    if (digits.startsWith(dial) && digits.length > dial.length + 4) {
      return { countryIso: iso, national: digits.slice(dial.length) };
    }
  }

  return { countryIso: preferredIso, national: digits };
}

export function isValidLebanonMobile(nationalDigits: string): boolean {
  const digits = nationalDigits.replace(/\D/g, "");
  // Lebanese mobile: 8 digits, typically 3/7/8/9 prefix (03, 70, 71, 76, 78, 79, 81, …).
  return /^[3789]\d{7}$/.test(digits) || /^0[37]\d{6,7}$/.test(digits);
}

export function isValidPhoneNational(countryIso: string, nationalDigits: string): boolean {
  const digits = nationalDigits.replace(/\D/g, "");
  if (!digits) return false;
  if (countryIso === "LB") return isValidLebanonMobile(digits);
  return digits.length >= 7 && digits.length <= 15;
}
