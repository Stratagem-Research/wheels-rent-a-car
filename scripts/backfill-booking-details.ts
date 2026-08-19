import "./load-env";
import { WheelsThrottledError } from "@/lib/api/wheels-public";
import { toBookingFromLookup } from "@/lib/booking/lookup-adapter";
import {
  compactStoredBookingToDb,
  storedBookingFromDomain,
} from "@/lib/booking/stored-booking";
import {
  isManualVehicleId,
  parseWizardVehicleId,
} from "@/lib/booking/wizard-vehicle-id";
import {
  handleBookingLookup,
  handleBookingStatusByToken,
  hydrateLookupVehicle,
} from "@/lib/server/booking-service";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { getVehicleById } from "@/lib/server/vehicles-service";
import type { Booking } from "@/types/domain";

type Source = "user_bookings" | "guest_booking_index";

type Row = {
  source: Source;
  booking_reference: string;
  public_token: string | null;
  email: string | null;
  user_id?: string;
  pickup_at: string | null;
  return_at: string | null;
  frontend_vehicle_id: string | null;
  wizard_vehicle_id: number | null;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv: string[]) {
  const dryRun = argv.includes("--dry-run");
  const delayArg = argv.find((arg) => arg.startsWith("--delay="));
  const limitArg = argv.find((arg) => arg.startsWith("--limit="));
  const delayMs = delayArg ? Number(delayArg.slice("--delay=".length)) : 2000;
  const limit = limitArg ? Number(limitArg.slice("--limit=".length)) : Infinity;
  return {
    dryRun,
    delayMs: Number.isFinite(delayMs) && delayMs >= 0 ? delayMs : 2000,
    limit: Number.isFinite(limit) && limit > 0 ? limit : Infinity,
  };
}

async function fetchIncompleteRows(): Promise<Row[]> {
  const supabase = getSupabaseAdminClient();
  const users = await supabase
    .from("user_bookings")
    .select(
      "user_id, booking_reference, public_token, customer_email, pickup_at, return_at, frontend_vehicle_id, wizard_vehicle_id, vehicle_make",
    )
    .is("vehicle_make", null)
    .order("created_at", { ascending: false });
  if (users.error) throw new Error(`user_bookings: ${users.error.message}`);

  const guests = await supabase
    .from("guest_booking_index")
    .select(
      "email, booking_reference, public_token, pickup_at, return_at, frontend_vehicle_id, wizard_vehicle_id, vehicle_make",
    )
    .is("vehicle_make", null)
    .order("created_at", { ascending: false });
  if (guests.error) throw new Error(`guest_booking_index: ${guests.error.message}`);

  const fromUsers: Row[] = (users.data ?? []).map((row) => ({
    source: "user_bookings",
    booking_reference: row.booking_reference as string,
    public_token: (row.public_token as string | null) ?? null,
    email: (row.customer_email as string | null) ?? null,
    user_id: row.user_id as string,
    pickup_at: (row.pickup_at as string | null) ?? null,
    return_at: (row.return_at as string | null) ?? null,
    frontend_vehicle_id: (row.frontend_vehicle_id as string | null) ?? null,
    wizard_vehicle_id: (row.wizard_vehicle_id as number | null) ?? null,
  }));
  const fromGuests: Row[] = (guests.data ?? []).map((row) => ({
    source: "guest_booking_index",
    booking_reference: row.booking_reference as string,
    public_token: (row.public_token as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    pickup_at: (row.pickup_at as string | null) ?? null,
    return_at: (row.return_at as string | null) ?? null,
    frontend_vehicle_id: (row.frontend_vehicle_id as string | null) ?? null,
    wizard_vehicle_id: (row.wizard_vehicle_id as number | null) ?? null,
  }));
  return [...fromUsers, ...fromGuests];
}

async function lookupWizard(row: Row): Promise<Booking | null> {
  const email = row.email?.trim();
  if (email) {
    try {
      return await handleBookingLookup({ ref: row.booking_reference, email });
    } catch (err) {
      if (err instanceof WheelsThrottledError) throw err;
    }
  }
  if (!row.public_token) return null;
  const status = await handleBookingStatusByToken(row.public_token);
  if (!status.customer) return null;
  const booking = toBookingFromLookup({
    reference: status.reference,
    status: status.status,
    start_date_time: status.start_date_time,
    end_date_time: status.end_date_time,
    customer: status.customer,
    vehicle: status.vehicle,
    amount: status.amount,
  });
  return hydrateLookupVehicle(booking, status.vehicle.id);
}

async function fillFromCatalog(row: Row): Promise<Booking | null> {
  const vehicleId = row.frontend_vehicle_id;
  if (!vehicleId) return null;
  const vehicle = await getVehicleById(vehicleId);
  if (!vehicle) return null;
  const pickup = row.pickup_at ?? new Date().toISOString();
  const returnAt = row.return_at ?? pickup;
  return {
    ref: row.booking_reference,
    state: "pending",
    createdAt: pickup,
    pickup: { type: "branch", datetime: pickup, locationId: "br-hazmieh" },
    return: { datetime: returnAt, locationId: "br-hazmieh" },
    vehicle: { vehicleId: vehicle.id, vehicleSlug: vehicle.slug, rate: { type: "best-price", mileage: "capped-200km" } },
    vehicleSnapshot: {
      id: vehicle.id,
      slug: vehicle.slug,
      make: vehicle.make,
      model: vehicle.model,
      year: vehicle.year,
      category: vehicle.category,
      images: vehicle.images,
    },
    extras: [],
    protectionTierId: "pt-basic",
    driver: {
      firstName: "",
      lastName: "",
      email: row.email ?? "",
      phone: "",
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
      baseRateCents: vehicle.dailyRateFromCents,
      extrasCents: 0,
      protectionCents: 0,
      taxesCents: 0,
      feesCents: 0,
      discountCents: 0,
      totalCents: 0,
      depositCents: 0,
    },
    currency: "USD",
    publicToken: row.public_token ?? undefined,
  };
}

async function resolveBooking(row: Row): Promise<{ booking: Booking; via: "wizard" | "catalog" } | null> {
  const frontendId = row.frontend_vehicle_id ?? "";
  if (!isManualVehicleId(frontendId)) {
    const fromWizard = await lookupWizard(row);
    if (fromWizard) return { booking: fromWizard, via: "wizard" };
  }
  const fromCatalog = await fillFromCatalog(row);
  if (fromCatalog) return { booking: fromCatalog, via: "catalog" };
  return null;
}

function updatePayload(booking: Booking, row: Row): Record<string, unknown> {
  const wizardId = parseWizardVehicleId(booking.vehicle.vehicleId) ?? row.wizard_vehicle_id ?? null;
  return {
    ...compactStoredBookingToDb(storedBookingFromDomain(booking)),
    pickup_at: booking.pickup.datetime,
    return_at: booking.return.datetime,
    frontend_vehicle_id: booking.vehicle.vehicleId || row.frontend_vehicle_id,
    ...(wizardId != null ? { wizard_vehicle_id: wizardId } : {}),
  };
}

async function persist(row: Row, payload: Record<string, unknown>): Promise<void> {
  const supabase = getSupabaseAdminClient();
  if (row.source === "user_bookings") {
    const { error } = await supabase
      .from("user_bookings")
      .update(payload)
      .eq("user_id", row.user_id!)
      .eq("booking_reference", row.booking_reference);
    if (error) throw error;
    return;
  }
  const { error } = await supabase
    .from("guest_booking_index")
    .update(payload)
    .eq("email", row.email!.trim().toLowerCase())
    .eq("booking_reference", row.booking_reference);
  if (error) throw error;
}

async function main() {
  const { dryRun, delayMs, limit } = parseArgs(process.argv.slice(2));
  const rows = (await fetchIncompleteRows()).slice(0, limit);
  console.info(`[backfill-booking-details] ${rows.length} incomplete row(s)${dryRun ? " (dry-run)" : ""}`);

  let filled = 0;
  let skipped = 0;
  let failed = 0;

  for (const row of rows) {
    try {
      if (row.source === "guest_booking_index" && !row.email) {
        skipped += 1;
        console.warn(`skip ${row.booking_reference}: guest row has no email`);
        continue;
      }
      const resolved = await resolveBooking(row);
      if (!resolved) {
        skipped += 1;
        console.warn(`skip ${row.booking_reference} (${row.source}): no Wizard/catalog data`);
        continue;
      }
      const payload = updatePayload(resolved.booking, row);
      if (dryRun) {
        console.info(`dry-run ${row.booking_reference} via ${resolved.via}`, {
          make: payload.vehicle_make,
          total_cents: payload.total_cents,
        });
      } else {
        await persist(row, payload);
        console.info(`filled ${row.booking_reference} via ${resolved.via}`);
      }
      filled += 1;
      if (resolved.via === "wizard") await sleep(delayMs);
    } catch (err) {
      if (err instanceof WheelsThrottledError) {
        const wait = Math.max(delayMs, (err.retryAfterSeconds ?? 60) * 1000);
        console.warn(`throttled on ${row.booking_reference}; waiting ${Math.round(wait / 1000)}s`);
        await sleep(wait);
        try {
          const resolved = await resolveBooking(row);
          if (!resolved) {
            skipped += 1;
            continue;
          }
          if (!dryRun) await persist(row, updatePayload(resolved.booking, row));
          filled += 1;
          console.info(`filled ${row.booking_reference} after throttle`);
        } catch (retryErr) {
          failed += 1;
          console.error(`fail ${row.booking_reference}`, retryErr instanceof Error ? retryErr.message : retryErr);
        }
        continue;
      }
      failed += 1;
      console.error(`fail ${row.booking_reference}`, err instanceof Error ? err.message : err);
    }
  }

  console.info(JSON.stringify({ filled, skipped, failed, dryRun }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
