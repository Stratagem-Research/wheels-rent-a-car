/**
 * Asia/Beirut ↔ ISO-8601 conversions for the Wheels public API.
 *
 * The Laravel backend emits and accepts wall-clock datetime strings in the
 * shape `YYYY-MM-DD HH:mm[:ss]` with NO timezone marker. Empirically (Phase 1
 * smoke pass) these are interpreted as **Asia/Beirut** local time, which is
 * UTC+2 in winter (EET) and UTC+3 during DST (EEST).
 *
 * The frontend speaks ISO-8601 UTC everywhere (see types/domain.ts header).
 * This module is the only place those two conventions touch.
 *
 * No third-party tz library is used. We rely on `Intl.DateTimeFormat` with
 * `timeZone: "Asia/Beirut"` to compute the local wall clock for a given UTC
 * instant, then iterate at most twice to converge on the UTC instant whose
 * Beirut wall clock matches the requested local components. This handles
 * DST transitions correctly because Intl knows the IANA rules.
 */

export const WHEELS_API_TIMEZONE = "Asia/Beirut";

const BACKEND_DT_RE = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/;

/** SearchBar / draft format: `YYYY-MM-DDTHH:mm` with no timezone offset. */
const FRONTEND_LOCAL_DT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

export function isFrontendLocalDatetime(input: string): boolean {
  return FRONTEND_LOCAL_DT_RE.test(input.trim());
}

/**
 * Parse a SearchBar/draft datetime (`YYYY-MM-DDTHH:mm`, no offset) as
 * Asia/Beirut wall clock and return ISO UTC.
 */
export function parseFrontendDatetime(input: string): string {
  const match = FRONTEND_LOCAL_DT_RE.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid frontend datetime: ${JSON.stringify(input)}`);
  }
  const [, y, mo, d, h, mi] = match;
  return fromBackendDateTime(`${y}-${mo}-${d} ${h}:${mi}`);
}

interface Wall {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const beirutFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: WHEELS_API_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

function pad(value: number, width = 2): string {
  return String(value).padStart(width, "0");
}

function beirutWallOf(utcMs: number): Wall {
  const parts = beirutFormatter.formatToParts(new Date(utcMs));
  const lookup = (type: Intl.DateTimeFormatPartTypes): number => {
    const raw = parts.find((p) => p.type === type)?.value ?? "0";
    return Number(raw);
  };
  let hour = lookup("hour");
  // Intl can return "24" for midnight in some locales; normalize to 0.
  if (hour === 24) hour = 0;
  return {
    year: lookup("year"),
    month: lookup("month"),
    day: lookup("day"),
    hour,
    minute: lookup("minute"),
    second: lookup("second"),
  };
}

function wallDeltaMs(target: Wall, actual: Wall): number {
  // Compare the wall clocks as if both were in UTC. The delta is the offset
  // adjustment we need to apply to converge on the correct UTC instant.
  const targetMs = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second,
  );
  const actualMs = Date.UTC(
    actual.year,
    actual.month - 1,
    actual.day,
    actual.hour,
    actual.minute,
    actual.second,
  );
  return targetMs - actualMs;
}

/**
 * Parse a backend datetime string ("YYYY-MM-DD HH:mm[:ss]", treated as
 * Asia/Beirut local) and return its ISO-8601 UTC representation.
 *
 * Throws if the input does not match the expected format.
 */
export function fromBackendDateTime(input: string): string {
  const match = BACKEND_DT_RE.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid backend datetime: ${JSON.stringify(input)}`);
  }
  const [, y, mo, d, h, mi, s = "0"] = match;
  const target: Wall = {
    year: Number(y),
    month: Number(mo),
    day: Number(d),
    hour: Number(h),
    minute: Number(mi),
    second: Number(s),
  };

  // First guess: treat the wall components as UTC. Then adjust by the
  // difference between the resulting Beirut wall clock and our target.
  let utcMs = Date.UTC(
    target.year,
    target.month - 1,
    target.day,
    target.hour,
    target.minute,
    target.second,
  );

  // Two iterations are enough even across DST transitions.
  for (let i = 0; i < 3; i++) {
    const delta = wallDeltaMs(target, beirutWallOf(utcMs));
    if (delta === 0) break;
    utcMs += delta;
  }

  return new Date(utcMs).toISOString();
}

/**
 * Format an ISO-8601 datetime string (or any value `Date` accepts) as a
 * backend-shaped Asia/Beirut wall-clock string `YYYY-MM-DD HH:mm`.
 *
 * Seconds are intentionally omitted because the backend ignores them on
 * write (verified Phase 1) — passing fewer fields keeps the request body
 * uniform with what the PDF documents.
 */
export function toBackendDateTime(iso: string | Date): string {
  if (typeof iso === "string") {
    const trimmed = iso.trim();
    const frontendMatch = FRONTEND_LOCAL_DT_RE.exec(trimmed);
    if (frontendMatch) {
      const [, y, mo, d, h, mi] = frontendMatch;
      return `${y}-${mo}-${d} ${h}:${mi}`;
    }
  }

  const d = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid datetime: ${JSON.stringify(iso)}`);
  }
  const w = beirutWallOf(d.getTime());
  return `${pad(w.year, 4)}-${pad(w.month)}-${pad(w.day)} ${pad(w.hour)}:${pad(w.minute)}`;
}

/**
 * Compose a backend "YYYY-MM-DD HH:mm:ss" string from the separate `date` +
 * `time` fields the booking-request response uses, then convert to ISO UTC.
 */
export function fromBackendDateAndTime(date: string, time: string): string {
  const composed = `${date.trim()} ${time.trim()}`;
  return fromBackendDateTime(composed);
}
