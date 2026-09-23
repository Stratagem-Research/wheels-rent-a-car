/**
 * Availability → submit parity probe.
 *
 * Exercises the same path as production: GET /availability → fromBookingDraft
 * → POST /booking-request. Exits non-zero when Wizard rejects a vehicle that
 * availability just returned as free.
 *
 * Usage:
 *   pnpm booking:parity-probe
 *   pnpm booking:parity-probe --pickup "2027-04-15 10:00" --return "2027-04-19 10:00"
 *   pnpm booking:parity-probe --frontend-dates   # use SearchBar-style YYYY-MM-DDTHH:mm
 */

import { fromBookingDraft } from "@/lib/api/wheels-public/adapters";
import {
  createBookingRequest,
  getAvailability,
  getVehicleAvailability,
  VehicleUnavailableError,
  WheelsThrottledError,
} from "@/lib/api/wheels-public/client";
import { toBackendDateTime } from "@/lib/api/wheels-public/datetime";
import { parseWizardVehicleId } from "@/lib/booking/wizard-vehicle-id";
import type { BookingDraft } from "@/types/domain";
import { loadEnvFile } from "./load-env";

loadEnvFile();

interface CliOptions {
  pickupBackend: string;
  returnBackend: string;
  pickupFrontend?: string;
  returnFrontend?: string;
  pickupLoc: string;
  vehicleIndex: number;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let pickup = "";
  let ret = "";
  let frontendDates = false;
  let pickupLoc = "br-hazmieh";
  let vehicleIndex = 0;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--pickup") pickup = args[++i] ?? "";
    else if (arg === "--return") ret = args[++i] ?? "";
    else if (arg === "--frontend-dates") frontendDates = true;
    else if (arg === "--pickup-loc") pickupLoc = args[++i] ?? pickupLoc;
    else if (arg === "--vehicle-index") vehicleIndex = Number(args[++i] ?? 0);
  }

  if (!pickup || !ret) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const y = now.getFullYear();
    const m = pad(now.getMonth() + 1);
    const d1 = pad(now.getDate() + 1);
    const d4 = pad(now.getDate() + 4);
    if (frontendDates) {
      pickup = `${y}-${m}-${d1}T10:00`;
      ret = `${y}-${m}-${d4}T10:00`;
    } else {
      pickup = `${y}-${m}-${d1} 10:00`;
      ret = `${y}-${m}-${d4} 10:00`;
    }
  }

  const pickupBackend = frontendDates ? toBackendDateTime(pickup) : pickup;
  const returnBackend = frontendDates ? toBackendDateTime(ret) : ret;

  return {
    pickupBackend,
    returnBackend,
    pickupFrontend: frontendDates ? pickup : undefined,
    returnFrontend: frontendDates ? ret : undefined,
    pickupLoc,
    vehicleIndex,
  };
}

function buildDraft(
  vehicleId: number,
  pickupDatetime: string,
  returnDatetime: string,
  pickupLoc: string,
): BookingDraft {
  const frontendId = `wiz-${vehicleId}`;
  return {
    pickup: { type: "branch", locationId: pickupLoc, datetime: pickupDatetime },
    return: { locationId: pickupLoc, datetime: returnDatetime },
    vehicle: { vehicleId: frontendId, rate: { type: "best-price", mileage: "capped-200km" } },
    extras: [],
    protectionTierId: "pt-basic",
    driver: {
      firstName: "Parity",
      lastName: "Probe",
      email: `parity+${Date.now()}@example.com`,
      phone: "+96170000099",
      dob: "1990-01-01",
      licenceNumber: "PARITY-1",
      licenceIssue: "2020-01-01",
      licenceExpiry: "2030-01-01",
      country: "LB",
    },
    paymentMethod: "cash",
    marketingConsent: false,
    whatsappOptIn: false,
  };
}

async function main(): Promise<number> {
  const opts = parseArgs();
  const pickupDraftDatetime = opts.pickupFrontend ?? opts.pickupBackend.replace(" ", "T");
  const returnDraftDatetime = opts.returnFrontend ?? opts.returnBackend.replace(" ", "T");

  console.log("=== Booking parity probe ===");
  console.log("Availability window:", opts.pickupBackend, "→", opts.returnBackend);
  console.log("Draft datetimes:", pickupDraftDatetime, "→", returnDraftDatetime);

  let avail;
  try {
    avail = await getAvailability({
      startDateTime: opts.pickupBackend,
      endDateTime: opts.returnBackend,
      includeBooked: false,
    });
  } catch (err) {
    if (err instanceof WheelsThrottledError) {
      console.error("THROTTLED (429) on availability — retry later");
      return 2;
    }
    throw err;
  }

  const vehicles = avail.data.vehicles;
  console.log("Available count:", vehicles.length);
  if (vehicles.length === 0) {
    console.error("No vehicles in availability response");
    return 1;
  }

  const pick = vehicles[opts.vehicleIndex] ?? vehicles[0]!;
  console.log("Picked vehicle:", pick.id, pick.name, `(index ${opts.vehicleIndex})`);

  const draft = buildDraft(pick.id, pickupDraftDatetime, returnDraftDatetime, opts.pickupLoc);
  const payload = fromBookingDraft(draft, {
    resolveVehicleId: (id) => parseWizardVehicleId(id),
  });

  console.log("\n--- Availability query ---");
  console.log(
    JSON.stringify(
      {
        start_date_time: opts.pickupBackend,
        end_date_time: opts.returnBackend,
      },
      null,
      2,
    ),
  );

  console.log("\n--- Submit payload ---");
  console.log(
    JSON.stringify(
      {
        vehicle_id: payload.vehicle_id,
        start_date_time: payload.start_date_time,
        end_date_time: payload.end_date_time,
        pickup_address: payload.pickup_address,
        drop_off_address: payload.drop_off_address,
      },
      null,
      2,
    ),
  );

  console.log("\n--- Parity check ---");
  const startMatch = payload.start_date_time === opts.pickupBackend;
  const endMatch = payload.end_date_time === opts.returnBackend;
  console.log("start_date_time match:", startMatch);
  console.log("end_date_time match:", endMatch);
  console.log("vehicle in list:", vehicles.some((v) => v.id === payload.vehicle_id));

  let singleAvail;
  try {
    singleAvail = await getVehicleAvailability(pick.id, {
      startDateTime: opts.pickupBackend,
      endDateTime: opts.returnBackend,
    });
    console.log("GET /availability/{id} is_available:", singleAvail.data.is_available);
  } catch (err) {
    if (err instanceof WheelsThrottledError) {
      console.warn("Skipped single-vehicle check (429)");
    } else {
      throw err;
    }
  }

  try {
    const result = await createBookingRequest(payload);
    console.log("\nSUCCESS — reference:", result.data.reference);
    return 0;
  } catch (err) {
    if (err instanceof WheelsThrottledError) {
      console.error("\nTHROTTLED (429) on submit — retry later");
      return 2;
    }
    if (err instanceof VehicleUnavailableError) {
      console.error("\nPARITY FAILURE (409) — vehicle available in list but rejected at submit");
      console.error("Response body:", JSON.stringify(err.body, null, 2));
      if (singleAvail) {
        console.error("Single-vehicle is_available was:", singleAvail.data.is_available);
      }
      return 1;
    }
    throw err;
  }
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
