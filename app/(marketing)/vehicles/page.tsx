import { getTranslations } from "next-intl/server";
import { getPublicBranches, getPublicVehicles } from "@/lib/server/public-content";
import { handleBookingAvailability } from "@/lib/server/booking-service";
import { listHeldFrontendVehicleIds } from "@/lib/supabase/vehicle-booking-holds-repository";
import { VehiclesClient } from "./_components/VehiclesClient";
import type { Vehicle } from "@/types/domain";

/**
 * /vehicles — Phase 7 canonical results page. Thin server wrapper holding
 * the static `metadata`; the interactive grid + inline expansion live in
 * <VehiclesClient />.
 */

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return { title: t("vehiclesTitle"), description: t("vehiclesDescription") };
}

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/**
 * When pickupAt/returnAt are on the URL, resolve the list against real
 * Wizard availability for those dates instead of the full catalog — closes
 * the gap where /vehicles ignored picked dates until the final 409 at
 * submit. Website booking holds are subtracted in both modes so the
 * grouped "available" count drops after each booking.
 */
async function resolveVehiclesForDates(
  pickupAt?: string,
  returnAt?: string,
): Promise<{ vehicles: Vehicle[]; availabilityError: boolean }> {
  const catalog = await getPublicVehicles();
  if (!pickupAt || !returnAt) {
    const heldIds = await listHeldFrontendVehicleIds();
    return {
      vehicles: heldIds.size === 0 ? catalog : catalog.filter((v) => !heldIds.has(v.id)),
      availabilityError: false,
    };
  }
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

  const [{ vehicles, availabilityError }, branches] = await Promise.all([
    resolveVehiclesForDates(pickupAt, returnAt),
    getPublicBranches(),
  ]);

  return (
    <VehiclesClient vehicles={vehicles} branches={branches} availabilityError={availabilityError} />
  );
}
