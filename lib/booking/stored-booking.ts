import type {
  Booking,
  BookingExtra,
  BookingState,
  MileagePlan,
  PaymentMethod,
  PickupType,
  RateType,
  VehicleCategory,
  VehicleImage,
} from "@/types/domain";

/** Flattened booking details stored as columns (not a JSON snapshot of Booking). */
export type StoredBookingFields = {
  state: string | null;
  pickupType: string | null;
  pickupLocationId: string | null;
  pickupAddress: string | null;
  returnLocationId: string | null;
  returnAddress: string | null;
  vehicleSlug: string | null;
  rateType: string | null;
  mileagePlan: string | null;
  vehicleMake: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
  vehicleCategory: string | null;
  vehicleImages: VehicleImage[] | null;
  extras: BookingExtra[] | null;
  protectionTierId: string | null;
  driverFirstName: string | null;
  driverLastName: string | null;
  driverEmail: string | null;
  driverPhone: string | null;
  driverDob: string | null;
  driverLicenceNumber: string | null;
  driverLicenceIssue: string | null;
  driverLicenceExpiry: string | null;
  driverCountry: string | null;
  driverLicenceFrontPath: string | null;
  driverLicenceBackPath: string | null;
  additionalDriverFirstName: string | null;
  additionalDriverLastName: string | null;
  additionalDriverFrontPath: string | null;
  additionalDriverBackPath: string | null;
  flightNumber: string | null;
  paymentMethod: string | null;
  marketingConsent: boolean | null;
  whatsappOptIn: boolean | null;
  promoCode: string | null;
  baseRateCents: number | null;
  extrasCents: number | null;
  protectionCents: number | null;
  taxesCents: number | null;
  feesCents: number | null;
  discountCents: number | null;
  totalCents: number | null;
  depositCents: number | null;
  currency: string | null;
};

export const STORED_BOOKING_DB_KEYS = [
  "state",
  "pickup_type",
  "pickup_location_id",
  "pickup_address",
  "return_location_id",
  "return_address",
  "vehicle_slug",
  "rate_type",
  "mileage_plan",
  "vehicle_make",
  "vehicle_model",
  "vehicle_year",
  "vehicle_category",
  "vehicle_images",
  "extras",
  "protection_tier_id",
  "driver_first_name",
  "driver_last_name",
  "driver_email",
  "driver_phone",
  "driver_dob",
  "driver_licence_number",
  "driver_licence_issue",
  "driver_licence_expiry",
  "driver_country",
  "driver_licence_front_path",
  "driver_licence_back_path",
  "additional_driver_first_name",
  "additional_driver_last_name",
  "additional_driver_front_path",
  "additional_driver_back_path",
  "flight_number",
  "payment_method",
  "marketing_consent",
  "whatsapp_opt_in",
  "promo_code",
  "base_rate_cents",
  "extras_cents",
  "protection_cents",
  "taxes_cents",
  "fees_cents",
  "discount_cents",
  "total_cents",
  "deposit_cents",
  "currency",
] as const;

export const STORED_BOOKING_SELECT = STORED_BOOKING_DB_KEYS.join(", ");

export function emptyStoredBookingFields(): StoredBookingFields {
  return {
    state: null,
    pickupType: null,
    pickupLocationId: null,
    pickupAddress: null,
    returnLocationId: null,
    returnAddress: null,
    vehicleSlug: null,
    rateType: null,
    mileagePlan: null,
    vehicleMake: null,
    vehicleModel: null,
    vehicleYear: null,
    vehicleCategory: null,
    vehicleImages: null,
    extras: null,
    protectionTierId: null,
    driverFirstName: null,
    driverLastName: null,
    driverEmail: null,
    driverPhone: null,
    driverDob: null,
    driverLicenceNumber: null,
    driverLicenceIssue: null,
    driverLicenceExpiry: null,
    driverCountry: null,
    driverLicenceFrontPath: null,
    driverLicenceBackPath: null,
    additionalDriverFirstName: null,
    additionalDriverLastName: null,
    additionalDriverFrontPath: null,
    additionalDriverBackPath: null,
    flightNumber: null,
    paymentMethod: null,
    marketingConsent: null,
    whatsappOptIn: null,
    promoCode: null,
    baseRateCents: null,
    extrasCents: null,
    protectionCents: null,
    taxesCents: null,
    feesCents: null,
    discountCents: null,
    totalCents: null,
    depositCents: null,
    currency: null,
  };
}

export function hasStoredBookingDetails(fields: StoredBookingFields): boolean {
  return fields.vehicleMake != null || fields.baseRateCents != null || fields.paymentMethod != null;
}

export function storedBookingFromDomain(booking: Booking): StoredBookingFields {
  return {
    state: booking.state ?? null,
    pickupType: booking.pickup?.type ?? null,
    pickupLocationId: booking.pickup?.locationId ?? null,
    pickupAddress: booking.pickup?.address ?? null,
    returnLocationId: booking.return?.locationId ?? null,
    returnAddress: booking.return?.address ?? null,
    vehicleSlug: booking.vehicle?.vehicleSlug ?? booking.vehicleSnapshot?.slug ?? null,
    rateType: booking.vehicle?.rate?.type ?? null,
    mileagePlan: booking.vehicle?.rate?.mileage ?? null,
    vehicleMake: booking.vehicleSnapshot?.make ?? null,
    vehicleModel: booking.vehicleSnapshot?.model ?? null,
    vehicleYear: booking.vehicleSnapshot?.year ?? null,
    vehicleCategory: booking.vehicleSnapshot?.category ?? null,
    vehicleImages: booking.vehicleSnapshot?.images ?? null,
    extras: booking.extras ?? null,
    protectionTierId: booking.protectionTierId ?? null,
    driverFirstName: booking.driver?.firstName ?? null,
    driverLastName: booking.driver?.lastName ?? null,
    driverEmail: booking.driver?.email ?? null,
    driverPhone: booking.driver?.phone ?? null,
    driverDob: booking.driver?.dob ?? null,
    driverLicenceNumber: booking.driver?.licenceNumber ?? null,
    driverLicenceIssue: booking.driver?.licenceIssue ?? null,
    driverLicenceExpiry: booking.driver?.licenceExpiry ?? null,
    driverCountry: booking.driver?.country ?? null,
    driverLicenceFrontPath: booking.driver?.licenceFrontPath ?? null,
    driverLicenceBackPath: booking.driver?.licenceBackPath ?? null,
    additionalDriverFirstName: booking.additionalDriver?.firstName ?? null,
    additionalDriverLastName: booking.additionalDriver?.lastName ?? null,
    additionalDriverFrontPath: booking.additionalDriver?.licenceFrontPath ?? null,
    additionalDriverBackPath: booking.additionalDriver?.licenceBackPath ?? null,
    flightNumber: booking.flightNumber ?? null,
    paymentMethod: booking.paymentMethod ?? null,
    marketingConsent: booking.marketingConsent ?? null,
    whatsappOptIn: booking.whatsappOptIn ?? null,
    promoCode: booking.promoCode ?? null,
    baseRateCents: booking.price?.baseRateCents ?? null,
    extrasCents: booking.price?.extrasCents ?? null,
    protectionCents: booking.price?.protectionCents ?? null,
    taxesCents: booking.price?.taxesCents ?? null,
    feesCents: booking.price?.feesCents ?? null,
    discountCents: booking.price?.discountCents ?? null,
    totalCents: booking.price?.totalCents ?? null,
    depositCents: booking.price?.depositCents ?? null,
    currency: booking.currency ?? null,
  };
}

export function storedBookingToDb(fields: StoredBookingFields): Record<string, unknown> {
  return {
    state: fields.state,
    pickup_type: fields.pickupType,
    pickup_location_id: fields.pickupLocationId,
    pickup_address: fields.pickupAddress,
    return_location_id: fields.returnLocationId,
    return_address: fields.returnAddress,
    vehicle_slug: fields.vehicleSlug,
    rate_type: fields.rateType,
    mileage_plan: fields.mileagePlan,
    vehicle_make: fields.vehicleMake,
    vehicle_model: fields.vehicleModel,
    vehicle_year: fields.vehicleYear,
    vehicle_category: fields.vehicleCategory,
    vehicle_images: fields.vehicleImages,
    extras: fields.extras,
    protection_tier_id: fields.protectionTierId,
    driver_first_name: fields.driverFirstName,
    driver_last_name: fields.driverLastName,
    driver_email: fields.driverEmail,
    driver_phone: fields.driverPhone,
    driver_dob: fields.driverDob,
    driver_licence_number: fields.driverLicenceNumber,
    driver_licence_issue: fields.driverLicenceIssue,
    driver_licence_expiry: fields.driverLicenceExpiry,
    driver_country: fields.driverCountry,
    driver_licence_front_path: fields.driverLicenceFrontPath,
    driver_licence_back_path: fields.driverLicenceBackPath,
    additional_driver_first_name: fields.additionalDriverFirstName,
    additional_driver_last_name: fields.additionalDriverLastName,
    additional_driver_front_path: fields.additionalDriverFrontPath,
    additional_driver_back_path: fields.additionalDriverBackPath,
    flight_number: fields.flightNumber,
    payment_method: fields.paymentMethod,
    marketing_consent: fields.marketingConsent,
    whatsapp_opt_in: fields.whatsappOptIn,
    promo_code: fields.promoCode,
    base_rate_cents: fields.baseRateCents,
    extras_cents: fields.extrasCents,
    protection_cents: fields.protectionCents,
    taxes_cents: fields.taxesCents,
    fees_cents: fields.feesCents,
    discount_cents: fields.discountCents,
    total_cents: fields.totalCents,
    deposit_cents: fields.depositCents,
    currency: fields.currency,
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBool(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

export function mapStoredBookingFields(row: Record<string, unknown>): StoredBookingFields {
  return {
    state: asString(row.state),
    pickupType: asString(row.pickup_type),
    pickupLocationId: asString(row.pickup_location_id),
    pickupAddress: asString(row.pickup_address),
    returnLocationId: asString(row.return_location_id),
    returnAddress: asString(row.return_address),
    vehicleSlug: asString(row.vehicle_slug),
    rateType: asString(row.rate_type),
    mileagePlan: asString(row.mileage_plan),
    vehicleMake: asString(row.vehicle_make),
    vehicleModel: asString(row.vehicle_model),
    vehicleYear: asNumber(row.vehicle_year),
    vehicleCategory: asString(row.vehicle_category),
    vehicleImages: Array.isArray(row.vehicle_images) ? (row.vehicle_images as VehicleImage[]) : null,
    extras: Array.isArray(row.extras) ? (row.extras as BookingExtra[]) : null,
    protectionTierId: asString(row.protection_tier_id),
    driverFirstName: asString(row.driver_first_name),
    driverLastName: asString(row.driver_last_name),
    driverEmail: asString(row.driver_email),
    driverPhone: asString(row.driver_phone),
    driverDob: asString(row.driver_dob),
    driverLicenceNumber: asString(row.driver_licence_number),
    driverLicenceIssue: asString(row.driver_licence_issue),
    driverLicenceExpiry: asString(row.driver_licence_expiry),
    driverCountry: asString(row.driver_country),
    driverLicenceFrontPath: asString(row.driver_licence_front_path),
    driverLicenceBackPath: asString(row.driver_licence_back_path),
    additionalDriverFirstName: asString(row.additional_driver_first_name),
    additionalDriverLastName: asString(row.additional_driver_last_name),
    additionalDriverFrontPath: asString(row.additional_driver_front_path),
    additionalDriverBackPath: asString(row.additional_driver_back_path),
    flightNumber: asString(row.flight_number),
    paymentMethod: asString(row.payment_method),
    marketingConsent: asBool(row.marketing_consent),
    whatsappOptIn: asBool(row.whatsapp_opt_in),
    promoCode: asString(row.promo_code),
    baseRateCents: asNumber(row.base_rate_cents),
    extrasCents: asNumber(row.extras_cents),
    protectionCents: asNumber(row.protection_cents),
    taxesCents: asNumber(row.taxes_cents),
    feesCents: asNumber(row.fees_cents),
    discountCents: asNumber(row.discount_cents),
    totalCents: asNumber(row.total_cents),
    depositCents: asNumber(row.deposit_cents),
    currency: asString(row.currency),
  };
}

export function omitStoredBookingDb(row: Record<string, unknown>): Record<string, unknown> {
  const out = { ...row };
  for (const key of STORED_BOOKING_DB_KEYS) delete out[key];
  return out;
}

function asPickupType(value: string | null): PickupType {
  if (value === "airport" || value === "branch" || value === "address-delivery" || value === "chauffeur") {
    return value;
  }
  return "branch";
}

function asRateType(value: string | null): RateType {
  return value === "flexible" ? "flexible" : "best-price";
}

function asMileage(value: string | null): MileagePlan {
  return value === "unlimited" ? "unlimited" : "capped-200km";
}

function asPayment(value: string | null): PaymentMethod {
  if (
    value === "card" ||
    value === "cash" ||
    value === "transfer" ||
    value === "omt" ||
    value === "whish-online" ||
    value === "neo"
  ) {
    return value;
  }
  return "cash";
}

function asState(value: string | null): BookingState {
  if (
    value === "confirmed" ||
    value === "pending" ||
    value === "expired" ||
    value === "cancelled" ||
    value === "completed" ||
    value === "draft"
  ) {
    return value;
  }
  return "pending";
}

function asCategory(value: string | null): VehicleCategory {
  if (
    value === "economy" ||
    value === "compact" ||
    value === "sedan" ||
    value === "suv" ||
    value === "4x4" ||
    value === "7-seater" ||
    value === "luxury" ||
    value === "convertible"
  ) {
    return value;
  }
  return "economy";
}

export function compactStoredBookingToDb(fields: StoredBookingFields): Record<string, unknown> {
  const raw = storedBookingToDb(fields);
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(raw)) {
    if (value !== null && value !== undefined) out[key] = value;
  }
  return out;
}

export type StoredBookingIdentity = StoredBookingFields & {
  bookingReference: string;
  publicToken: string | null;
  customerEmail: string | null;
  createdAt: string;
  pickupAt: string | null;
  returnAt: string | null;
  frontendVehicleId: string | null;
};

export function bookingFromStoredRow(row: StoredBookingIdentity, authEmail: string): Booking {
  const vehicleId = row.frontendVehicleId ?? row.bookingReference;
  const pickup = row.pickupAt ?? row.createdAt;
  const returnAt = row.returnAt ?? row.pickupAt ?? row.createdAt;
  return {
    ref: row.bookingReference,
    state: asState(row.state),
    createdAt: row.createdAt,
    pickup: {
      type: asPickupType(row.pickupType),
      datetime: pickup,
      locationId: row.pickupLocationId ?? "br-hazmieh",
      ...(row.pickupAddress ? { address: row.pickupAddress } : {}),
    },
    return: {
      datetime: returnAt,
      locationId: row.returnLocationId ?? "br-hazmieh",
      ...(row.returnAddress ? { address: row.returnAddress } : {}),
    },
    vehicle: {
      vehicleId,
      ...(row.vehicleSlug ? { vehicleSlug: row.vehicleSlug } : {}),
      rate: { type: asRateType(row.rateType), mileage: asMileage(row.mileagePlan) },
    },
    vehicleSnapshot: {
      id: vehicleId,
      slug: row.vehicleSlug ?? vehicleId,
      make: row.vehicleMake ?? "Vehicle",
      model: row.vehicleModel ?? "",
      year: row.vehicleYear ?? new Date().getFullYear(),
      category: asCategory(row.vehicleCategory),
      images: row.vehicleImages ?? [],
    },
    extras: row.extras ?? [],
    protectionTierId: row.protectionTierId ?? "pt-basic",
    driver: {
      firstName: row.driverFirstName ?? "",
      lastName: row.driverLastName ?? "",
      email: row.driverEmail ?? row.customerEmail ?? authEmail,
      phone: row.driverPhone ?? "",
      dob: row.driverDob ?? "",
      licenceNumber: row.driverLicenceNumber ?? "",
      licenceIssue: row.driverLicenceIssue ?? "",
      licenceExpiry: row.driverLicenceExpiry ?? "",
      country: row.driverCountry ?? "LB",
      ...(row.driverLicenceFrontPath ? { licenceFrontPath: row.driverLicenceFrontPath } : {}),
      ...(row.driverLicenceBackPath ? { licenceBackPath: row.driverLicenceBackPath } : {}),
    },
    ...(row.additionalDriverFirstName ||
    row.additionalDriverLastName ||
    row.additionalDriverFrontPath ||
    row.additionalDriverBackPath
      ? {
          additionalDriver: {
            firstName: row.additionalDriverFirstName ?? "",
            lastName: row.additionalDriverLastName ?? "",
            ...(row.additionalDriverFrontPath ? { licenceFrontPath: row.additionalDriverFrontPath } : {}),
            ...(row.additionalDriverBackPath ? { licenceBackPath: row.additionalDriverBackPath } : {}),
          },
        }
      : {}),
    ...(row.flightNumber ? { flightNumber: row.flightNumber } : {}),
    paymentMethod: asPayment(row.paymentMethod),
    marketingConsent: row.marketingConsent ?? false,
    whatsappOptIn: row.whatsappOptIn ?? false,
    ...(row.promoCode ? { promoCode: row.promoCode } : {}),
    price: {
      baseRateCents: row.baseRateCents ?? 0,
      extrasCents: row.extrasCents ?? 0,
      protectionCents: row.protectionCents ?? 0,
      taxesCents: row.taxesCents ?? 0,
      feesCents: row.feesCents ?? 0,
      discountCents: row.discountCents ?? 0,
      totalCents: row.totalCents ?? 0,
      depositCents: row.depositCents ?? 0,
    },
    currency: "USD",
    publicToken: row.publicToken ?? undefined,
  };
}
