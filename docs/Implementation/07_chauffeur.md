# 07 — Chauffeur (With Driver)

> Route: `/chauffeur`
> Depends on: `00_global.md`
> Related: PRD §6.7
> Primary persona: Tourist (airport transfers, day trips), Business (executive travel), Local (weddings, events)

---

## Purpose & success criteria

`/chauffeur` markets the with-driver service as a distinct, premium product. It's not a booking flow — it's a lead-capture page that routes serious enquiries to the operations team.

**Success looks like:**
- ≥ 4% of `/chauffeur` sessions submit the request form.
- Lead → booked-service conversion ≥ 35% (sales follow-up).

---

## Page sections (top to bottom)

### 1. Hero

- Background photograph: a sedan with a driver in uniform opening the rear door for a passenger, shot in golden-hour light at a Beirut location.
- Headline (`display-lg`): "Chauffeur service across Lebanon."
- Subhead (`body-lg`): "Airport transfers, day trips, weddings, business travel. Professional drivers, premium vehicles."
- Two buttons:
  - `button-cta` red: "Request chauffeur" → smooth scroll to form.
  - `button-secondary` outline: "See pricing" → scroll to §3.

### 2. Service categories (3-up cards)

```
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ ✈ AIRPORT        │  │ 🌍 DAY TRIP      │  │ 💼 BY THE HOUR   │
│   TRANSFER       │  │                  │  │                  │
│                  │  │  Cedars, Baalbek,│  │  Executive,      │
│  BEY ↔ Beirut    │  │  Tyre and beyond │  │  events,         │
│  from $XX        │  │  from $XXX       │  │  weddings        │
│                  │  │                  │  │  from $XX/hr     │
│ [ Request ]      │  │ [ Request ]      │  │ [ Request ]      │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

- Cards use `card-elevated`. Each:
  - Icon (40px, `colors.primary-40`).
  - Service name (`headline-md`).
  - Short description.
  - Starting price.
  - `Request` `button-primary` blue.
- Tap → scrolls to form, pre-fills service type.

### 3. Vehicle classes

Section heading `headline-lg`: "Choose your vehicle class".

3-up vehicle class cards: **Sedan · Premium SUV · Van (7+ seats)**.

Each card: large photo, class name, sample model ("e.g. Mercedes E-Class"), seat capacity, hourly + daily rate, "Includes: chauffeur, fuel, insurance, parking" inline copy.

### 4. Sample itineraries

Editorial moment to inspire tourists. 3 cards with destination + suggested duration + sample price.

- **Cedars day trip** — 8 hours, Beirut–Cedars–Bcharre–Beirut. From $XXX.
- **Baalbek & Anjar** — 9 hours, Beirut–Baalbek–Anjar–Beirut. From $XXX.
- **Tyre & Sidon** — 8 hours, Beirut–Sidon–Tyre–Beirut. From $XXX.

Each card → opens a modal with full itinerary detail, what's included, what's not.

### 5. Drivers

Section heading: "Our drivers".

Short copy + 3 trust indicators:
- "Multi-lingual" — most drivers speak English, French, and Arabic; Italian, German, and Spanish on request.
- "Professional" — full-time, vetted, uniformed.
- "Local experts" — they know Lebanon's roads, traffic, and best stops.

### 6. FAQ

Accordion of 5–6 questions:
- How far in advance do I need to book?
- Can the driver wait for me?
- Is fuel included?
- Can the driver speak my language?
- Can I add stops to my itinerary?

### 7. Request form

Single-column, max-width 720px.

```
REQUEST A CHAUFFEUR
Tell us what you need. We'll come back within 24 hours with options.

Full name *
Email *
Mobile * (+961 ▾)

Service type *
[ Airport transfer ▾ ]   (Airport transfer / Day trip / By the hour / Other)

Date *                    Time *
[ DD/MM/YYYY ]            [ 10:00 ▾ ]

Pickup location *
[ Address autocomplete or "Beirut Airport" ]

Drop-off / destination
[ Address autocomplete or destination name ]

Number of passengers *
[ 1 ▾ ]

Hours needed (for hourly bookings)
[ 4 ▾ ]

Preferred language for driver
[ English ▾ ] (English, French, Arabic, Italian, German, Spanish, Other)

Additional notes (luggage, child seats, special requests)
[ textarea ]

[   Send request   →   ]
```

Submit → success state in-place: "Thanks — we'll be in touch within 24 hours. ✓" plus offer to chat on WhatsApp for urgent requests.

### 8. CTA strip

- Background `colors.primary-10`, white text.
- Headline `headline-md`: "Need a chauffeur urgently?"
- Body: "Call or WhatsApp us directly — same-day requests welcome."
- Two CTAs: phone click-to-call + WhatsApp.

### 9. Footer

Global footer.

---

## Module-specific components

### `<ServiceCategoryCard />`

3-up card pattern reused only on this page (3 service types).

### `<ItineraryCard />`

Destination card with click-to-modal full itinerary.

### `<EnquiryFormChauffeur />`

Long-form chauffeur request form. Validates inline.

---

## States & edge cases

| Scenario                                    | Behavior                                                                            |
| ------------------------------------------- | ----------------------------------------------------------------------------------- |
| Same-day request                            | Form accepts but inline notice: "Same-day requests — we'll respond within 1 hour or call you. For fastest response, WhatsApp us." |
| User submits without specifying time        | Inline validation error.                                                            |
| User in another country (international IP)  | Phone prefix defaults to detected country; show note: "Service is Lebanon only."    |

---

## Data requirements

- **Submit chauffeur lead:** `POST /api/leads/chauffeur` body `{ name, email, mobile, serviceType, date, time, pickup, dropoff?, passengers, hours?, language, notes? }`.
- **Itinerary content:** CMS-driven; loaded at build time.

---

## SEO & metadata

- **Title:** "Chauffeur Service in Lebanon · Airport Transfers & Day Trips · Wheels"
- **Description:** "Professional chauffeur service across Lebanon. Beirut Airport transfers, day trips to Cedars and Baalbek, hourly executive service."
- **JSON-LD:** `Service` with `offers`.

---

## Acceptance criteria

- [ ] Hero loads with under 2s LCP.
- [ ] Three service category cards display with correct icons, copy, and starting prices.
- [ ] Itinerary cards open modals with full content.
- [ ] Form validates inline and shows success state on submit.
- [ ] Same-day requests show the urgency notice.
- [ ] Lead submission triggers WhatsApp + email to ops.
