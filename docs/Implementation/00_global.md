# 00 — Global Implementation

> **Audience:** Claude Code building the Wheels Rent A Car website.
> **Scope:** cross-cutting UI/UX rules that apply to every module. Read this file first; every other file in `/Implementation/` references the patterns defined here.
> **Companion specs:** `/Design/DESIGN.md` (design tokens), `/PRD/Wheels_Rent_A_Car_PRD_v1.docx` (full PRD).

---

## 1. Design system reference

All visual decisions resolve to tokens in `/Design/DESIGN.md`. Implementations must consume those tokens (Tailwind theme config, CSS variables, or design-tokens JSON) — never hardcode values that exist as tokens.

**Quick map of the most-used tokens:**

| Need                          | Token                                                |
| ----------------------------- | ---------------------------------------------------- |
| Brand blue (default actions)  | `colors.primary-40` (`#0E4F94`)                      |
| Brand red (single CTA / sale) | `colors.secondary-50` (`#C8102E`)                    |
| Body text                     | `colors.neutral-10` (`#0B0E13`)                      |
| Muted text                    | `colors.neutral-50`                                  |
| Page background               | `colors.surface` (`#FFFFFF`)                         |
| Card lift surface             | `colors.surface-subtle` (`#F4F6F9`)                  |
| Border                        | `colors.border` (`#E6EAEF`)                          |
| Headline font                 | Plus Jakarta Sans                                    |
| Body font                     | Inter                                                |
| Numeric font (prices, refs)   | JetBrains Mono                                       |
| Container max width           | `spacing.container-max` (`1280px`)                   |
| Page padding                  | mobile `20px`, desktop `40px`                        |
| Card radius                   | `rounded.lg` (`16px`)                                |
| Button radius                 | `rounded.md` (`12px`)                                |
| Chip radius                   | `rounded.pill` (`9999px`)                            |

**Brand rules that must hold globally:**

- Red is reserved for one CTA per screen. Everything else (nav, links, secondary buttons, selected states) is blue.
- Plus Jakarta Sans for any heading or button label; Inter for any prose; JetBrains Mono for any number that should align in a column (prices, totals, booking refs, license plates).
- Cards use 16px corners; buttons and inputs use 12px corners; chips and avatars are pill. Never mix radii on the same element.

---

## 2. Page shell

Every page (except auth and confirmation) renders inside the standard shell:

```
┌──────────────────────────────────────────────────────┐
│  [Promo strip — optional, dismissible]               │
├──────────────────────────────────────────────────────┤
│  [Header — sticky on scroll]                         │
├──────────────────────────────────────────────────────┤
│  [Persistent Search Bar — collapsed when scrolled]   │  (only on home, listing, PDP)
├──────────────────────────────────────────────────────┤
│                                                      │
│  [Main content — container-max 1280px, centered]     │
│                                                      │
├──────────────────────────────────────────────────────┤
│  [Footer]                                            │
└──────────────────────────────────────────────────────┘
              ┌──────────┐
              │ WhatsApp │  ← floating, persistent every page
              └──────────┘
```

Special shells:

- **Booking flow (`/book/*`)**: header is replaced by a slim header with logo + stepper + "Save & exit" link. Footer is replaced by a minimal footer (legal links only). No persistent search bar.
- **Auth pages (`/login`, `/register`, ...)**: centered single-column layout, no header nav, footer minimal.
- **Confirmation page**: full shell, but no persistent search bar.

---

## 3. Header

- **Height:** 72px desktop, 64px mobile.
- **Background:** `colors.surface` with a 1px bottom border in `colors.border`. On the homepage hero only, the header is transparent over the hero image and switches to solid white once the user scrolls past 60px.
- **Sticky:** yes, on every page after first scroll, with a subtle drop shadow (`elevation-1`) once stuck.

### Layout — desktop (≥1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│ [Logo]    Vehicles  Locations  Long-term  Chauffeur  Corporate   │
│           About  Help                                            │
│                            ☎ +961 1 ...   🟢 WhatsApp   Sign in │
└──────────────────────────────────────────────────────────────────┘
```

- **Logo (left, 40px tall):** Wheels logomark + wordmark. Click → `/`.
- **Primary nav (center-left):** in order — Vehicles, Locations, Long-term, Chauffeur, Corporate, About, Help. Each link uses `nav-link` token; active route uses `nav-link-active` (blue). 14px gap between items.
- **Right cluster:** click-to-call phone (label `Call us`, icon `phone`), WhatsApp icon button (32px, brand green), `Manage booking` text link, `Sign in` text link, `Register` button (blue primary, 36px small size).

### Layout — mobile (<1024px)

```
┌────────────────────────────────────────┐
│ [☰]   [Logo center]   🟢 WhatsApp  [👤]│
└────────────────────────────────────────┘
```

- Hamburger opens a full-screen drawer that slides in from the left.
- Drawer contents (top to bottom): close icon, prominent `Sign in` + `Register` buttons, primary nav (large 18px tap targets, 56px row height), divider, secondary actions (Manage booking, About, Help, Contact), divider, phone + WhatsApp CTAs as full-width buttons.
- WhatsApp icon stays visible in the top bar even when drawer is closed.

### States & behavior

- **Scroll behavior:** on scroll-up, header re-appears immediately; on scroll-down, header hides after 80px (mobile only). Desktop header stays sticky always.
- **Loading:** show a 2px progress bar in `colors.primary-40` at the top edge for any route change > 300ms.
- **Auth state:** when signed in, the right cluster swaps `Sign in / Register` for an avatar dropdown (initials in a 36px blue circle) → menu (Account, My bookings, Documents, Sign out).

---

## 4. Persistent search bar

The most important component on the site. Used on the homepage hero, the fleet listing top, and as a sticky pinned bar on /book/select-vehicle.

### Layout — desktop expanded

```
┌──────────────────────────────────────────────────────────────────────┐
│ Pickup ▾  Beirut Airport (BEY)        ☐ Different return location    │
│ Pickup date 📅 May 20  10:00 ▾      Return date 📅 May 25  10:00 ▾  │
│ Promo code (optional)                                  [ Show cars ] │
└──────────────────────────────────────────────────────────────────────┘
```

- **Container:** white card, `rounded-xl` (24px), `elevation-2`, 24px internal padding.
- **Pickup location dropdown:** opens a categorised picker:
  - **Beirut Airport (BEY)** — single option with airplane icon
  - **City Branches** — list of branches (Hamra, Downtown Beirut, Dbayeh, etc.) with location pin icons
  - **Address Delivery** — opens a Google Places autocomplete
  - **With driver** — links to /chauffeur (no flow continuation)
- **Different return location** checkbox: when checked, reveals a second location dropdown.
- **Date pickers:** open a 2-month calendar popover. Pickup date defaults to today + 1; return defaults to pickup + 3 days. Min: today. Max: today + 11 months.
- **Time pickers:** dropdown with 30-minute increments from 06:00 to 23:30. 24h format.
- **Promo code:** collapsed text-link "Add promo code"; expands inline.
- **CTA:** `button-cta` (red), label "Show cars", takes the user to `/book/select-vehicle?...query`.

### Layout — desktop scrolled / compact

When stuck to the top of the page, collapses to a single horizontal row:

```
┌──────────────────────────────────────────────────────────┐
│  📍 BEY · 📅 May 20 10:00 → May 25 10:00  ✏ Edit  [Show] │
└──────────────────────────────────────────────────────────┘
```

Click `Edit` → re-expand inline.

### Layout — mobile

The search bar is a single tap-target showing summary text. Tap opens a full-screen sheet with each field as its own step (Pickup → Dates → Times → Confirm). The `Show cars` button lives at the bottom of the sheet.

### Validation

- All fields required except promo code and return location.
- Return must be after pickup; if invalid, show inline error below the date row.
- If pickup date is < 24h away, show a warning chip "Same-day rental — call to confirm" with a phone link.

### State persistence

Search criteria persist in `localStorage` under `wheels.lastSearch`. On home revisit, pre-fill from this if < 7 days old.

---

## 5. Footer

Four-column layout on desktop, stacked on mobile. Background `colors.primary-10` (deep brand blue), text `colors.neutral-99`.

### Columns

1. **Wheels** — About, Locations, Fleet, Long-term Rental, Chauffeur, Corporate.
2. **Help** — FAQ, Rental Terms, Insurance & Coverage, Payment & Deposits, Cancellation Policy.
3. **Contact** — Phone +961 ..., WhatsApp +961 ..., Email, Branch addresses (collapsible accordion of branches).
4. **Trust & Social** — Trustpilot/Google rating widget, payment method icons (Visa, Mastercard, Amex, OMT, Whish, Bob), social icons (Instagram, Facebook, TikTok, LinkedIn).

### Bottom strip

Single row, smaller text in `colors.neutral-70`:

```
© 2026 Wheels Rent A Car  ·  Privacy  ·  Terms  ·  Cookies          🌐 EN ▾
```

Language switcher shows EN active; AR and FR appear with "Coming soon" badge.

---

## 6. Floating WhatsApp action button

- **Position:** `position: fixed; bottom: 24px; right: 24px;` on desktop. On mobile: `bottom: 96px; right: 16px;` (above the bottom nav / safe area).
- **Size:** 56px circle, `rounded-full`, WhatsApp green (`colors.whatsapp` / `#25D366`), white WhatsApp icon (28px).
- **Shadow:** `elevation-3`.
- **Hover/pressed:** background swaps to `colors.whatsapp-pressed`.
- **Click behavior:** opens `https://wa.me/9613XXXXXXX?text=<context-message>` in a new tab.

### Context-aware pre-filled messages

| Page / context           | Pre-filled message                                                    |
| ------------------------ | --------------------------------------------------------------------- |
| Homepage / generic       | `Hi Wheels — I have a question about renting a car.`                  |
| Fleet listing            | `Hi Wheels — I'm browsing your fleet and would like some help.`       |
| Vehicle detail page      | `Hi Wheels — I'm interested in the {model} from {pickup} to {return}.`|
| /book/select-vehicle     | `Hi Wheels — I need help choosing a car for {pickup} → {return}.`     |
| /book/checkout (idle 30s)| `Hi Wheels — I'm completing a booking and need help.`                 |
| Confirmation             | `Hi Wheels — my booking ref is {ref}. I have a question.`             |

### Hide rules

Hide on `/book/checkout` once the user has interacted with the payment form (avoid distraction at the moment of conversion). Show again if the form sits idle for 60s (assistance prompt).

---

## 7. Modals & sheets

- **Backdrop:** `rgba(11, 14, 19, 0.55)`, fades in over 200ms.
- **Container:** white, `rounded-xl` (24px), 32px padding, `elevation-4`. Max width 560px (small), 720px (medium), 960px (large).
- **Mobile behavior:** modals become bottom sheets — full width, anchored to bottom, only top corners rounded. Swipe-down to dismiss.
- **Close:** X button top-right (40×40 hit area), `Esc` key, click on backdrop.
- **Focus:** trap focus inside the modal; restore to trigger on close.
- **Animation:** fade-in + 8px translateY on desktop; slide-up on mobile (300ms ease-out).

Common modals are listed per module file. Global ones include:

- Login modal (mid-checkout) — see `14_auth.md`.
- Cookie consent banner — bottom-anchored, two buttons (Accept all / Manage preferences). Persistent until dismissed.
- Newsletter popup — appears once per session after 30s on home, dismissible, suppressed for 30 days after dismissal.

---

## 8. Toasts & notifications

- **Position:** desktop bottom-right, 24px from edges; mobile top, with safe-area inset.
- **Container:** 320px max width, `rounded-md`, padding 14×18, `elevation-3`.
- **Types:**
  - `info` — background `colors.primary-10`, white text. Auto-dismiss 4s.
  - `success` — background `colors.success`, white text. Auto-dismiss 3s.
  - `warning` — background `colors.warning`, white text. Manual dismiss.
  - `error` — background `colors.error`, white text. Manual dismiss.
- **Stacking:** new toast pushes older ones up; max 3 visible.
- **Animation:** slide + fade, 200ms ease-out.

Common toast messages are defined in their respective module files.

---

## 9. Forms — global rules

- **Field height:** 52px desktop, 56px mobile (better tap target).
- **Label:** above the field, `typography.label-md`, color `colors.neutral-40`. Required fields have a `*` in `colors.error`.
- **Helper text:** below field, `typography.label-sm`, color `colors.neutral-60`.
- **Error text:** below field, `typography.label-sm`, color `colors.error`. Replaces helper text when present.
- **Spacing:** 8px between label and field; 6px between field and helper/error; 20px between fields.
- **Phone input:** flag + country code default to 🇱🇧 +961. Selectable from a searchable dropdown.
- **Date input:** uses the same date popover as the search bar. Never a native browser picker.
- **File upload:** dashed-border drop zone, 24px padding, centered icon + label "Drag a file or browse". Show file name + size + remove button after selection. Accepted formats and max size shown in helper text.
- **Inline validation:** validate on blur, not on every keystroke. Submit attempts validate all fields and scroll to the first error.
- **Auto-fill:** mark inputs with appropriate `autocomplete` attributes (cc-number, cc-exp, name, email, tel, etc.).

---

## 10. Buttons — global rules

The button system is defined in `/Design/DESIGN.md` under `components.button-*`. Reinforced rules for implementation:

- **One CTA per screen.** The red `button-cta` is the highest-conversion action only — "Show cars", "Select", "Pay & confirm", "Reserve now".
- **Primary blue (`button-primary`)** for everything else: Continue, Save, Edit, Update, Submit (when not the singular conversion), Apply.
- **Secondary outline (`button-secondary`)** for alternate paths: Cancel, Edit search, Save for later.
- **Tertiary text (`button-tertiary`)** for low-stakes actions inside cards, inline links that look like buttons, and tertiary "View details" affordances.
- **Loading state:** swap label for a spinner; keep the button width fixed; `aria-busy="true"`.
- **Disabled state:** `pointer-events: none`, opacity reduced, no hover state.
- **Icon-only buttons:** must have an `aria-label`. Min 40×40 hit area.
- **Full-width on mobile:** primary and CTA buttons in form contexts go 100% width on mobile.

---

## 11. Responsive breakpoints

Mobile-first. Every component must work at 360px width minimum.

| Name | Range          | Container padding | Notes                                          |
| ---- | -------------- | ----------------- | ---------------------------------------------- |
| xs   | 360–479px      | 16px              | Smallest target. iPhone SE.                    |
| sm   | 480–767px      | 20px              | Larger phones.                                 |
| md   | 768–1023px     | 24px              | Tablet. Two-column layouts begin.              |
| lg   | 1024–1279px    | 32px              | Desktop default. Header full nav.              |
| xl   | 1280–1535px    | 40px              | Container reaches 1280 max.                    |
| 2xl  | 1536+          | 40px              | Container stays 1280; rest is breathing room.  |

Grid: 4 columns mobile (xs–sm), 8 columns md, 12 columns lg+. Gutter 16px on mobile, 24px on desktop.

---

## 12. Accessibility

Target **WCAG 2.1 AA**. Verified with axe-core in CI.

- Every interactive element keyboard-reachable; visible focus ring at `4px` `colors.primary-95` halo + `2px` `colors.primary-50` inner ring.
- Skip-to-content link as the first focusable element on every page.
- Semantic HTML: use `<button>` for actions, `<a>` for navigation, `<nav>`, `<main>`, `<header>`, `<footer>`, `<section>` with `aria-labelledby`.
- All images have meaningful `alt`. Decorative images use `alt=""`.
- Color contrast: body text ≥ 4.5:1; large text ≥ 3:1; UI components and graphical objects ≥ 3:1.
- Forms: every input has a label (`<label for>` or `aria-labelledby`). Error messages are programmatically associated via `aria-describedby` and announced via `role="alert"`.
- Modals: `role="dialog"`, `aria-modal="true"`, focus trap, restore focus on close.
- Motion: respect `prefers-reduced-motion`. Disable parallax and large transforms when set.
- WhatsApp icon button has `aria-label="Chat with us on WhatsApp"`.
- Map embeds have a text-based fallback (address + directions link).
- Color is never the sole carrier of information (e.g., error states pair red with an icon and text).

---

## 13. Performance budgets

| Metric                                             | Budget    |
| -------------------------------------------------- | --------- |
| Largest Contentful Paint (mobile, 3G)              | < 2.5s    |
| First Input Delay                                  | < 100ms   |
| Cumulative Layout Shift                            | < 0.1     |
| Time to Interactive (mobile, 4G)                   | < 4s      |
| Total page weight (initial, mobile)                | < 1.0 MB  |
| Initial JS payload                                 | < 180 KB  |
| Initial CSS                                        | < 60 KB   |
| Hero image (above the fold)                        | < 200 KB  |
| Vehicle card image                                 | < 60 KB   |
| Web font total                                     | < 120 KB  |

**Image strategy:** all images use `next/image` (or equivalent) with explicit width/height to prevent layout shift. WebP/AVIF preferred. Lazy-load below the fold; eagerly load hero. Vehicle photos served at 4 sizes (320, 480, 720, 1080).

**Font strategy:** preload Plus Jakarta Sans 600 + 700 and Inter 400 + 500 with `font-display: swap`. JetBrains Mono loads on demand only on pages that use it.

**Code splitting:** booking flow steps load lazily; account pages bundle only after auth; map embeds lazy-load on intersection.

---

## 14. SEO

- **Per-page meta:** title (≤ 60 chars), description (≤ 155 chars), Open Graph image (1200×630), Twitter card.
- **Canonical URLs:** absolute, lowercase, kebab-case.
- **Structured data (JSON-LD):**
  - `Organization` on every page.
  - `LocalBusiness` (sub-type `AutoRental`) on each branch page.
  - `Product` (with `Offer`) on each vehicle detail page.
  - `FAQPage` on Help and FAQ.
  - `BreadcrumbList` on every page that has breadcrumbs.
- **Sitemap.xml** auto-generated; revalidated daily.
- **robots.txt** allows everything except `/account/*`, `/book/checkout`, `/book/confirmation/*`, `/api/*`.
- **hreflang** placeholders for `en`, `ar`, `fr` even though Phase 1 ships only EN — keeps the architecture ready.

---

## 15. Empty, loading, and error states

These three states are required for any data-driven view. Implementations missing any of them will be rejected at QA.

### Empty state

- Centered illustration (subtle, brand-aligned), one-line headline, supportive sentence, primary CTA.
- Example (search results no-match):
  - Illustration: a small empty road graphic.
  - Headline: "No cars for these dates."
  - Body: "Try a wider window or pick a different location."
  - CTAs: "Try ±2 days" (primary), "Reset filters" (tertiary).

### Loading state

- **Skeletons** preferred over spinners for layouts; shimmer animation in `colors.neutral-95` ↔ `colors.neutral-90` (1.2s loop, respects reduced-motion).
- **Spinners** allowed inline (button loading, small async actions). 24px, color matches the surrounding text color.
- **Page-route loading:** 2px progress bar at the top edge of the page in `colors.primary-40`.

### Error state

- Friendly, plainspoken copy. No stack traces.
- Pattern: icon (alert) + headline + body + primary action ("Try again") + secondary ("Chat on WhatsApp").
- Sync errors with the internal management system show: "Online booking is temporarily unavailable. Reach us on WhatsApp +961 …" — and disable the booking funnel gracefully.

---

## 16. Copy voice

- **Plainspoken, confident, warm.** Read it aloud — if it sounds like a brochure, rewrite.
- **Active voice. Short sentences.** "We pick you up at the airport." not "Pickup at the airport will be arranged by our team."
- **Money is always clear.** "$160 total · 5 days · taxes and basic insurance included." Never hide a fee.
- **Lebanon-aware but not gimmicky.** No flag emojis in body copy. "Lebanese pound" in full at first mention, "LBP" thereafter.
- **Numbers:** USD shown with `$` prefix; LBP shown with `LBP` suffix; both in tabular figures.
- **Dates:** `DD MMM YYYY` for display (e.g., `20 May 2026`), `YYYY-MM-DD` for data.
- **Times:** 24-hour format with leading zero (`09:30`, `18:00`).
- **Phone numbers:** display as `+961 1 234 567` (country code, area code, local — spaces, no dashes).
- **Booking ref:** `WRC-YYMMDD-XXXX` in JetBrains Mono, copy-to-clipboard affordance always visible.

---

## 17. Lebanon-specific globals

These behaviors are global because they apply across multiple modules:

### WhatsApp opt-in
- Checkbox on `/book/checkout`: "Send my booking updates via WhatsApp" — default ON for `+961` numbers, OFF for international.
- Persists in user preferences once an account exists.

### Phone-number defaulting
- Country flag dropdown defaults to 🇱🇧 +961 if the visitor's IP geolocates to Lebanon (server-side detection acceptable).
- All other geos default to their detected country; fall back to 🇺🇸 +1.

### Currency
- All prices display in **USD**. LBP is shown only as a small secondary line on the confirmation screen, calculated at the latest available daily rate.

### Cash + bank transfer + OMT/Whish
- Cash and bank transfer are toggled per branch in admin; the search bar surfaces only branches that support the user's selected method (Phase 1 alternative: show the option globally and validate at checkout).
- Bank transfer creates a **Pending** booking — see `04_booking_flow.md` for the full state machine.

### Floating support
- WhatsApp button is always visible. Phone number always click-to-call in header and footer. Email link in footer only.

---

## 18. Analytics & conversion tracking

Track events across modules with consistent names:

| Event                       | Trigger                                              |
| --------------------------- | ---------------------------------------------------- |
| `search_submitted`          | "Show cars" clicked                                  |
| `vehicle_viewed`            | PDP loaded                                           |
| `vehicle_selected`          | Step-1 "Select" → rate confirmed                     |
| `extras_viewed`             | Step 2 reached                                       |
| `extras_added`              | Each add-on toggled on                               |
| `protection_selected`       | Step 3 tier chosen                                   |
| `checkout_started`          | Step 4 reached                                       |
| `payment_method_selected`   | Cash / Card / Transfer / OMT chosen                  |
| `booking_completed`         | Confirmation screen rendered                         |
| `whatsapp_clicked`          | Floating WhatsApp tapped (with page context)         |
| `account_created`           | Successful registration                              |
| `booking_modified`          | Edit completed in Manage Booking                     |
| `booking_cancelled`         | Cancellation confirmed                               |

Stack: GA4 + Meta Pixel (client) + server-side Conversion API for booking events. Cookie consent gates non-essential analytics.

---

## 19. Routing & data fetching

- App router (Next.js or equivalent). Routes mirror the sitemap exactly (see `/PRD/Wheels_Rent_A_Car_PRD_v1.docx` Section 4).
- Server components for content pages (Home, About, Help, Locations) for SEO and TTFB.
- Client components for interactive surfaces (search bar, filters, booking flow).
- Vehicle availability API: cached for 60s with cache-bust on write.
- Pricing API: never cached for the booking flow; called fresh at `/book/select-vehicle`, `/book/extras`, `/book/protection`, and `/book/checkout` entry points.
- All booking-related API calls retry 2× with exponential backoff before surfacing an error.

---

## 20. State management for the booking flow

A single in-memory + URL-persisted booking-draft model. Survives page refresh during the funnel via `sessionStorage` keyed `wheels.booking.draft`.

**Shape (informational, not a code spec):**

```
BookingDraft {
  pickup: { type, locationId, address?, datetime }
  return: { locationId, address?, datetime }
  vehicle: { id, rate: { type: best|flexible, mileage: capped|unlimited } }
  extras: [{ id, qty }]
  protection: { tierId }
  driver: { firstName, lastName, email, phone, dob, licenceNumber, licenceIssue, licenceExpiry, country }
  flightNumber?: string
  paymentMethod: 'card' | 'cash' | 'transfer' | 'omt'
  marketingConsent: boolean
  whatsappOptIn: boolean
  promoCode?: string
}
```

The draft is cleared once the booking is confirmed or after 24h of inactivity.

---

## 21. File header pattern

Every module file under `/Implementation/` starts with the same header so Claude Code can scan quickly:

```
# {NN} — {Module Name}

> Route(s): {list}
> Depends on: {global, design tokens, other modules}
> Related: {sitemap section, PRD section}
> Primary persona: {Tourist | Local | Business | All}
```

Then sections in this order:

1. Purpose & success criteria
2. Page sections (top to bottom, with layout, components, content, behavior, states, mobile)
3. Module-specific components
4. States & edge cases
5. Data requirements
6. Acceptance criteria

Stick to this pattern. It makes the spec greppable and predictable.
