# 09 — About

> Route: `/about`
> Depends on: `00_global.md`
> Related: PRD §6.9
> Primary persona: All — trust-building page

---

## Purpose & success criteria

`/about` builds brand trust through story, team, and place. It's not a conversion page — it's a credibility page. People reach it when they're deciding whether they trust Wheels enough to book.

**Success looks like:**
- ≥ 30% of visitors who reach `/about` go on to view a vehicle or start a search within the same session.
- Time on page > 60s (a sign the story is being read).

---

## Page sections (top to bottom)

### 1. Hero

- Background photograph: a wide shot of the Wheels team standing in front of a row of vehicles at a branch, or a single confident photo of the founder.
- Headline (`display-lg`): "Built in Beirut. Driven across Lebanon."
- Subhead (`body-lg`): "Premium car rental, run by Lebanese, designed for the way people actually travel here."

### 2. Founding story

Editorial section, max-width 720px, centered.

- Heading `headline-lg`: "Our story".
- 3–5 paragraphs in `body-lg` (use the long-read line length).
- Optional pull-quote in `headline-md`, italic, with a left border in `colors.secondary-50`.
- One inline photograph mid-story (full-width, `rounded-lg`).

### 3. By the numbers

A clean stat strip — 4 large numbers, equal-width on desktop, 2×2 mobile.

```
   1,200+              50+               4.8★              24/7
   rentals last year   vehicles in fleet  Google reviews    WhatsApp support
```

- Each stat: number in `display-xl`, label below in `label-md`, color `colors.neutral-50`.
- Background `colors.primary-95`.
- 64px vertical padding.

### 4. Fleet philosophy

Three-paragraph editorial section with one large image.

- Heading: "Why our fleet is different."
- Body: a confident statement about how Wheels chooses, maintains, and refreshes its fleet (e.g., max 3-year vehicle age, regular safety inspections, premium-only categories where it matters).
- Image: a detail shot — a clean dashboard, a key handoff, a wash bay.

### 5. Team

3–8 cards in a grid (3 columns desktop, 1 mobile).

Each card:
- Square portrait photo (`rounded-lg`).
- Name (`title-lg`).
- Role (`label-md`, neutral-50).
- Optional one-line quote (italic).

### 6. Locations recap

Small horizontal scroller of branch cards (linking to `/locations/[branch]`). Same compact card pattern as on the locations hub.

### 7. Press / mentions (optional)

If available, a strip of press logos with optional links to articles.

### 8. CTA strip

- Background `colors.primary-10`, white text.
- Headline `headline-md`: "Want to drive with us?"
- Body: "Book your car in under 90 seconds."
- `button-cta` red: "Browse cars".

### 9. Footer

Global footer.

---

## Module-specific components

### `<StatStrip />`

4-stat horizontal block with large numbers. May be reused on `/corporate` as a credibility moment.

### `<TeamCard />`

Portrait + name + role + optional quote.

---

## States & edge cases

| Scenario                                     | Behavior                                                    |
| -------------------------------------------- | ----------------------------------------------------------- |
| Press logos missing                          | Hide section silently.                                      |
| Team members fewer than 3                    | Single column on desktop instead of 3-up.                   |

---

## Data requirements

- **About content:** all CMS-driven (story copy, team, stats, fleet philosophy, press).
- **Branches recap:** `GET /api/locations`.

---

## SEO & metadata

- **Title:** "About Wheels Rent A Car · Premium Car Rental in Lebanon"
- **Description:** "Wheels is a premium car rental brand built in Beirut. Meet the team and learn how we run our fleet across Lebanon."
- **JSON-LD:** `Organization` with founder, addresses, social profiles.

---

## Acceptance criteria

- [ ] Hero image LCP < 2.5s.
- [ ] Story section has a max line-length around 720px for readability.
- [ ] Team grid stacks correctly at all breakpoints.
- [ ] Stat strip numbers are tabular (no jitter on hover).
- [ ] Page passes axe-core AA.
