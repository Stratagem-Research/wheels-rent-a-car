# Owner Kickoff Questions — Revision 1

Purpose: align on the most important product, design, and integration decisions before implementation continues.

## 10 critical questions for the first call

1. **Design sign-off scope:** Which screens are fully approved as-is, and which screens are still open for visual changes?
2. **Brand usage rules:** Are the current INK & SIGNAL rules final (single red CTA, black/white dominance, limited blue), or do you expect any exceptions?
3. **Content ownership:** Who provides and approves final copy, legal text, FAQs, and About-page narrative, and by what date?
4. **Homepage conversion priority:** What is the single highest-priority conversion on the home page (show cars, WhatsApp lead, long-term inquiry, or another)?
5. **Booking policy confirmation:** Please confirm final cancellation, no-show, refund, and deposit/pre-authorization policies for each payment path.
6. **Operational SLA:** For pending payments (bank transfer / OMT / cash workflows), what is the promised verification timeframe and escalation process?
7. **Backend API readiness:** What date can we receive staging APIs, and which endpoints will be available first (availability, quote, submit, auth, manage-booking)?
8. **API contract authority:** Will Wheels backend adopt the frontend contract as defined in `types/domain.ts` and `lib/api/endpoints.ts`, or should we plan a contract-mapping phase?
9. **Payment integration timeline:** When will Areeba credentials (and Stripe fallback decision) be available for real checkout integration and testing?
10. **Launch criteria:** What exact conditions define launch readiness (must-have features, required test environments, acceptance owner, and final sign-off process)?

## Optional follow-ups (if time allows)

- Should Chauffeur and Corporate remain fully descoped for this phase, with no soft-launch placeholders?
- Do you want analytics events reviewed together before go-live (GA4 + Meta naming and conversion definitions)?
- Who is the final decision-maker for fast approvals when design and operations priorities conflict?

---

# Client Questions - Wheels Rent A Car

**Date:** 2026-05-16  
**Purpose:** Open product / scope questions to send to Wheels before the next iteration.  
**Owner:** Stratagem Research- Marc Khamis

Each section below has a single question. Some have a one-line note on how the answer changes scope or shapes the build.

---

## 1. Blog / Trips section

**Question:**  
Do you want to include a blog section for trips that advises people on where to go in Lebanon (trips they can take with the car they are renting)?

Of course this would mean adding a section to your back office where you (or whoever manages content) can write/edit/publish these blog posts, upload cover images, manage tags, etc.

**What it changes if YES:**

- New top-level `/trips` (or `/blog`) page with a list/grid of trip cards.
- New `/trips/[slug]` page template per article (hero image, body, suggested vehicle, related itineraries).
- New CMS surface in the back office: post editor (title, slug, cover, body in rich text or Markdown, tags, vehicle suggestion).
- SEO impact is significant - trip articles are great organic-traffic targets ("car rental Lebanon Cedars", "Baalbek day trip from Beirut", etc.).

**Status if no answer:** parking lot - not in Phase 1 scope.

---

## 2. Corporate packages

**Question:**  
Do you have corporate packages and business special prices that we need to advertise on the website?

**What it changes if YES:**

- `/corporate` route currently returns 404 (descoped in Phase 1). We bring it back: hero + corporate value props + how-it-works + a contact-sales form posting to a new `/api/leads/corporate` lead.
- Pricing model can stay opaque (display "Get a quote" CTA instead of public rates) or transparent (publish a tier comparison). Your call.

**Status if no answer:** route stays 404, module spec kept for Phase 2 revival.

---

## 3. Airport pickup as a chauffeur option

**Question:**  
Do you have a chauffeur service that can pick people up from the airport (Beirut-Rafic Hariri International, BEY)?

I am asking because we already have:

- An **airport pickup** option as a self-drive branch (Beirut Airport meet-and-greet - customer collects keys at arrivals and drives themselves).
- A separate `/chauffeur` service page with three formats (airport transfer / day trip / hourly hire).

I want to confirm the **airport transfer under chauffeur** is also active and we should offer it as a bookable / quotable option - not just a marketing claim.

**What it changes if YES:**

- `/chauffeur`'s "Airport transfer" service category becomes a real bookable flow (or quotable, see Q5 below for the long-term parallel).
- Flight-number capture on the chauffeur enquiry form.
- Ops alignment: same Hazmieh team or dedicated chauffeur dispatch?

---

## 4. Pickup / drop-off locations

**Question:**  
Where are your drop-off and pickup location options? Is it only at your Hazmieh branch, or do you have a pickup at the airport option, or any other branches/locations?

What we have right now in the site:

- **Wheels Hazmieh** - physical branch (free pickup at the hub).
- **Beirut Airport (BEY)** - meet-and-greet at arrivals, dispatched on demand from Hazmieh.
- **Address Delivery** - anywhere in Greater Beirut (hotel / home / office), zone-based fee.

**Please confirm or correct:**

1. Is the airport meet-and-greet actually available 24/7, or is it limited to certain hours?
2. Do you have any other physical branches (Jounieh? Tripoli? Tyre?) we should add?
3. What is the address-delivery fee model - flat fee, zone-based, free over a certain rental length? We currently have it as zone-based but the actual zones / amounts need real numbers.

---

## 5. Long-term rentals - bookable or quotable?

**Question:**  
Do you offer long-term rentals, and if so do they have a separate flow for booking? Should the site make them **quotable** through a form (we follow up with a quote) but **not fully bookable** online?

What we have right now:

- `/long-term` page with tier comparison (1 / 3 / 6 / 12 months), inclusions checklist, FAQ.
- Form at the bottom: customer fills out their needs, we follow up within 24h with a tailored quote.
- No "buy now" path - it is quote-only.

**Please confirm:**

1. Should it stay quote-only (current Phase 1 behavior)? Or do you want to expose direct booking for some tiers (e.g., 1-month is bookable, longer tiers require a quote)?
2. What is a realistic SLA on the follow-up - 24h business days? Same-day?
3. Are the tier prices on the site (`$15-$22 a day` range) directionally correct, or are they placeholders we should update?

---

## Cross-cutting questions

A few smaller items worth confirming in the same email:

- **Currency**: site is USD-only right now. LBP shown only on confirmation as a small secondary line at the latest rate. Confirm OK?
- **Payment methods**: card (Areeba), cash, bank transfer, OMT/Whish. Anything missing - Western Union? Crypto? Bob Finance?
- **Min driver age**: site shows 21. Confirm? Any category-specific bumps (e.g., 25 for luxury / 4x4)?
- **Insurance tiers**: we have Basic / Smart (popular) / Premium. The deductibles + coverage lines need real numbers from your insurer.
- **Phone hours**: +961 1 629 100 shows in the footer. What are the actual hours? Is it 24/7 for emergencies or 09:00-20:00 weekdays?

---

## How to reply

Easiest: reply inline (copy/paste each question + your answer) by email to `toni@saikodigital.co`, or jump on a 30-min call.

For anything that requires more thought, mark **TBD** and we will keep the current behavior as the placeholder.