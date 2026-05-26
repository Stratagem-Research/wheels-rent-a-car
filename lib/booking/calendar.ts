import { parseISO } from "date-fns";
import type { Booking } from "@/types/domain";

/**
 * Generate an iCalendar (.ics) file with two events: pickup and return.
 * Per 04_booking_flow.md step 5 ("Add to calendar").
 *
 * Returns the ICS text. Use `downloadIcs(text, filename)` to trigger a
 * client download.
 */

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Format Date → "YYYYMMDDTHHmmssZ" (UTC, ICS-compliant). */
function icsDateTime(d: Date): string {
  return [
    d.getUTCFullYear(),
    pad(d.getUTCMonth() + 1),
    pad(d.getUTCDate()),
    "T",
    pad(d.getUTCHours()),
    pad(d.getUTCMinutes()),
    pad(d.getUTCSeconds()),
    "Z",
  ].join("");
}

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function event({
  uid,
  start,
  end,
  summary,
  location,
  description,
}: {
  uid: string;
  start: Date;
  end: Date;
  summary: string;
  location: string;
  description: string;
}): string {
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${icsDateTime(new Date())}`,
    `DTSTART:${icsDateTime(start)}`,
    `DTEND:${icsDateTime(end)}`,
    `SUMMARY:${escapeIcsText(summary)}`,
    `LOCATION:${escapeIcsText(location)}`,
    `DESCRIPTION:${escapeIcsText(description)}`,
    "END:VEVENT",
  ].join("\r\n");
}

export function bookingToIcs(
  booking: Booking,
  /** Display name of the pickup location (resolved from Branch fixtures). */
  pickupLocationName: string,
  /** Display name of the return location. */
  returnLocationName: string,
): string {
  const pickupStart = parseISO(booking.pickup.datetime);
  const pickupEnd = new Date(pickupStart.getTime() + 30 * 60 * 1000); // 30-min meeting window

  const returnStart = parseISO(booking.return.datetime);
  const returnEnd = new Date(returnStart.getTime() + 30 * 60 * 1000);

  const vehicleName = `${booking.vehicleSnapshot.make} ${booking.vehicleSnapshot.model}`;
  const description = [
    `Booking ${booking.ref}`,
    `${vehicleName} (or similar)`,
    "Bring your driver's licence and the credit card used.",
  ].join("\\n");

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Wheels Rent A Car//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    event({
      uid: `pickup-${booking.ref}@wheelsrentacar.com.lb`,
      start: pickupStart,
      end: pickupEnd,
      summary: `Wheels: pickup ${vehicleName}`,
      location: pickupLocationName,
      description,
    }),
    event({
      uid: `return-${booking.ref}@wheelsrentacar.com.lb`,
      start: returnStart,
      end: returnEnd,
      summary: `Wheels: return ${vehicleName}`,
      location: returnLocationName,
      description,
    }),
    "END:VCALENDAR",
  ].join("\r\n");
}

/** Trigger a browser download of the .ics text. No-op on the server. */
export function downloadIcs(ics: string, filename: string): void {
  if (typeof window === "undefined") return;
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
