import type { Booking, BookingState, Vehicle } from "@/types/domain";
import { VEHICLES } from "@/lib/api/fixtures/vehicles";
import { fromBackendDateTime } from "@/lib/api/wheels-public/datetime";
import {
  frontendVehicleIdFromWizard,
  slugifyVehicleName,
} from "@/lib/booking/wizard-vehicle-id";

const PLACEHOLDER_IMAGE = {
  url: "/images/Car Images/Untitled-design-2025-07-01T030112.627.png",
  alt: "Vehicle",
  width: 1080,
  height: 810,
} as const;

/** Map Wizard operational status strings to the website BookingState. */
export function wizardStatusToBookingState(status: string): BookingState {
  if (status === "approved" || status === "confirmed") return "confirmed";
  if (status === "cancelled" || status === "canceled") return "cancelled";
  if (status === "completed") return "completed";
  if (status === "expired") return "expired";
  return "pending";
}

function titleCase(value: string): string {
  return value.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase());
}

/** Match a fixture for photos/category only — never use VEHICLES[0] as a name fallback. */
export function matchFixtureForLookupVehicle(vehicle: {
  id: number;
  name: string;
  model?: string;
}): Vehicle | null {
  const wizId = frontendVehicleIdFromWizard(vehicle.id);
  const byId = VEHICLES.find((item) => item.id === wizId);
  if (byId) return byId;

  const nameKey = vehicle.name.trim().toLowerCase();
  const modelKey = (vehicle.model ?? vehicle.name).trim().toLowerCase();
  if (!nameKey && !modelKey) return null;

  const byModel = VEHICLES.find(
    (item) => item.model.toLowerCase() === modelKey || item.model.toLowerCase() === nameKey,
  );
  if (byModel) return byModel;

  const byFullName = VEHICLES.find(
    (item) => `${item.make} ${item.model}`.toLowerCase() === nameKey,
  );
  return byFullName ?? null;
}

export function displayNameFromLookupVehicle(vehicle: {
  name: string;
  model?: string;
}): { make: string; model: string } {
  const name = titleCase(vehicle.name.trim());
  const modelRaw = vehicle.model?.trim() ? titleCase(vehicle.model.trim()) : "";
  if (modelRaw && name && modelRaw.toLowerCase() !== name.toLowerCase()) {
    if (name.toLowerCase().endsWith(modelRaw.toLowerCase())) {
      const make = name.slice(0, name.length - modelRaw.length).trim();
      return { make: make || name, model: modelRaw };
    }
    return { make: name, model: modelRaw };
  }
  return { make: name || modelRaw || "Vehicle", model: "" };
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
  const matchedVehicle = matchFixtureForLookupVehicle(lookup.vehicle);
  const wizardName = displayNameFromLookupVehicle(lookup.vehicle);
  const frontendId = frontendVehicleIdFromWizard(lookup.vehicle.id);
  const displaySlug =
    slugifyVehicleName(lookup.vehicle.name || lookup.vehicle.model || frontendId) || frontendId;

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
      vehicleId: frontendId,
      rate: { type: "best-price", mileage: "capped-200km" },
    },
    vehicleSnapshot: {
      id: frontendId,
      slug: matchedVehicle?.slug ?? displaySlug,
      make: matchedVehicle?.make ?? wizardName.make,
      model: matchedVehicle?.model ?? wizardName.model,
      year: matchedVehicle?.year ?? new Date().getFullYear(),
      category: matchedVehicle?.category ?? "economy",
      images: matchedVehicle?.images ?? [{ ...PLACEHOLDER_IMAGE, alt: wizardName.make }],
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

/**
 * Overlay website catalog (synced Wizard + metadata) onto a lookup booking.
 * Confirmation / My bookings use lookup, so this keeps names/photos aligned
 * with the fleet card the customer booked (`wiz-{id}`).
 */
export function applyWebsiteVehicleToLookup(
  booking: Booking,
  wizardVehicleId: number,
  vehicles: Vehicle[],
): Booking {
  const frontendId = frontendVehicleIdFromWizard(wizardVehicleId);
  const catalog = vehicles.find((item) => item.id === frontendId);
  if (!catalog) return booking;
  return {
    ...booking,
    vehicle: {
      ...booking.vehicle,
      vehicleId: catalog.id,
      vehicleSlug: catalog.slug,
    },
    vehicleSnapshot: {
      id: catalog.id,
      slug: catalog.slug,
      make: catalog.make,
      model: catalog.model,
      year: catalog.year,
      category: catalog.category,
      images: catalog.images.length > 0 ? catalog.images : booking.vehicleSnapshot.images,
    },
  };
}
