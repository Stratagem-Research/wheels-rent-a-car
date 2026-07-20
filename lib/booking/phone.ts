/** E.164-ish phone built from country dial + national digits (checkout/forms). */
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
