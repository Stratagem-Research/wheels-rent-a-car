# 11 — Contact

> Route: `/contact`
> Depends on: `00_global.md`
> Related: PRD §6.11
> Primary persona: All

---

## Purpose & success criteria

`/contact` is a clear, no-friction way to reach Wheels through whichever channel suits the visitor. WhatsApp is the priority; the form is the fallback.

**Success looks like:**
- WhatsApp click is the most-used contact channel from this page.
- Form submissions get acknowledged within 5 minutes during business hours.

---

## Page sections (top to bottom)

### 1. Page header

- Background `colors.primary-95`. Heading `headline-lg`: "Get in touch."
- Subhead: "We're available 24/7 on WhatsApp. Or pick the channel you prefer."

### 2. Channel cards (3 across)

```
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ 🟢 WhatsApp     │ │ ☎ Phone          │ │ ✉ Email          │
│                  │ │                  │ │                  │
│ Fastest reply    │ │ Talk to us       │ │ For long enquiry │
│ +961 3 ...       │ │ +961 1 ...       │ │ hello@wheels.com │
│ 24/7             │ │ Mon–Sat 8–20     │ │ Reply within 4h  │
│                  │ │                  │ │                  │
│ [ Chat now ]     │ │ [ Call ]         │ │ [ Email ]        │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

- Cards: `card-elevated`, 24px padding.
- WhatsApp card: green border (3px `colors.whatsapp`) to distinguish.
- Buttons: WhatsApp = green, others = `button-primary` blue.

### 3. Contact form (for long enquiries)

Single-column, max-width 720px.

```
SEND US A MESSAGE
We respond within 4 business hours.

Full name *
Email *
Mobile (optional, for faster reply)

Subject *
[ General enquiry ▾ ] (General · Booking question · Damage report · Corporate · Other)

Booking reference (optional)
[ WRC-XXXXXX-XXXX ]

Your message *
[ textarea ]

[   Send message   →   ]
```

Submit → inline success: "Thanks — we'll reply within 4 hours. ✓"

### 4. Branches map + list

Reuse the `<LocationsMap />` component from `05_locations.md` to show all branches with their phones.

### 5. Office hours

A small block listing branch hours by day.

### 6. Social

Row of social icons (Instagram, Facebook, TikTok, LinkedIn) with hover lifting to brand colors.

### 7. Footer

Global footer.

---

## Module-specific components

### `<ChannelCard />`

3-up card with channel name, contact info, hours, and CTA.

### `<ContactForm />`

Generic short-form contact form.

---

## States & edge cases

| Scenario                                  | Behavior                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------- |
| Outside business hours                    | Phone card shows: "Closed — back at 8:00 tomorrow." WhatsApp card unchanged. |
| User submits with no subject              | Inline error.                                                             |
| User submits with booking ref             | Internal routing tags the message to the right team.                      |

---

## Data requirements

- **Submit contact:** `POST /api/contact` body `{ name, email, mobile?, subject, bookingRef?, message }`.
- **Branch hours:** `GET /api/locations` (reuse).

---

## SEO & metadata

- **Title:** "Contact Wheels Rent A Car · WhatsApp · Phone · Email"
- **JSON-LD:** `Organization` with `contactPoint` array.

---

## Acceptance criteria

- [ ] All 3 channel cards have working actions (WhatsApp opens chat, phone click-to-call, email mailto).
- [ ] Form validates and submits successfully.
- [ ] Outside business hours, phone card shows the closed state.
- [ ] Map shows all branches with click-to-call functionality.
