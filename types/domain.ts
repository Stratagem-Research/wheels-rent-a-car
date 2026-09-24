/**
 * Wheels Rent A Car — domain types.
 *
 * Single source of truth for every API shape. Next.js route handlers and the
 * Wheels backend adapters must conform to these types. Update this file first
 * when a contract changes, then propagate to routes and consumers.
 *
 * Conventions:
 * - Dates and times serialize as ISO-8601 strings (`YYYY-MM-DDTHH:mm:ssZ`).
 *   Components convert to/from Date with date-fns at the edge.
 * - Money is integer USD cents to avoid float drift (e.g. $25.00 = 2500).
 * - IDs are opaque strings; never assume a format.
 */

// ── Shared scalars ────────────────────────────────────────────────────────

/** Integer cents in USD. $25.00 -> 2500. */
export type Cents = number;

/** ISO-8601 datetime: 2026-05-20T10:00:00.000Z. */
export type ISODateTime = string;

/** ISO-8601 date only: 2026-05-20. */
export type ISODate = string;

/** Time in 24h format: "10:00". */
export type TimeHHmm = string;

/** Two-letter ISO 3166-1 code: "LB", "US". */
export type CountryCode = string;

/** Booking ref pattern: WRC-YYMMDD-XXXX. */
export type BookingRef = string;
export const BOOKING_REF_PATTERN = /^WRC-\d{6}-[A-Z0-9]{4}$/;

export type CmsLocale = "en" | "ar" | "fr";

export interface LocalizedString {
  en: string;
  ar?: string;
  fr?: string;
}

export interface LocalizedStringArray {
  en: string[];
  ar?: string[];
  fr?: string[];
}

export type LocalizedStringValue = LocalizedString | string;
export type LocalizedStringArrayValue = LocalizedStringArray | string[];

// ── Vehicles ──────────────────────────────────────────────────────────────

export type VehicleCategory =
  | "economy"
  | "compact"
  | "sedan"
  | "suv"
  | "luxury"
  | "4x4"
  | "7-seater"
  | "convertible";

export type Transmission = "automatic" | "manual";
export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";

export type VehicleBadge = "best-deal" | "new" | "popular" | null;

export interface VehicleImage {
  url: string;
  alt: string;
  width: number;
  height: number;
}

export interface Vehicle {
  id: string;
  slug: string;
  make: string;
  model: string;
  /** Website-owned listing title. When set, cards use this instead of make + model. */
  title?: string;
  year: number;
  category: VehicleCategory;
  /** Short marketing tagline shown under the title. */
  tagline?: string;
  /** Long-form prose for the PDP description block (Markdown allowed). */
  description?: string;
  badge?: VehicleBadge;
  transmission: Transmission;
  fuel: FuelType;
  seats: number;
  doors: number;
  bags: number;
  engine?: string;
  features: string[];
  images: VehicleImage[];
  /** "From" daily rate in cents, used for listing and PDP price hints. */
  dailyRateFromCents: Cents;
  /** True if Wheels actually owns one of these; affects "or similar" copy. */
  ownsInFleet: boolean;
}

// ── Locations ─────────────────────────────────────────────────────────────

export type PickupType = "airport" | "branch" | "address-delivery" | "chauffeur";

export interface BranchHours {
  /** 0 = Sunday, 6 = Saturday. */
  day: number;
  open: TimeHHmm;
  close: TimeHHmm;
  /** True if the branch operates 24h that day. */
  open24h?: boolean;
}

export interface Branch {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  /** Decimal degrees. */
  lat: number;
  lng: number;
  phone: string;
  whatsapp?: string;
  hours: BranchHours[];
  /** True for the BEY airport desk. */
  isAirport: boolean;
  /** True if the branch is on hold (renovation, holiday, etc.). */
  temporarilyClosed?: boolean;
  /** When `temporarilyClosed`, optional human-readable reason. */
  closedReason?: string;
}

/**
 * Admin-editable contact channels. Single source of truth for every
 * `tel:` link, `wa.me` deep-link, and JSON-LD `telephone` on the site —
 * edited at /admin/contact, served by /api/contact-settings.
 *
 * Both numbers are stored in international display form (e.g.
 * "+961 3 337 228"); hrefs are derived by stripping non-digits, so the
 * spacing is free to change without breaking links.
 */
export interface ContactSettings {
  /** Primary phone number, international display form. */
  phone: string;
  /** WhatsApp Business number, international display form. */
  whatsapp: string;
  /** Customer service email — used in footer, contact page, mailto links. */
  email: string;
}

/** Admin-editable delivery-fee formula for non-branch pickup addresses. */
export interface DeliveryPricingSettings {
  baseFeeCents: number;
  /** Distance from the nearest branch, in km, covered by the base fee. */
  freeRadiusKm: number;
  perKmCents: number;
}

// ── Rates, extras, protection ────────────────────────────────────────────

export type RateType = "best-price" | "flexible";
export type MileagePlan = "capped-200km" | "unlimited";

export interface Rate {
  type: RateType;
  mileage: MileagePlan;
  /** Per-day price in cents (post-discount, pre-add-ons). */
  perDayCents: Cents;
  /** Sum for the full pickup→return window in cents. */
  totalCents: Cents;
  /** True if the rate is non-refundable (best-price typically). */
  nonRefundable: boolean;
}

export type AddOnCategory =
  | "driver-access"
  | "comfort"
  | "connectivity"
  | "convenience"
  | "sustainability";

export interface AddOn {
  id: string;
  name: string;
  description: string;
  category: AddOnCategory;
  /** "per-day" multiplies by rental days; "per-rental" applies once. */
  pricing: "per-day" | "per-rental";
  priceCents: Cents;
  /** True if user can add more than one (baby seats, etc.). */
  multiQuantity: boolean;
  maxQuantity?: number;
  /** When `gb`, qty is gigabytes and `priceCents` is the per-GB rental rate. */
  quantityUnit?: "gb";
  /** Icon name from lucide-react. */
  icon: string;
}

export interface ProtectionTier {
  id: string;
  name: string;
  /** Per-day surcharge in cents; 0 for the Basic tier (included). */
  perDayCents: Cents;
  /** Driver's max liability in cents if covered. */
  deductibleCents: Cents;
  /** Inclusions list shown as ticks on the tier card. */
  inclusions: string[];
  /** True for the "Smart"/Popular tier (renders a badge). */
  popular: boolean;
}

// ── Booking draft (the funnel state, per 00_global.md §20) ───────────────

export interface BookingPickup {
  type: PickupType;
  locationId?: string;
  /** Full street address when type is "address-delivery". */
  address?: string;
  /** Set when `address` was chosen via Google Places Autocomplete — lets
   *  delivery fees be computed from real distance to the nearest branch. */
  lat?: number;
  lng?: number;
  datetime: ISODateTime;
}

export interface BookingReturn {
  locationId?: string;
  address?: string;
  datetime: ISODateTime;
}

export interface BookingVehicleSelection {
  vehicleId: string;
  /** Slug for catalog fallback when fleet list is paginated. */
  vehicleSlug?: string;
  rate: {
    type: RateType;
    mileage: MileagePlan;
  };
}

export interface BookingExtra {
  addOnId: string;
  qty: number;
}

export interface BookingDriver {
  firstName: string;
  lastName: string;
  email: string;
  /** ITU-T format with leading "+", e.g. "+96170123456". */
  phone: string;
  dob: ISODate;
  licenceNumber: string;
  licenceIssue: ISODate;
  licenceExpiry: ISODate;
  country: CountryCode;
  /** Guest-checkout scan storage paths (user-documents bucket) — local-only,
   *  never sent to Wizard — carried onto the booking so a profile created
   *  later can backfill the licence photos from booking history. */
  licenceFrontPath?: string;
  licenceBackPath?: string;
}

/**
 * Captured at checkout when the "Additional driver" add-on is active — just
 * enough to add them to the rental agreement: name + their own licence
 * scans. No number/dates typed in, unlike the primary driver's licence.
 */
export interface AdditionalDriver {
  firstName: string;
  lastName: string;
  licenceFrontUrl?: string;
  licenceBackUrl?: string;
  licenceFrontPath?: string;
  licenceBackPath?: string;
}

export type PaymentMethod = "card" | "cash" | "transfer" | "omt" | "whish-online" | "neo";

export interface BookingDraft {
  pickup: BookingPickup;
  return: BookingReturn;
  vehicle?: BookingVehicleSelection;
  extras: BookingExtra[];
  protectionTierId?: string;
  driver?: BookingDriver;
  /** Set when the "Additional driver" add-on (ao-extra-driver) is active. */
  additionalDriver?: AdditionalDriver;
  /** Required when pickup.type === "airport". */
  flightNumber?: string;
  paymentMethod?: PaymentMethod;
  marketingConsent: boolean;
  whatsappOptIn: boolean;
  promoCode?: string;
}

// ── Confirmed booking ─────────────────────────────────────────────────────

export type BookingState =
  | "draft"
  | "confirmed"
  | "pending"
  | "expired"
  | "cancelled"
  | "completed";

export interface BookingPriceBreakdown {
  baseRateCents: Cents;
  extrasCents: Cents;
  protectionCents: Cents;
  taxesCents: Cents;
  feesCents: Cents;
  discountCents: Cents;
  totalCents: Cents;
  /** Refundable deposit held at pickup; not part of `totalCents`. */
  depositCents: Cents;
}

export interface Booking {
  ref: BookingRef;
  state: BookingState;
  /** When the booking was first submitted. */
  createdAt: ISODateTime;
  pickup: BookingPickup;
  return: BookingReturn;
  vehicle: BookingVehicleSelection;
  vehicleSnapshot: Pick<Vehicle, "id" | "slug" | "make" | "model" | "year" | "category" | "images">;
  extras: BookingExtra[];
  protectionTierId: string;
  driver: BookingDriver;
  additionalDriver?: AdditionalDriver;
  flightNumber?: string;
  paymentMethod: PaymentMethod;
  marketingConsent: boolean;
  whatsappOptIn: boolean;
  promoCode?: string;
  price: BookingPriceBreakdown;
  /** ISO-4217 currency code. Phase 1 = "USD". */
  currency: "USD";
  /** Wizard public_token for status polling when booking is pending. */
  publicToken?: string;
}

// ── User account ──────────────────────────────────────────────────────────

export interface UserPreferences {
  marketing: boolean;
  whatsappUpdates: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  dob?: ISODate;
  country?: CountryCode;
  preferences: UserPreferences;
  createdAt: ISODateTime;
}

export type DocumentType = "licence" | "id" | "passport";
export type DocumentStatus = "pending" | "verified" | "expired" | "rejected";

export interface UserDocument {
  id: string;
  userId: string;
  type: DocumentType;
  number: string;
  issueDate: ISODate;
  expiryDate: ISODate;
  issuingCountry: CountryCode;
  /** URL of the stored document scan, when available. */
  scanUrl?: string;
  /** Driver's licence — front of card. */
  scanFrontUrl?: string;
  /** Driver's licence — back of card. */
  scanBackUrl?: string;
  status: DocumentStatus;
  uploadedAt: ISODateTime;
}

// ── Leads (long-term, chauffeur, corporate, contact) ─────────────────────

export type LeadKind = "long-term" | "chauffeur" | "corporate" | "contact";

export interface LeadSubmission {
  kind: LeadKind;
  /** Echoes back the body submitted to /api/leads/* — kind-specific. */
  payload: Record<string, unknown>;
  submittedAt: ISODateTime;
}

export interface Lead {
  id: string;
  kind: LeadKind;
  status: "new" | "in-progress" | "won" | "lost";
  payload: Record<string, unknown>;
  submittedAt: ISODateTime;
}

// ── Misc ──────────────────────────────────────────────────────────────────

export interface Review {
  id: string;
  source: "google" | "trustpilot";
  rating: number; // 1–5
  author: string;
  body: string;
  date: ISODate;
  /** Optional URL of the original review on Google/Trustpilot. */
  link?: string;
}

export interface FaqEntry {
  id: string;
  /** Topic group key for the FAQ page nav. */
  group: string;
  question: LocalizedStringValue;
  answer: LocalizedStringValue;
}

export interface FaqGroup {
  id: string;
  title: LocalizedStringValue;
  entries: FaqEntry[];
}

export interface LongTermTier {
  id: string;
  /** Duration in months. */
  durationMonths: 1 | 3 | 6 | 12;
  perDayCents: Cents;
  savingsPercent: number;
  inclusions: string[];
  popular?: boolean;
}

export interface ChauffeurItinerary {
  id: string;
  name: string;
  durationHours: number;
  route: string;
  /** "From $XXX" price in cents. */
  fromCents: Cents;
  description: string;
}

// ── Corporate tiers (Phase 12 — un-descoped) ─────────────────────────────

export interface CarWashVehiclePrice {
  vehicleClass: "car" | "suv";
  amount: number;
}

export interface CarWashPackage {
  id: string;
  name: LocalizedStringValue;
  description: LocalizedStringValue;
  durationMinutes: number;
  turnaroundHours?: number;
  currency: "USD" | "LBP";
  pricingMode: "fixed" | "by_vehicle_class";
  priceCents?: number;
  priceLbp?: number;
  vehiclePrices?: CarWashVehiclePrice[];
  quoteOnly?: boolean;
  popular?: boolean;
  icon: string;
  active?: boolean;
}

export interface CorporateTier {
  id: string;
  name: LocalizedStringValue;
  /** Short label shown under the tier name. */
  tagline: LocalizedStringValue;
  /**
   * Indicative starting per-day rate in cents. `null` means "quote only" —
   * no public price; CTA opens the enquiry form pre-selected to this tier.
   */
  perDayCents: Cents | null;
  /** Indicative monthly fleet size this tier suits ("3-10 cars", etc.). */
  fleetSize: LocalizedStringValue;
  inclusions: LocalizedStringArrayValue;
  popular?: boolean;
  /** Override the CTA label per tier (defaults to "Get a quote"). */
  ctaLabel?: LocalizedStringValue;
}

// ── Trips (self-drive blog content) ──────────────────────────────────────

export type TripRegion = "mountains" | "coast" | "bekaa" | "cultural" | "north" | "south";

export interface TripImage {
  src: string;
  alt: LocalizedStringValue;
  width: number;
  height: number;
}

export interface Trip {
  slug: string;
  title: LocalizedStringValue;
  /** One-line teaser on listings. */
  excerpt: LocalizedStringValue;
  coverImage: TripImage;
  /** Compact card meta — "8h · SUV recommended", etc. */
  meta: LocalizedStringValue;
  region: TripRegion;
  /** Article body (Markdown allowed). */
  body: LocalizedStringValue;
  /** Vehicle category we recommend for this trip. */
  suggestedVehicleCategory: VehicleCategory;
  tags: LocalizedStringArrayValue;
  publishedAt: ISODate;
  updatedAt: ISODateTime;
}

// ── Itineraries (chauffeur-driven tours) ─────────────────────────────────

export type ItineraryCategory = "day-trip" | "multi-day" | "cultural" | "wine" | "north" | "south";

export interface ItineraryScheduleItem {
  /** "09:00" — 24h clock. */
  time: string;
  title: LocalizedStringValue;
  body?: LocalizedStringValue;
}

export interface Itinerary {
  slug: string;
  title: LocalizedStringValue;
  excerpt: LocalizedStringValue;
  coverImage: TripImage;
  category: ItineraryCategory;
  /** Display string — "Full day · 9-10 hours". */
  duration: LocalizedStringValue;
  priceFromCents: Cents;
  highlights: LocalizedStringArrayValue;
  schedule: ItineraryScheduleItem[];
  vehicleClass: "sedan" | "suv" | "van";
  updatedAt: ISODateTime;
}

export interface PaymentMethodPublicConfig {
  method: PaymentMethod;
  enabled: boolean;
  available: boolean;
  environment?: "sandbox" | "production";
}

export interface SiteConfig {
  /** Active promo strip; null = no campaign running. */
  promo: {
    message: string;
    href?: string;
  } | null;
  /** Maintenance mode flag. */
  maintenance: boolean;
  /** Checkout payment modules — individually activatable via env. */
  paymentMethods: PaymentMethodPublicConfig[];
}

export interface AvailabilityRequest {
  pickup: BookingPickup;
  return: BookingReturn;
}

export interface AvailableVehicle {
  vehicle: Vehicle;
  /** Rate cards for both rate types × both mileage plans. */
  rates: Rate[];
}

export interface QuoteRequest {
  draft: BookingDraft;
}

export interface QuoteResponse {
  rentalDays: number;
  price: BookingPriceBreakdown;
  /** True if the price differs from a previous quote by > 1%. */
  changedSinceLastQuote: boolean;
}

export interface SubmitBookingRequest {
  draft: BookingDraft;
}

export interface SubmitBookingResponse {
  booking: Booking;
}

export interface LookupBookingRequest {
  ref: BookingRef;
  email: string;
}
