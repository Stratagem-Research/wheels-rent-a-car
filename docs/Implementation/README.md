# Wheels Rent A Car — Implementation Specs

This folder contains the build-ready specification for the Wheels Rent A Car website (Phase 1, English). Files focus on **UI / UX / layout / sections / components** — not on code. Claude Code (or any other dev agent) reads these files alongside the design system to implement the site.

## Companion specs (read together)

- **Design tokens & visual system:** `/Design/DESIGN.md`
- **Full PRD with sitemap diagram:** `/PRD/Wheels_Rent_A_Car_PRD_v1.docx` (or .pdf)

## How to use these files

1. **Always read `00_global.md` first.** Every other file references the global page shell, design-token map, search bar, header, footer, WhatsApp FAB, modals, toasts, and form rules defined there.
2. **Pick the module file matching the route(s) you're building.** Each file lists its routes at the top.
3. **Follow the file structure.** Every module file is organized identically — purpose, page sections (top to bottom), module-specific components, states & edge cases, data requirements, SEO, acceptance criteria. This makes the spec greppable.
4. **Use the design tokens, not hardcoded values.** All colors, typography, spacing, shapes, and component styles come from `/Design/DESIGN.md`.
5. **Don't invent new components.** If a pattern is needed and not defined, escalate before adding — consistency is the priority.

## File index — recommended build order

| Order | File                            | Routes                                                 | Why this order                                     |
| ----- | ------------------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| 0     | `00_global.md`                  | (cross-cutting)                                        | Foundation — read first, always.                   |
| 1     | `01_home.md`                    | `/`                                                    | Landing page, anchors the brand.                   |
| 2     | `02_fleet_browse.md`            | `/vehicles`, `/vehicles/[category]`                    | Discovery surface; introduces the vehicle card.    |
| 3     | `03_vehicle_detail.md`          | `/vehicles/[slug]`                                     | The PDP — sells each car.                          |
| 4     | `04_booking_flow.md`            | `/book/*` (5 steps)                                    | Conversion engine.                                 |
| 5     | `05_locations.md`               | `/locations/*`                                         | Trust + BEY airport pickup.                        |
| 6     | `06_long_term.md`               | `/long-term`                                           | High-margin lead capture.                          |
| 7     | `07_chauffeur.md`               | `/chauffeur`                                           | With-driver service (restored in Revision 2).      |
| 8     | `08_corporate.md`               | `/corporate`                                           | B2B lead capture (restored in Revision 2).         |
| 9     | `09_about.md`                   | `/about`                                               | Brand trust page.                                  |
| 10    | `10_help_faq.md`                | `/help/*`                                              | Pre-purchase reassurance + post-booking lookup.    |
| 11    | `11_contact.md`                 | `/contact`                                             | Channels reference.                                |
| 12    | `12_account.md`                 | `/account/*`                                           | Authenticated user area.                           |
| 13    | `13_manage_booking.md`          | `/manage-booking`                                      | Guest booking lookup.                              |
| 14    | `14_auth.md`                    | `/login`, `/register`, `/forgot-password`, `/reset-password` | Authentication flows.                       |
| 15    | `15_legal_and_utility.md`       | `/privacy`, `/terms`, `/cookies`, `/404`, `/500`, `/maintenance` | Legal + error & maintenance pages.       |
| 16    | `16_trips.md`                   | `/trips`, `/trips/[slug]`                              | Self-drive trip articles (Revision 2 — CMS-driven).|
| 17    | `17_itineraries.md`             | `/itineraries`, `/itineraries/[slug]`                  | Chauffeur-led itineraries (Revision 2).            |
| 18    | `18_admin.md`                   | `/admin/*`                                             | Staging-only CMS dashboard (Revision 2).           |

## Section template (every module file follows this)

```
# NN — Module Name

> Route(s)
> Depends on
> Related (PRD, sitemap)
> Primary persona

## Purpose & success criteria

## Page sections (top to bottom)
  1. Section name
     - Layout
     - Components used
     - Content
     - Behavior
     - States
     - Mobile adaptation

## Module-specific components

## States & edge cases  (table)

## Data requirements

## SEO & metadata

## Acceptance criteria  (checklist)
```

## Cross-references quick map

When implementing a feature, you will commonly need to read multiple files together:

- **Building any page:** `00_global.md` (always) + the module file.
- **Building a vehicle card:** `02_fleet_browse.md` (definition) + `03_vehicle_detail.md` and `04_booking_flow.md` (variants).
- **Building the booking summary panel:** `03_vehicle_detail.md` (PDP variant) + `04_booking_flow.md` (flow variant).
- **Building forms:** `00_global.md` §9 (form rules) + the module's form section.
- **Building modals:** `00_global.md` §7 (modal rules) + the module-specific modal section.
- **Building auth gating:** `12_account.md` (account routes) + `14_auth.md` (auth flow).

## Phase scope reminder

Phase 1 ships:
- English-only (architecture ready for AR + FR in Phase 2).
- Customer-facing site (admin operations panel uses the existing internal system; no admin redesign in Phase 1).
- Card + Cash + Bank transfer + OMT/Whish payment methods.
- Beirut Airport pickup, City branches, Address delivery, Chauffeur as enquiry-only.
- WhatsApp Business API integration.

Out of scope for Phase 1 (see PRD §13):
- Native mobile apps.
- Loyalty program.
- Marketplace integrations (Booking, Rentalcars, Expedia).
- Marketing automation platform integration.
- Admin panel deep redesign.
- In-app digital licence verification.

## Acceptance & QA

Every module file ends with an acceptance-criteria checklist. The full Phase-1 acceptance criteria are in the PRD (Section 12). Verify each checklist before marking a module complete.
