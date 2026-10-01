import type {
  Cents,
  PaymentMethod,
  PaymentSettings,
  PaymentSurcharge,
  SurchargeablePaymentMethod,
} from "@/types/domain";

/**
 * Seed row for `payment_settings` and the fallback used whenever the table
 * isn't provisioned or Supabase is unreachable. Admin edits at
 * /admin/payment override these everywhere.
 *
 * Bank details ship empty on purpose: a placeholder IBAN shown at checkout
 * would be worse than showing nothing, so the transfer panel hides the block
 * until ops fills it in.
 */
export const SURCHARGEABLE_PAYMENT_METHODS: SurchargeablePaymentMethod[] = [
  "transfer",
  "omt",
  "whish-online",
  "neo",
];

export const NO_SURCHARGE: PaymentSurcharge = { mode: "none", amountCents: 0, percent: 0 };

export const DEFAULT_PAYMENT_SETTINGS: PaymentSettings = {
  bankTransfer: {
    bankName: "",
    accountName: "",
    accountNumber: "",
    iban: "",
    swift: "",
    instructions: "",
  },
  surcharges: {
    transfer: NO_SURCHARGE,
    omt: NO_SURCHARGE,
    "whish-online": NO_SURCHARGE,
    neo: NO_SURCHARGE,
  },
};

export function surchargeFor(
  method: PaymentMethod | null | undefined,
  settings?: PaymentSettings,
): PaymentSurcharge {
  if (!method || !settings) return NO_SURCHARGE;
  if (!SURCHARGEABLE_PAYMENT_METHODS.includes(method as SurchargeablePaymentMethod)) {
    return NO_SURCHARGE;
  }
  return settings.surcharges[method as SurchargeablePaymentMethod] ?? NO_SURCHARGE;
}

/**
 * `baseCents` is the total the customer would owe with cash — subtotal plus
 * taxes, minus any promo discount. Percentage surcharges are taken off that,
 * so the fee tracks what the method actually has to process.
 */
export function computeSurchargeCents(
  surcharge: PaymentSurcharge,
  input: { baseCents: Cents },
): Cents {
  switch (surcharge.mode) {
    case "fixed":
      return Math.max(0, Math.round(surcharge.amountCents));
    case "percent":
      return Math.max(0, Math.round((input.baseCents * surcharge.percent) / 100));
    case "none":
    default:
      return 0;
  }
}

export function paymentSurchargeCents(input: {
  method: PaymentMethod | null | undefined;
  settings?: PaymentSettings;
  baseCents: Cents;
}): Cents {
  return computeSurchargeCents(surchargeFor(input.method, input.settings), input);
}

/** True when ops has filled in enough of the bank block to show it. */
export function hasBankTransferDetails(settings?: PaymentSettings): boolean {
  const bank = settings?.bankTransfer;
  if (!bank) return false;
  return Boolean(
    bank.bankName.trim() ||
      bank.accountName.trim() ||
      bank.accountNumber.trim() ||
      bank.iban.trim() ||
      bank.swift.trim() ||
      bank.instructions.trim(),
  );
}
