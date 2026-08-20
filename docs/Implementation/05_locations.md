# 05 — Locations

> Routes: `/locations`, `/locations/beirut-airport`, `/locations/[branch]`
> Depends on: `00_global.md`
> Related: PRD §6.5
> Primary persona: All — but BEY page is critical for tourists

---

## Purpose & success criteria

The locations module establishes physical presence and trust. The Beirut Airport page is the second-most-important conversion page on the site (after the homepage), serving inbound tourists who land already searching for a car.

**Success looks like:**
- BEY page in the top 5 entry pages by traffic.
- Each branch page returns valid `LocalBusiness` JSON-LD.
- Click-throughs from a branch page to the booking flow ≥ 20%.

---

## /locations — hub page

### Page sections

#### 1. Page header

- Background `colors.primary-95`. 24px vertical padding.
- Heading `headline-lg`: "Our locations".
- Subhead `body-md`: "Pick up your car anywhere in Lebanon — from Beirut Airport to your hotel doorstep."

#### 2. Persistent search bar

Standard global search bar (per `00_global.md` §4), pre-anchored with the current section's pickup type.

#### 3. Map + branch list (split layout)

```
┌──────────────────────────────────┬──────────────────────────────┐
│                                  │   BRANCHES                   │
│                                  │                              │
│   [Interactive map of Lebanon]   │   📍 Beirut Airport (BEY)    │
│   Pins for each branch           │   Open 24/7 · Free pickup    │
│                                  │   ──────────────────────     │
│   [Active pin highlighted]       │   📍 Hamra                   │
│                                  │   8:00 – 20:00               │
│                                  │   ──────────────────────     │
│                                  │   📍 Downtown Beirut         │
│                                  │   ...                        │
│                                  │                              │
│                                  │   ✚ Address Delivery         │
│                                  │   We deliver to your hotel   │
│                                  │   or address                 │
└──────────────────────────────────┴──────────────────────────────┘
```

- **Map (left, 60%):** Mapbox or Google Maps embed. Centered on Lebanon. Pin per branch + a special pin for BEY.
- **Branch list (right, 40%):** scrollable list of cards. Each card:
  - Pin icon + branch name (`title-lg`).
  - Hours (`label-md`).
  - One-line description (`body-sm`).
  - "View details →" tertiary link → `/locations/[branch]`.
  - Hovering a card highlights the corresponding map pin and vice versa.
- **Address Delivery card:** distinct visual treatment (no map pin, gradient background `primary-95 → primary-90`, with a delivery van illustration).

#### 4. Why pick up at our branches

3-up value prop section (similar pattern to home §4):
- "We meet you at the airport" — Free pickup at BEY arrivals.
- "City-center branches" — Pick up near your hotel.
- "Door delivery available" — We bring the car to you.

#### 5. Footer

Global footer.

---

## /locations/beirut-airport — BEY detail page

The single most important location page. Treat it with extra care.

### Page sections

#### 1. Hero

- Full-width background photo of BEY airport exterior or arrivals hall.
- Overlay: `display-lg` headline "Pick up your car at Beirut Airport" + subhead "Free pickup. Meet our agent at arrivals. Drive away in minutes."
- Search bar pre-anchored with `Beirut Airport (BEY)` selected.

#### 2. How it works — 4-step illustration row

Numbered cards explaining the airport pickup process. Each card has an icon, step number, headline, body.

1. **Book online.** Pick your dates and car.
2. **Land at BEY.** Once you've collected your bags, head to the arrivals hall.
3. **Meet our agent.** Look for the Wheels sign at exit B. Show your booking ref.
4. **Drive away.** Quick paperwork at our desk. You're on the road in 15 minutes.

#### 3. Meeting point map + photo

- Embedded map of the BEY arrivals hall with the Wheels meeting point marked.
- A real photo of the meeting point ("This is what to look for").
- Address: "Wheels desk, Arrivals Hall, Exit B, Beirut–Rafic Hariri International Airport, Beirut".
- Phone: dedicated BEY desk number, click-to-call.
- WhatsApp: dedicated BEY WhatsApp link.

#### 4. Flight tracking note

Card with explainer:
- Headline: "We track your flight."
- Body: "Once you book, we monitor your flight number and adjust pickup time automatically. If your flight is delayed up to 90 minutes, we'll wait at no extra charge."

#### 5. FAQ accordion (BEY-specific)

- Where exactly do I meet the agent?
- What if my flight is delayed more than 90 minutes?
- Can I drop the car back at the airport?
- Do you have child seats available at pickup?
- Can someone else pick up the car for me?

#### 6. CTA strip

- Background `colors.primary-10`, white text.
- Headline `headline-md`: "Ready to land and drive?"
- Subhead `body-md`: "Book your car now — free cancellation up to 24h."
- `button-cta` red: "Browse cars".

#### 7. Footer

Global footer.

---

## /locations/[branch] — generic branch page

A standardized template for each city branch (Hamra, Downtown, Dbayeh, etc.).

### Page sections

#### 1. Breadcrumb + heading

`Home › Locations › Hamra`. Heading `headline-lg`: "Wheels Hamra".

#### 2. Two-column hero

```
┌─────────────────────────────────┬──────────────────────────────┐
│  ┌───────────────────────────┐  │   ADDRESS                    │
│  │                           │  │   123 Hamra Street, Beirut   │
│  │   [Branch photo]          │  │   ──────────────────────     │
│  │                           │  │   HOURS                      │
│  └───────────────────────────┘  │   Mon–Sat  8:00 – 20:00      │
│                                 │   Sun      9:00 – 18:00      │
│  ABOUT THIS BRANCH              │   ──────────────────────     │
│  Wheels Hamra is our flagship   │   ☎ +961 1 ...               │
│  city branch, conveniently      │   🟢 WhatsApp                │
│  located in the heart of...     │                              │
│                                 │   [   Browse cars   ]        │
└─────────────────────────────────┴──────────────────────────────┘
```

- **Left:** branch photo, then about-this-branch copy.
- **Right (sticky):** address card, hours, contact details, `Browse cars` `button-cta` red (pre-anchors search to this branch).

#### 3. Map embed

Full-width map centered on the branch. Includes "Get directions" link that opens Apple/Google Maps app on click.

#### 4. Parking & access

Bullets explaining where to park, accessibility, signage to look for.

#### 5. Typically available at this branch

- Horizontal carousel of vehicle cards (compact variant).
- Heading: "Cars usually at this branch".
- 6–10 cards.

#### 6. Branch FAQ (optional)

If the branch has unique policies (e.g., 24h vs limited hours), surface them.

#### 7. Other locations strip

Small horizontal scroller showing the other branches as compact cards.

#### 8. Footer

Global footer.

---

## Module-specific components

### `<LocationsMap />`

Interactive map (Mapbox preferred) with custom Wheels-branded pins. Pins are clickable → scroll the branch list to the corresponding card and highlight it.

### `<BranchHeroCard />`

The right-rail sticky card on branch pages with address, hours, contact, and CTA.

### `<HowItWorksRow />`

The 4-step numbered explainer used on the BEY page. Reused on the chauffeur and address-delivery flows where applicable.

---

## States & edge cases

| Scenario                                           | Behavior                                                                |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| Branch slug doesn't exist                          | 404 page with link to `/locations`.                                     |
| Branch is temporarily closed (e.g., renovation)    | Banner above hero: "This branch is closed until [date]. Nearest branch: [link]." Search CTA disabled or routes to nearest open branch. |
| Map fails to load                                  | Show static fallback image of Lebanon with branch list intact.          |
| Branch hours are different on a holiday            | Show a small chip "Special hours today" linking to the hours block.     |

---

## Data requirements

- **Locations list:** `GET /api/locations` → array of branches with name, slug, address, hours, lat/lng, contact.
- **Branch detail:** `GET /api/locations/[slug]` → full branch object.
- **Vehicles typically at branch:** `GET /api/locations/[slug]/vehicles` → 6–10 vehicle summaries.

---

## SEO & metadata

- **Hub title:** "Our Locations in Lebanon · Wheels Rent A Car"
- **BEY title:** "Beirut Airport (BEY) Car Rental · Free Pickup · Wheels"
- **Branch title:** "Wheels [Branch Name] — Car Rental in [Area], Lebanon"
- **JSON-LD:**
  - Hub: `BreadcrumbList` + `ItemList` of `LocalBusiness`.
  - Branch: `LocalBusiness` (sub-type `AutoRental`) with `address`, `geo`, `openingHoursSpecification`, `telephone`.

---

## Acceptance criteria

- [ ] `/locations` map renders with all branch pins; pin click highlights matching list card.
- [ ] `/locations/beirut-airport` includes the 4-step "how it works" row, meeting-point photo, flight-tracking note.
- [ ] Each `/locations/[branch]` page has a sticky right card with address, hours, contact, and a `Browse cars` CTA.
- [ ] All pages return valid `LocalBusiness` JSON-LD.
- [ ] Branch CTAs pre-anchor the search bar to that branch.
- [ ] "Get directions" links open the native maps app on mobile.
- [ ] All maps are keyboard-navigable and have a text fallback (address + directions link).
