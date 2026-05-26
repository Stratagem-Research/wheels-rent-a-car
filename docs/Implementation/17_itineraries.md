# 17 — Itineraries

> Routes: `/itineraries`, `/itineraries/[slug]`
> Depends on: `00_global.md`, `07_chauffeur.md`, admin spec `18_admin.md`
> Related: PRD §6.14, Sitemap v2 SVG, `lib/admin/store.ts`
> Primary persona: Inbound Tourist + Business Traveler

## Purpose & success criteria

`/itineraries` is the **chauffeur-led tours catalog**. Added in Revision 2 (Phase 12). Where `/trips` is for guests who drive themselves, `/itineraries` is for guests who want a driver to do the route for them.

- Showcase the chauffeur service through tangible, real-feeling day-trip products.
- Be the destination of the "See all itineraries →" link on `/chauffeur`.
- Convert detail-page readers into chauffeur leads (red CTA = "Request this itinerary" → `/chauffeur#enquiry`).
- Be CMS-driven so the client can publish/edit itineraries via `/admin/itineraries`.

## Page sections

### `/chauffeur` integration

The `/chauffeur` page Sample Itineraries section was redesigned from a 3-up grid to a **horizontal snap-scroll carousel** using `<ItineraryCard />`. Shows up to 6 items with a "See all itineraries →" link top-right routing to `/itineraries`.

### `/itineraries` — listing

1. **Inverse hero band** — `display-xl` "Chauffeur-led itineraries." with primary-inverse "Request a driver" (the singular red on the page, leading back to the chauffeur enquiry) + tertiary-inverse "About our chauffeurs" link.
2. **Filter chips row** — pill chips for category: All / Day trips / Multi-day / Cultural / Wine / North / South.
3. **Tile grid** — 3-up on lg, 2-up on md, 1-up on sm. Each tile is `<ItineraryCard />`.

### `/itineraries/[slug]` — detail

1. **Cover hero** — full-bleed photo + dark gradient overlay. Title, excerpt, and meta chips (Duration · From $X · Vehicle class).
2. **Highlights + vehicle-class sidebar** — 2-col grid of highlight bullets on the left, sticky vehicle-class card on the right with **singular red CTA "Request this itinerary"** linking to `/chauffeur#enquiry`.
3. **Schedule timeline** — 24h-clock time column + step title + optional body on `bg-ink-10` band. Each entry from `Itinerary.schedule`.
4. **Related itineraries** — 3-up `<ItineraryCard />` grid on paper.

## Module-specific components

- `<ItineraryCard />` (new) — editorial card with 4:5 cover photo + bottom scrim showing title/duration; body with excerpt + "From $X" + view-itinerary link. Used on `/chauffeur` carousel + listing + related strip.

## States & edge cases

| Scenario | Behaviour |
| --- | --- |
| Admin creates itinerary with existing slug | Inline form error refuses duplicate. |
| Empty category filter result | "No itineraries in this category yet." card with WhatsApp suggestion. |
| `priceFromCents = 0` | Renders "From $0.00" — admin form validation now accepts 0 but flags negative values; UI shows what was saved. |
| Schedule with no entries | Form blocks save; "Add at least one schedule step." |
| Itinerary not found (`/itineraries/[unknown]`) | Renders `not-found.tsx`. |

## Data requirements

`Itinerary` (in `types/domain.ts`):
```
{
  slug: string;
  title: string;
  excerpt: string;
  coverImage: TripImage;
  category: ItineraryCategory; // day-trip | multi-day | cultural | wine | north | south
  duration: string;            // display string ("Full day · 9-10 hours")
  priceFromCents: Cents;
  highlights: string[];
  schedule: ItineraryScheduleItem[]; // { time, title, body? }
  vehicleClass: "sedan" | "suv" | "van";
  updatedAt: ISODateTime;
}
```

Default seed in `lib/api/mocks/fixtures/content.ts → ITINERARIES` (6 itineraries). Admin CRUD overlays via `readItineraries() / writeItineraries()`.

Future backend contract: `GET /api/itineraries`, `GET /api/itineraries/:slug`, `POST/PUT/DELETE /api/admin/itineraries`.

## SEO & metadata

- `/itineraries` — `title: "Chauffeur itineraries — Wheels Rent A Car"`, `description: "Day trips and multi-day tours across Lebanon, driven by our vetted chauffeurs."`.
- `/itineraries/[slug]` — derived from the itinerary.
- JSON-LD: `TouristTrip` (future) — for now the structured data is the chauffeur `Service` already emitted by `/chauffeur`.

## Acceptance criteria

- [ ] `/chauffeur` Sample Itineraries section scrolls horizontally on touch and desktop.
- [ ] "See all itineraries →" link routes to `/itineraries`.
- [ ] `/itineraries` lists every itinerary in the store, filterable by category.
- [ ] Detail page renders highlights + schedule timeline + request-driver red CTA.
- [ ] Singular red CTA per page: "Request a driver" on listing, "Request this itinerary" on detail.
- [ ] Admin create reflects on `/chauffeur` carousel + `/itineraries` listing live.
- [ ] `not-found.tsx` renders for unknown slugs.
