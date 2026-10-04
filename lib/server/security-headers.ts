/**
 * Response headers applied by next.config.ts. Kept here (not inline) so a test
 * can pin them — they're easy to drop by accident and nothing else would notice.
 *
 * Deliberately not a full script-src CSP: the site loads GA4, Meta Pixel,
 * Sentry, Google Maps and Next's own inline scripts, and a strict policy needs a
 * report-only trial first or it will break checkout. What's here blocks
 * clickjacking and plugin/base-tag tricks without touching any of that.
 */

export type HeaderEntry = { key: string; value: string };

/** Sent on every response. */
export const SECURITY_HEADERS: HeaderEntry[] = [
  // Nobody may embed this site in a frame. Our own <iframe> (the contact page
  // map) is outbound framing and isn't affected.
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'" },
  // Older browsers that don't read frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Only the microphone is switched off. Geolocation (LocationPicker) is used, so
  // it must stay available.
  { key: "Permissions-Policy", value: "microphone=()" },
  // One year, no includeSubDomains: other subdomains may not be HTTPS-ready.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

/** Extra headers for the admin UI and its API: never cache what's behind a login. */
export const ADMIN_HEADERS: HeaderEntry[] = [
  { key: "Cache-Control", value: "no-store, max-age=0" },
];
