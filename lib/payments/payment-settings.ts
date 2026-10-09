import type {
  Cents,
  PaymentMethod,
  PaymentSettings,
  PaymentSurcharge,
  PaymentSurchargeDayTier,
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

export const NO_SURCHARGE: PaymentSurcharge = {
  mode: "none",
  amountCents: 0,
  percent: 0,
  dayTiers: [],
};

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
 * First tier whose band contains day number `day`, or null when none does.
 * A day outside every band is charged nothing rather than falling back to a
 * neighbouring band, so a gap in the ladder can never overcharge.
 */
export function matchDayTier(
  tiers: PaymentSurchargeDayTier[] | undefined,
  day: number,
): PaymentSurchargeDayTier | null {
  if (!tiers?.length) return null;
  const target = Math.max(1, Math.round(day));
  return (
    tiers.find(
      (tier) =>
        target >= Math.max(1, Math.round(tier.startDay)) &&
        (tier.endDay == null || target <= Math.round(tier.endDay)),
    ) ?? null
  );
}

/**
 * Graduated total across the day ladder: each day of the rental is charged at
 * the rate of the band that day falls in, the way tax brackets work. A 5-day
 * rental against 1–3 @ $0.60 and 4+ @ $1.00 costs 3 × $0.60 + 2 × $1.00.
 */
export function computeDayTiersCents(
  tiers: PaymentSurchargeDayTier[] | undefined,
  days: number,
): Cents {
  if (!tiers?.length) return 0;
  const rentalDays = Math.max(1, Math.round(days));
  let total = 0;
  for (let day = 1; day <= rentalDays; day += 1) {
    const tier = matchDayTier(tiers, day);
    if (tier) total += Math.max(0, Math.round(tier.perDayCents));
  }
  return total;
}

/**
 * `baseCents` is the total the customer would owe with cash — subtotal plus
 * taxes, minus any promo discount. Percentage surcharges are taken off that,
 * so the fee tracks what the method actually has to process. `days` is the
 * rental length: "per-day" charges `amountCents` for each day, and "day-tiers"
 * charges it graduated across the ladder.
 */
export function computeSurchargeCents(
  surcharge: PaymentSurcharge,
  input: { baseCents: Cents; days?: number },
): Cents {
  switch (surcharge.mode) {
    case "fixed":
      return Math.max(0, Math.round(surcharge.amountCents));
    case "percent":
      return Math.max(0, Math.round((input.baseCents * surcharge.percent) / 100));
    case "per-day":
      return (
        Math.max(0, Math.round(surcharge.amountCents)) * Math.max(1, Math.round(input.days ?? 1))
      );
    case "day-tiers":
      return computeDayTiersCents(surcharge.dayTiers, input.days ?? 1);
    case "none":
    default:
      return 0;
  }
}

export function paymentSurchargeCents(input: {
  method: PaymentMethod | null | undefined;
  settings?: PaymentSettings;
  baseCents: Cents;
  days?: number;
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
