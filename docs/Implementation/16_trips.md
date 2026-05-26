# 16 — Trips

> Routes: `/trips`, `/trips/[slug]`
> Depends on: `00_global.md`, `landingpage.md` (§5 Explore Lebanon entry point), admin spec `18_admin.md`
> Related: PRD §6.13, Sitemap v2 SVG, `lib/admin/store.ts`
> Primary persona: Inbound Tourist + Local Lebanese Renter

## Purpose & success criteria

`/trips` is the **self-drive blog**: editorial trip articles ("Drive Lebanon, your way" content) that help renters pick a destination and the right car for it. Added in Revision 2 (Phase 12).

- Provide a clear, browsable catalog of curated drive routes (Cedars, Baalbek, Tyre, etc.).
- Convert article readers into renters with a suggested-vehicle CTA on each detail page.
- Surface trip content on the homepage Explore Lebanon carousel as the discovery entry point.
- Be CMS-driven so the client (or content team) can publish/edit articles via `/admin/trips` without a deploy.

## Page sections

### `/trips` — listing

1. **Inverse hero band** — `display-xl` "Plan your Lebanon drive." + `lead-lg` sub. Matches `/long-term` + `/chauffeur` + `/corporate` rhythm.
2. **Filter chips row** — pill chips for region: All / Mountains / Coast / Bekaa / Cultural / North / South. Single-select; active fills ink-100 / paper.
3. **Tile grid** — 3-up on lg, 2-up on md, 1-up on sm. Each tile is `<DestinationTile />` linking to `/trips/[slug]`.

Empty state (no trips in selected region): `bg-ink-10` card with "No trips in this region yet."

### `/trips/[slug]` — article

1. **Cover hero** — full-bleed photo + dark gradient overlay. `display-xl` title, `lead-lg` excerpt, meta chip ("8h · SUV recommended"). Same hero pattern as the new homepage.
2. **Body + sidebar** — body in `body-lg` narrow column (max 680px). Sticky sidebar on lg with a **suggested-vehicle card** (vehicle-category label, body-sm rationale, singular red `cta` "Browse [category] cars" linking to `/vehicles?category=`).
3. **Related trips strip** — 3-up grid of `<DestinationTile />` for non-current trips on `bg-ink-10` band.

## Module-specific components

- `<DestinationTile />` (existing) — image-led tile reused across both surfaces.
- `<Hero />`-style cover (page-local) — same cinematic photo + gradient overlay pattern as `app/(marketing)/_components/Hero.tsx`.

## States & edge cases

| Scenario | Behaviour |
| --- | --- |
| Admin creates a new trip with an existing slug | Inline form error: "That slug already exists. Choose another." |
| Empty region filter | "No trips in this region yet." card; admin can publish more. |
| Trip not found (`/trips/[unknown]`) | Renders `not-found.tsx`. |
| Suggested vehicle category empty | Defaults to `sedan` in the form; never sent empty to public page. |

## Data requirements

`Trip` (in `types/domain.ts`):
```
{
  slug: string;          // url-safe, lowercase, dashes only
  title: string;
  excerpt: string;       // listing teaser
  coverImage: TripImage; // src + alt + intrinsic dimensions
  meta: string;          // "8h · SUV recommended"
  region: TripRegion;    // "mountains" | "coast" | "bekaa" | "cultural" | "north" | "south"
  body: string;          // Markdown; paragraphs separated by blank line
  suggestedVehicleCategory: VehicleCategory;
  tags: string[];
  publishedAt: ISODate;
  updatedAt: ISODateTime;
}
```

Default seed in `lib/api/mocks/fixtures/content.ts → TRIPS` (6 articles). Admin CRUD overlays via `lib/admin/store.ts → readTrips() / writeTrips()`.

Future backend contract: `GET /api/trips`, `GET /api/trips/:slug`, `POST /api/admin/trips`, `PUT /api/admin/trips/:slug`, `DELETE /api/admin/trips/:slug`.

## SEO & metadata

- `/trips` — `title: "Trip guides — Wheels Rent A Car"`, `description: "Self-drive trip guides across Lebanon. Plan your route, pick your car."`.
- `/trips/[slug]` — title and description derived from each article (`title: "${trip.title} — Wheels Rent A Car"`, `description: trip.excerpt`).
- JSON-LD: `Article` schema on each detail page (future).

## Acceptance criteria

- [ ] `/trips` lists every trip in the store.
- [ ] Region filter chips correctly filter and persist via URL (future enhancement).
- [ ] Each tile links to its detail page; detail page renders body + suggested-vehicle card + related trips.
- [ ] Admin create reflects on the homepage carousel + `/trips` listing live (no reload).
- [ ] Admin delete removes from listing + carousel immediately.
- [ ] Singular red CTA per page: "Browse [category] cars" on detail, no red on listing (filter chips are monochrome).
- [ ] Mobile snap-scroll works on the homepage carousel.
- [ ] `not-found.tsx` renders for unknown slugs.
