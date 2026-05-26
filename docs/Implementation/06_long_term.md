# 06 — Long-term Rental

> Route: `/long-term`
> Depends on: `00_global.md`
> Related: PRD §6.6
> Primary persona: Local renters, expats, business travelers

---

## Purpose & success criteria

`/long-term` markets monthly and multi-month rentals — a high-margin segment for Wheels and an unmet need for Lebanese expats and businesses. The page collects qualified leads via a focused enquiry form and educates on tier pricing.

**Success looks like:**
- ≥ 3% of `/long-term` sessions submit the enquiry form.
- Lead → booked-rental conversion ≥ 25% (sales follow-up).

---

## Page sections (top to bottom)

### 1. Hero

- Background photograph of a sedan parked outside a residential or office setting (long-term context, not a holiday road).
- Headline (`display-lg`): "Drive longer. Save more."
- Subhead (`body-lg`): "Monthly and multi-month rentals from $XX/day. Perfect for expats, families, and businesses."
- Two buttons:
  - `button-cta` red: "Get a quote" → smooth scroll to enquiry form.
  - `button-secondary` outline: "How it works" → scroll to §3.

### 2. Tier pricing comparison

4-up card comparison: 1 month · 3 months · 6 months · 12 months.

```
┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────┐
│ 1 MONTH  │ │ 3 MONTHS │ │ 6 MONTHS   │ │ 12 MONTHS│
│ $XX/day  │ │ $XX/day  │ │ $XX/day    │ │ $XX/day  │
│  Save 0% │ │ Save 12% │ │ [POPULAR]  │ │ Save 30% │
│          │ │          │ │ Save 22%   │ │          │
│ ✓ ...    │ │ ✓ ...    │ │ ✓ ...      │ │ ✓ ...    │
│          │ │          │ │            │ │          │
│ [Quote]  │ │ [Quote]  │ │  [Quote]   │ │ [Quote]  │
└──────────┘ └──────────┘ └────────────┘ └──────────┘
```

- Cards use the `card-elevated` token; the `Popular` (6 months) tier carries the `badge-popular` ribbon and a `colors.primary-40` 2px border.
- Each tier:
  - Tier label (`headline-md`).
  - Daily rate (`price-lg`) with savings %.
  - 4–6 included items (km/month, free swaps, free maintenance window, etc.).
  - `Get a quote` `button-primary` blue.
- Tapping any "Get a quote" pre-fills the duration in the enquiry form.

### 3. How it works

3-step horizontal row.

1. **Tell us what you need.** Fill the enquiry form. Takes 30 seconds.
2. **We send you a tailored quote.** Within 24 hours. Choice of vehicles, included km, terms.
3. **We deliver the car to you.** Free delivery anywhere in Greater Beirut.

### 4. Included with every long-term rental

A 2-column checklist (4 columns desktop, 2 mobile).

- ✓ Comprehensive insurance
- ✓ Free maintenance and servicing
- ✓ Replacement vehicle if yours needs work
- ✓ Roadside assistance 24/7
- ✓ Free swap to a different car class once per quarter
- ✓ Monthly billing — no upfront full payment
- ✓ Free delivery within Greater Beirut
- ✓ WhatsApp account manager

### 5. Suggested vehicles

- Section heading: "Cars our long-term clients love".
- Carousel of 6–8 vehicle cards (compact variant).
- Each card includes the regular daily rate and the long-term rate side-by-side.

### 6. FAQ

Accordion of 6–8 questions specific to long-term rentals:
- What's the minimum commitment?
- Can I cancel early?
- What happens to maintenance?
- Can I swap to a different car?
- Is the deposit different for long-term?
- How is monthly billing handled?

### 7. Enquiry form

The conversion centerpiece. Single-column, centered, max-width 720px.

```
GET A QUOTE
We'll come back to you within 24 hours.

Full name *
Email *
Mobile * (+961 ▾)
Company (optional)

What duration are you considering? *
[ 1 month ▾ ]   (3, 6, 12 months — pre-selected if user clicked tier)

Preferred vehicle class *
[ Sedan ▾ ]   (Economy, Sedan, SUV, 7-Seater, Luxury — multi-select)

Start date *
[ DD/MM/YYYY ]

Delivery address (optional)
[ Address autocomplete ]

Anything we should know? (optional)
[ textarea ]

☐ I want occasional updates from Wheels.

[   Send my enquiry   →   ]
```

- Form follows global form rules (`00_global.md` §9).
- On submit:
  - Inline success state replaces the form: "Thanks — we'll be in touch within 24 hours. ✓"
  - Email + WhatsApp notification to ops.
  - Optional: redirect to a thank-you page or stay inline.

### 8. Trust strip

- Logos of 4–6 corporate clients who use long-term Wheels (with permission).
- Background `colors.surface-subtle`, 32px vertical padding.

### 9. CTA strip

- Background `colors.primary-10`, white text.
- Headline `headline-md`: "Need it sooner?"
- Body: "Day rentals are also available."
- Two buttons: `Browse fleet` (secondary, white outline), `Chat on WhatsApp` (tertiary).

### 10. Footer

Global footer.

---

## Module-specific components

### `<TierCardLongTerm />`

Variant of the protection-tier card pattern but with monthly tier styling. 4 columns desktop, stacked mobile.

### `<EnquiryFormLongTerm />`

Long-form enquiry form. Validates inline. Submit posts to `POST /api/leads/long-term`.

---

## States & edge cases

| Scenario                                  | Behavior                                                                                       |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Form submission fails                     | Inline error banner above the form, fields preserved. Suggest WhatsApp as fallback.            |
| User clicks tier "Get a quote" CTA        | Smooth scroll to form, form pre-fills the `Duration` field.                                    |
| User already submitted today              | Form shows: "We've got your enquiry — we'll be in touch within 24 hours. Need to add something? Chat on WhatsApp." |

---

## Data requirements

- **Long-term tier pricing:** `GET /api/long-term-tiers` → array of tier objects with rate and inclusions (CMS-driven).
- **Suggested long-term vehicles:** `GET /api/vehicles/long-term-popular` → 6–8 vehicles.
- **Submit lead:** `POST /api/leads/long-term` body `{ name, email, mobile, company?, duration, vehicleClasses[], startDate, deliveryAddress?, notes?, marketing }`.

---

## SEO & metadata

- **Title:** "Long-term Car Rental in Lebanon · Monthly Plans · Wheels"
- **Description:** "Rent a car in Lebanon for 1 month or longer. Insurance, maintenance, and replacement included. Quotes within 24 hours."
- **JSON-LD:** `Service` with `offers` array.

---

## Acceptance criteria

- [ ] All 4 tier cards render with correct rate, savings %, and the Popular badge on the 6-month tier.
- [ ] Clicking a tier CTA scrolls to the form and pre-fills the Duration field.
- [ ] Enquiry form validates inline; submit posts and shows success state.
- [ ] Mobile: form fields stack 1-up; tier cards stack vertically with Popular tier first.
- [ ] Lead submission triggers internal notifications (WhatsApp + email to ops).
