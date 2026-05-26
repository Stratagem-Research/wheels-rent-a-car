# 15 — Legal & Utility Pages

> Routes: `/privacy`, `/terms`, `/cookies`, `/404`, `/500`, `/maintenance`
> Depends on: `00_global.md`
> Related: PRD §4 (sitemap) — Legal & Utility cluster

---

## Purpose

Legal and utility pages exist to keep the site compliant, navigable, and resilient. None of them are conversion pages — they should be clear, calm, and quick to leave.

---

## /privacy, /terms, /cookies — Legal pages

All three follow the same long-form template (same as `/help/rental-terms` etc. in `10_help_faq.md`).

### Page sections

#### 1. Page header

- Background `colors.primary-95`. 24px vertical padding.
- Heading `headline-xl`: page title (Privacy Policy, Terms & Conditions, Cookie Policy).
- Subhead: "Last updated: [date]".

#### 2. Two-column body

```
┌─────────────────┬──────────────────────────────────────────┐
│ ON THIS PAGE    │   1. INTRODUCTION                        │
│ (sticky)        │   ...                                    │
│                 │                                          │
│ 1. Intro        │   2. ...                                 │
│ 2. ...          │                                          │
│ ...             │                                          │
└─────────────────┴──────────────────────────────────────────┘
```

- **Left rail:** sticky table of contents with anchor links.
- **Right column:** prose in `body-lg`, max line-length 720px. Headings `headline-md` with anchored IDs.

#### 3. Print + share strip

A small inline strip below the title:
- "Print this page" tertiary button (triggers browser print dialog with print-friendly CSS applied).
- "Download as PDF" tertiary link (Phase 1.5+).

#### 4. Contact strip

- Single line at the bottom of the article: "Questions about this policy? Contact us → /contact".

#### 5. Footer

Global footer.

### Print styles

When printed:
- Hide the global header, footer, sidebar.
- Render the content full-width.
- Show the page URL and print date in the print footer.

### Default content sources

- Privacy Policy — drafted by counsel; references Lebanese data protection law and EU GDPR for EU visitors.
- Terms & Conditions — covers rental terms, payment, cancellation, liability, dispute resolution.
- Cookie Policy — categorizes cookies (essential, analytics, marketing) and links to the cookie consent preferences.

All three are CMS-driven Markdown.

---

## /404 — Page not found

Reached when a route doesn't exist.

### Layout

```
                    ┌──────────────────────────┐
                    │                          │
                    │    [Wheels logo small]   │
                    │                          │
                    │    🛣  404                │
                    │                          │
                    │    Wrong turn.           │
                    │                          │
                    │    The page you were    │
                    │    looking for doesn't  │
                    │    exist or has moved.  │
                    │                          │
                    │    [ Browse our fleet ] │
                    │    [ Back to home ]      │
                    │                          │
                    │    Or chat with us on   │
                    │    🟢 WhatsApp           │
                    │                          │
                    └──────────────────────────┘
```

### Page sections

#### 1. Slim header

Logo only, links home.

#### 2. Centered illustration + message

- Subtle illustration: an empty road sign or a steering wheel pointing the wrong way.
- Headline `headline-xl`: "Wrong turn." (or per your copy preference)
- Subhead `body-lg`, max 480px: "The page you were looking for doesn't exist or has moved."
- Primary CTA: `Browse our fleet` (`button-cta` red).
- Secondary CTA: `Back to home` (`button-secondary` blue).
- Tertiary line: "Or chat with us on WhatsApp →".

#### 3. Suggested links

Below the CTAs, 4 helpful links in a row:
- Vehicles · Locations · Help · Contact.

#### 4. Footer

Global footer (collapsed minimal version).

### Behavior

- Status code: 404 (proper HTTP status).
- If route was a vehicle slug (`/vehicles/...`): show similar vehicles in the suggested links.
- If route was a location slug (`/locations/...`): show all branches.

---

## /500 — Server error

Reached on uncaught backend errors.

### Layout

Same template as /404 with these differences:

- Headline: "Something went wrong on our end."
- Subhead: "We're working on it. Please try again in a moment."
- Primary CTA: `Try again` (reloads the page).
- Secondary CTA: `Back to home`.
- WhatsApp tertiary line.
- Status code: 500.

### Behavior

- Auto-retry once silently after 3s if the error was a transient API failure.
- Logs the error to Sentry.
- Adds a unique error reference (small monospace text at the bottom: `ref: a1b2c3d4`) so users can quote it to support.

---

## /maintenance — Maintenance page

Used when the site is intentionally taken down for maintenance windows.

### Layout

Same centered card as /404 with these differences:

- No header nav.
- Headline: "We'll be right back."
- Subhead: "Wheels is undergoing scheduled maintenance. We expect to be back by [time]."
- No primary CTAs.
- WhatsApp tertiary line: "Need to book? Message us on WhatsApp."
- Status code: 503 with `Retry-After` header.

### Trigger

Toggled via an admin flag. When enabled, the site router intercepts every request and routes to /maintenance (except `/api/health` for monitoring).

---

## Module-specific components

### `<LegalArticleLayout />`

Two-column layout with sticky ToC, used for /privacy, /terms, /cookies, and the long-form help articles.

### `<TocSidebar />`

Reused from `10_help_faq.md`.

### `<UtilityErrorPage />`

Centered card error page pattern shared across /404, /500, /maintenance.

---

## States & edge cases

| Scenario                                          | Behavior                                                                              |
| ------------------------------------------------- | ------------------------------------------------------------------------------------- |
| User triggers /404 from a vehicle slug            | Show "Similar vehicles" suggested links.                                              |
| User triggers /404 from a location slug           | Show all branches as suggested links.                                                 |
| /500 retries succeeds                             | Page renders normally; error log retains the original failure for ops review.         |
| /maintenance is active and an authenticated admin | Bypass the maintenance page (cookie-gated); show a banner: "Maintenance mode active." |

---

## Data requirements

- **Legal content:** CMS-driven Markdown.
- **Maintenance flag:** server-side env var or feature flag.

---

## SEO & metadata

- Legal pages: `index, follow`. Title and description per page.
- /404, /500, /maintenance: `noindex, nofollow`.

---

## Acceptance criteria

- [ ] All three legal pages render with the sticky ToC and printable layout.
- [ ] /404 returns HTTP 404 and shows context-appropriate suggested links.
- [ ] /500 returns HTTP 500, logs to Sentry, shows error reference.
- [ ] /maintenance returns HTTP 503 with `Retry-After`, hides global nav, shows WhatsApp fallback.
- [ ] Print stylesheet hides nav and footer on legal pages and renders full-width content.
- [ ] All utility pages pass axe-core AA.
