# 10 — Help & FAQ

> Routes: `/help`, `/help/faq`, `/help/rental-terms`, `/help/insurance-and-coverage`, `/help/payment-and-deposits`, `/help/cancellation-policy`
> Depends on: `00_global.md`
> Related: PRD §6.10
> Primary persona: All — pre-purchase reassurance and post-booking lookup

---

## Purpose & success criteria

The Help module reduces support load and removes pre-booking friction. Strong, clear, scannable answers convert undecided users.

**Success looks like:**
- Time-on-page < 90s for FAQ pages (people find answers fast).
- ≥ 15% of /help users go on to start a search or PDP within the same session.
- WhatsApp click-throughs from /help pages tracked as a separate event for routing.

---

## /help — hub page

### Page sections

#### 1. Page header

- Background `colors.primary-95`. Heading `headline-lg`: "How can we help?". Subhead: "Browse common questions or chat with our team."

#### 2. Search bar (helpdesk)

- Single search input centered (max-width 720px), `rounded-pill` border, search icon left, `Search` button right.
- Searches across all help articles. Results display below as a card list.

#### 3. Six category cards (3×2 desktop)

Each card → corresponding `/help/[topic]` page.

```
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 📖 Rental terms│ │ 🛡 Insurance   │ │ 💳 Payment     │
│ What you need  │ │ Coverage levels│ │ Cards, cash,   │
│ to know        │ │ explained      │ │ transfers      │
└────────────────┘ └────────────────┘ └────────────────┘
┌────────────────┐ ┌────────────────┐ ┌────────────────┐
│ 🔄 Cancellation│ │ ❓ FAQ         │ │ 💬 WhatsApp us │
│ Free up to 7d  │ │ Most common    │ │ Real humans,   │
│                │ │ questions      │ │ 24/7           │
└────────────────┘ └────────────────┘ └────────────────┘
```

- Cards: `card`, 24px padding, hover lifts elevation.
- Icon (32px, `colors.primary-40`), title (`title-lg`), one-line description.

#### 4. "Still need help" strip

- Background `colors.primary-95`. 32px padding.
- Two side-by-side options: phone (click-to-call) and WhatsApp.

#### 5. Footer

Global footer.

---

## /help/faq — main FAQ page

Single accordion grouped by topic.

### Page sections

#### 1. Page header

Same pattern as the hub. Heading "Frequently asked questions".

#### 2. Topic anchor nav

Horizontal sticky pill nav (sticky below header) with topic anchors:

`Booking · Pickup & return · Payment · Insurance · Driver requirements · Cancellation · Beirut Airport · WhatsApp`

Click → smooth scroll to the topic section.

#### 3. Topic sections

For each topic:
- Section heading (`headline-lg`).
- Accordion of 4–10 questions per topic.
- Each accordion item: question (`title-md`, neutral-10), chevron icon. Open state shows answer in `body-md` with optional links.

#### 4. "Still didn't find your answer" CTA

Bottom-anchored card with a `Chat on WhatsApp` button + phone link.

#### 5. Footer

Global footer.

### Default FAQ content (Phase 1)

**Booking**
- How do I book a car?
- Can I book without an account?
- Can I book for someone else?
- How far in advance can I book?

**Pickup & return**
- Where do I pick up the car?
- What time can I pick up / return?
- What if I'm late?
- Can I return at a different location?

**Payment**
- What payment methods do you accept?
- Can I pay in cash?
- What is the deposit?
- When am I charged?
- Do you accept Lebanese pounds?

**Insurance**
- Is insurance included?
- What does the deductible cover?
- Can I buy additional protection?

**Driver requirements**
- What's the minimum age?
- What documents do I need?
- Is an international licence accepted?
- Can I add an extra driver?

**Cancellation**
- How do I cancel?
- Is cancellation free?
- How long does a refund take?

**Beirut Airport**
- How does airport pickup work?
- Where do I meet the agent?
- What if my flight is delayed?

**WhatsApp**
- How do I get WhatsApp updates?
- Who replies on WhatsApp?
- Is WhatsApp available 24/7?

---

## /help/rental-terms, /help/insurance-and-coverage, /help/payment-and-deposits, /help/cancellation-policy

Long-form prose pages. Same template:

### Page sections

#### 1. Page header (same pattern as hub)

#### 2. Two-column body

```
┌─────────────────┬──────────────────────────────────────────┐
│ ON THIS PAGE    │   1. INTRODUCTION                        │
│ (sticky)        │   ...                                    │
│                 │                                          │
│ 1. Intro        │   2. WHO CAN RENT                        │
│ 2. Who can rent │   ...                                    │
│ 3. Documents    │                                          │
│ 4. Insurance    │   3. DOCUMENTS REQUIRED                  │
│ 5. Mileage      │   ...                                    │
│ 6. Fuel         │                                          │
│ 7. Damages      │                                          │
│ 8. Disputes     │                                          │
└─────────────────┴──────────────────────────────────────────┘
```

- **Left rail (sticky):** table of contents, anchor links to each section.
- **Right column:** prose with `body-lg`, max line-length 720px. Headings `headline-md`, anchored.

#### 3. "Have a question we didn't answer?" CTA

Bottom of the article. WhatsApp + phone.

#### 4. Footer

Global footer.

---

## Module-specific components

### `<HelpSearchBar />`

The /help page's centered search bar. Posts to a help-articles search API and returns a card list.

### `<FaqAccordion />`

Topic-grouped accordion with anchor links per topic. Reused on PDP, home, and locations.

### `<TocSidebar />`

Sticky table-of-contents on long-form articles. Highlights the current section based on scroll position.

---

## States & edge cases

| Scenario                                          | Behavior                                                     |
| ------------------------------------------------- | ------------------------------------------------------------ |
| Help search returns no results                    | Empty state with "No matches" + suggested links + WhatsApp.  |
| User clicks an anchor with smooth scroll          | Account for sticky header height (offset top by header).     |
| FAQ question opened → user shares URL             | URL hash updates so the question is open when shared link is opened. |

---

## Data requirements

- **Help articles search:** `GET /api/help/search?q=` → array of article cards.
- **FAQ content:** CMS-driven (group, question, answer fields).
- **Long-form articles:** CMS-driven Markdown/MDX.

---

## SEO & metadata

- **Hub title:** "Help & Support · Wheels Rent A Car"
- **FAQ title:** "Frequently Asked Questions · Wheels Rent A Car"
- **JSON-LD:** `FAQPage` on FAQ page; `Article` on long-form pages.
- **Anchor URLs:** `?q=question-slug` for shareable specific answers.

---

## Acceptance criteria

- [ ] Help hub renders 6 cards routing to all sub-pages.
- [ ] FAQ page sticky topic nav works (smooth scroll, active highlight).
- [ ] Each long-form page has a sticky ToC sidebar with active-section highlight.
- [ ] FAQ accordion items can be opened via URL hash.
- [ ] Help search returns relevant cards with "No results" empty state.
- [ ] All FAQ entries return valid `FAQPage` JSON-LD.
- [ ] WhatsApp CTAs are present on every help page.
