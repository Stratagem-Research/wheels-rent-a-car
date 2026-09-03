import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getPublicBranches, getPublicDeliveryPricing, getPublicVehicles } from "@/lib/server/public-content";
import { handleBookingAvailability } from "@/lib/server/booking-service";
import { vehiclesQueryWithDefaultWindow } from "@/lib/search/criteria";
import { resolvePageMetadata } from "@/lib/seo/resolve-metadata";
import { VehiclesClient } from "./_components/VehiclesClient";
import type { Vehicle } from "@/types/domain";

/**
 * /vehicles — Phase 7 canonical results page. Thin server wrapper holding
 * the static `metadata`; the interactive grid + inline expansion live in
 * <VehiclesClient />.
 */

export async function generateMetadata() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("meta")]);
  return resolvePageMetadata({
    pageKey: "/vehicles",
    locale,
    fallbackTitle: t("vehiclesTitle"),
    fallbackDescription: t("vehiclesDescription"),
    path: "/vehicles",
  });
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * Resolve the list against Wizard availability for the search window.
 * Website booking holds are subtracted so the grouped "available" count
 * drops after each booking. The page always has pickupAt/returnAt (defaults
 * are written onto the URL when missing).
 */
async function resolveVehiclesForDates(
  pickupAt: string,
  returnAt: string,
): Promise<{ vehicles: Vehicle[]; availabilityError: boolean }> {
  const catalog = await getPublicVehicles();
  try {
    const { items } = await handleBookingAvailability({
      pickup: { type: "branch", datetime: pickupAt },
      return: { datetime: returnAt },
    });
    // Wizard's live /availability can return vehicles our locally synced
    // catalog doesn't know about yet (not synced, or not website-enabled).
    // Every downstream step (extras, protection, submit) resolves vehicles
    // against that local catalog — so only show the intersection, using the
    // catalog's own (CMS-enriched) Vehicle object rather than the live
    // response's best-guess enrichment.
    const catalogById = new Map(catalog.map((v) => [v.id, v]));
    const vehicles = items
      .map((item) => catalogById.get(item.vehicle.id))
      .filter((v): v is Vehicle => v != null);
    return { vehicles, availabilityError: false };
  } catch {
    // Do not fall back to the full catalog when dates were provided — that
    // lets customers pick cars Wizard will reject at submit with 409 booked.
    return { vehicles: [], availabilityError: true };
  }
}

export default async function VehiclesPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const pickupAt = typeof sp.pickupAt === "string" ? sp.pickupAt : undefined;
  const returnAt = typeof sp.returnAt === "string" ? sp.returnAt : undefined;

  if (!pickupAt || !returnAt) {
    redirect(`/vehicles?${vehiclesQueryWithDefaultWindow(sp).toString()}`);
  } else {
    const [{ vehicles, availabilityError }, branches, deliveryPricing] = await Promise.all([
      resolveVehiclesForDates(pickupAt, returnAt),
      getPublicBranches(),
      getPublicDeliveryPricing(),
    ]);

    return (
      <VehiclesClient
        vehicles={vehicles}
        branches={branches}
        deliveryPricing={deliveryPricing}
        availabilityError={availabilityError}
      />
    );
  }
}
