import type { Booking, BookingState } from "@/types/domain";
import { VEHICLES } from "@/lib/api/fixtures/vehicles";
import { fromBackendDateTime } from "@/lib/api/wheels-public/datetime";

/** Map Wizard operational status strings to the website BookingState. */
export function wizardStatusToBookingState(status: string): BookingState {
  if (status === "approved" || status === "confirmed") return "confirmed";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "completed") return "completed";
  if (status === "expired") return "expired";
  return "pending";
}

/** Map a Laravel public lookup payload into the internal Booking shape. */
export function toBookingFromLookup(lookup: {
  reference: string;
  status: string;
  start_date_time: string;
  end_date_time: string;
  customer: {
    name: string;
    email: string | null;
    phone_number: string;
    first_name?: string;
    last_name?: string;
  };
  vehicle: { id: number; name: string; model?: string };
  amount: number;
}): Booking {
  const [nameFirst = "", ...nameRest] = lookup.customer.name.trim().split(/\s+/);
  const fallbackFirst = lookup.customer.first_name ?? nameFirst;
  const fallbackLast = lookup.customer.last_name ?? nameRest.join(" ");
  const matchedVehicle = VEHICLES.find((vehicle) => vehicle.make === lookup.vehicle.name);
  const fallbackVehicle = matchedVehicle ?? VEHICLES[0]!;
  return {
    ref: lookup.reference,
    state: wizardStatusToBookingState(lookup.status),
    createdAt: new Date().toISOString(),
    pickup: {
      type: "branch",
      datetime: fromBackendDateTime(lookup.start_date_time),
      locationId: "br-hazmieh",
    },
    return: {
      datetime: fromBackendDateTime(lookup.end_date_time),
      locationId: "br-hazmieh",
    },
    vehicle: {
      vehicleId: fallbackVehicle.id,
      rate: { type: "best-price", mileage: "capped-200km" },
    },
    vehicleSnapshot: {
      id: fallbackVehicle.id,
      slug: fallbackVehicle.slug,
      make: fallbackVehicle.make,
      model: fallbackVehicle.model,
      year: fallbackVehicle.year,
      category: fallbackVehicle.category,
      images: fallbackVehicle.images,
    },
    extras: [],
    protectionTierId: "pt-basic",
    driver: {
      firstName: fallbackFirst,
      lastName: fallbackLast,
      email: lookup.customer.email ?? "",
      phone: lookup.customer.phone_number,
      dob: "",
      licenceNumber: "",
      licenceIssue: "",
      licenceExpiry: "",
      country: "LB",
    },
    paymentMethod: "cash",
    marketingConsent: false,
    whatsappOptIn: false,
    price: {
      baseRateCents: Math.round(lookup.amount * 100),
      extrasCents: 0,
      protectionCents: 0,
      taxesCents: 0,
      feesCents: 0,
      discountCents: 0,
      totalCents: Math.round(lookup.amount * 100),
      depositCents: 0,
    },
    currency: "USD",
  };
}
