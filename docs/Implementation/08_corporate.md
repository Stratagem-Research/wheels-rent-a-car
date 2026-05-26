# 08 — Corporate (B2B)

> Route: `/corporate`
> Depends on: `00_global.md`
> Related: PRD §6.8
> Primary persona: Business — companies, SMEs, account managers

---

## Purpose & success criteria

`/corporate` is a B2B landing page that converts companies into account leads. It speaks a different register than the rest of the site — more efficient, less lifestyle, more bullet-pointed. The conversion is a contact form, not a self-serve booking.

**Success looks like:**
- ≥ 2% form-submission rate from `/corporate`.
- Inbound lead → signed-account conversion ≥ 30%.

---

## Page sections (top to bottom)

### 1. Hero

- Background photograph: a clean office building entrance with a Wheels-branded car parked outside, or a corporate event setup.
- Headline (`display-lg`): "Move your team. Reliably."
- Subhead (`body-lg`): "Corporate accounts with volume pricing, single invoice, and a dedicated account manager."
- CTA: `button-cta` red "Request a corporate account" → smooth scroll to form.
- Secondary `button-secondary`: "See benefits".

### 2. Value props (4-up)

```
🏢 Volume pricing       💼 Single invoice
🤝 Account manager      🚗 Priority fleet
```

Each tile: icon, headline, 2-line body. Background `colors.surface-subtle`, `rounded-lg`, 24px padding.

Content:
- **Volume pricing.** Discounts based on monthly usage. Transparent tiers, no hidden mark-ups.
- **Single monthly invoice.** All your team's bookings in one statement, ready for accounting.
- **Dedicated account manager.** One person who knows your account, accessible by phone, email, and WhatsApp.
- **Priority fleet access.** Guaranteed availability on the categories you book most.

### 3. How it works

3-step horizontal row.

1. **Send us your needs.** Number of expected rentals per month, vehicle classes, billing preferences.
2. **We design your account.** Custom pricing, invoicing setup, account manager assignment.
3. **You start booking.** Through your account manager or directly online with a corporate code.

### 4. Industries we serve

A horizontal row of small chips/tags showing example industries:

`Banking · Healthcare · Hospitality · Embassies · NGOs · Construction · Media · Tech · Universities`

### 5. Trust strip

Logos of current corporate clients (with permission). 6–8 logos, greyscale. Background `colors.surface`.

### 6. Testimonial

Single large quote pulled from a current corporate client (with photo and name + company).

```
"Wheels has been our default car rental partner for 3 years. The
billing alone has saved our finance team hours every month."
                                            — Name, CFO, Company
```

### 7. Features comparison

A 2-column compare table showing standard rentals vs corporate accounts.

| Feature                       | Standard | Corporate         |
| ----------------------------- | -------- | ----------------- |
| Online booking                | ✓        | ✓                 |
| WhatsApp support              | ✓        | ✓ + dedicated AM  |
| Invoice                       | Per rental | Single monthly  |
| Volume pricing                | —        | ✓                 |
| Net 30 payment terms          | —        | ✓                 |
| Priority fleet access         | —        | ✓                 |
| Custom branded invoices       | —        | ✓ (optional)      |
| Driver management portal      | —        | Phase 2           |

### 8. Enquiry form

```
REQUEST A CORPORATE ACCOUNT

Company name *
Industry *
[ Select industry ▾ ]

Contact name *
Job title *
Company email *
Mobile * (+961 ▾)

Estimated monthly rentals *
[ 1–10 ▾ ]   (1–10, 11–25, 26–50, 50+)

Preferred vehicle classes *
[ Select all that apply ▾ ]

When would you like to start? *
[ DD/MM/YYYY or "ASAP" ]

Anything else we should know?
[ textarea ]

[   Submit enquiry   →   ]
```

Submit → success state in place. Internal notification to corporate sales team.

### 9. CTA strip

- Background `colors.primary-10`, white text.
- Headline `headline-md`: "Already have an account?"
- Body: "Sign in or message your account manager directly."
- Buttons: `Sign in` (white outline), `WhatsApp my AM` (links to a stored AM contact when signed in).

### 10. Footer

Global footer.

---

## Module-specific components

### `<ValuePropTile />`

4-up tile pattern with icon + headline + body. Reused conceptually on home and long-term, but with corporate-specific styling.

### `<ComparisonTable />`

2-column standard vs corporate features comparison.

### `<EnquiryFormCorporate />`

B2B-specific lead form with industry, monthly volume, vehicle classes.

---

## States & edge cases

| Scenario                                    | Behavior                                                                  |
| ------------------------------------------- | ------------------------------------------------------------------------- |
| Existing corporate user lands here          | If signed in with corporate role: show a dashboard CTA at top instead.    |
| Enquiry form fails                          | Inline error, fields preserved, suggest emailing corporate@wheels.com.lb. |

---

## Data requirements

- **Submit corporate lead:** `POST /api/leads/corporate` body `{ companyName, industry, contactName, jobTitle, email, mobile, monthlyRentals, vehicleClasses[], startDate, notes? }`.
- **Industry options:** static list (CMS-driven if it grows).
- **Client logos:** CMS-managed asset set.

---

## SEO & metadata

- **Title:** "Corporate Car Rental in Lebanon · Volume Pricing · Wheels"
- **Description:** "Corporate accounts for car rental in Lebanon. Volume pricing, single monthly invoice, dedicated account manager. For SMEs to enterprises."
- **JSON-LD:** `Organization` + `Service`.

---

## Acceptance criteria

- [ ] All 4 value-prop tiles render with correct icons and copy.
- [ ] Comparison table is keyboard-navigable and readable on mobile (stacked or horizontally scrollable).
- [ ] Enquiry form validates and submits successfully.
- [ ] Industry chips read as a continuous list, wrapping cleanly on mobile.
- [ ] Logos display in greyscale with subtle hover lifting to color.
