---
version: alpha
name: WHEELS / INK & SIGNAL
description: >
  Bold, sleek, daring, modern. A monochrome design system for Wheels Rent A Car
  built on Geist typography at full volume. Black is the spine. White is the
  canvas. Red and blue are signals — used rarely, used loudly. References:
  Rivian (massive type, monumental restraint), Tripadvisor (inverse blocks,
  yellow-on-black moments), Sixt (dark vehicle cards, single-CTA orange),
  Airbnb (clean overlays, generous voids). Premium by what we leave out.
fonts:
  primary:
    family: Geist
    role: All UI text. Used at 100–900 across display, headline, lead, body, and label.
    weights: [400, 500, 700, 800]
    cases:
      - All-caps for display, headline, button, label, and overline tokens
      - Sentence case for lead, body, and helper tokens
  mono:
    family: Geist Mono
    role: Numerics — prices, totals, booking refs, license plates, timers, kilometers.
    weights: [400, 500, 700]
colors:
  # ── INK SCALE — the spine ─────────────────────────────────────────────────
  # Pure black is the brand surface. The grey ramp is for borders, dividers,
  # disabled states, secondary text, and tonal lifts. NEVER tint these.
  ink-100: "#000000"   # true black — inverse hero, primary CTA on light pages
  ink-95:  "#0A0A0A"   # near-black — dark cards, dark sections
  ink-90:  "#141414"   # softened black — large dark surfaces
  ink-80:  "#1F1F1F"   # heading on near-white, dark card secondary
  ink-70:  "#2E2E2E"
  ink-60:  "#525252"   # secondary text on light
  ink-50:  "#737373"   # muted, disabled label
  ink-40:  "#A3A3A3"   # placeholder, hairline icon
  ink-30:  "#D4D4D4"   # divider on dark surface, secondary border on light
  ink-20:  "#E5E5E5"   # default border on light surface
  ink-15:  "#EFEFEF"   # subtle background lift
  ink-10:  "#F5F5F5"   # canvas section tint
  ink-05:  "#FAFAFA"   # near-paper

  paper:   "#FFFFFF"   # true white — primary canvas

  # ── SIGNAL — RED (Cedar) — the singular CTA, the only loud color ─────────
  # Red appears ONCE per screen on the highest-conversion action. It also
  # carries critical errors and "Best Deal" badges. Never decorative.
  signal-red:        "#C8102E"   # brand secondary — singular CTA
  signal-red-hover:  "#A50C24"
  signal-red-press:  "#7A0819"
  signal-red-bg:     "#FFF0F2"   # used for badge background only
  signal-red-on:     "#FFFFFF"

  # ── SIGNAL — BLUE (Beirut) — info, selected, links — sparingly ───────────
  # Blue means "informational" or "selected". Not decorative. Appears in
  # links inside body copy, the info banner, the selected-row tint.
  signal-blue:        "#0E4F94"   # brand primary — info / link
  signal-blue-hover:  "#0A3E76"
  signal-blue-bg:     "#EAF2FB"
  signal-blue-on:     "#FFFFFF"

  # ── SEMANTIC — used rarely, paired with icon and text ────────────────────
  success:    "#10B981"
  success-bg: "#ECFDF5"
  warning:    "#F59E0B"
  warning-bg: "#FFFBEB"
  error:      "{colors.signal-red}"
  error-bg:   "{colors.signal-red-bg}"

  # ── EXTERNAL BRAND — locked, never restyled ──────────────────────────────
  whatsapp:        "#25D366"
  whatsapp-press:  "#1EB256"

  # ── SEMANTIC ALIASES (use these in components, not the raw scale) ────────
  surface:                "{colors.paper}"
  surface-tint:           "{colors.ink-05}"
  surface-subtle:         "{colors.ink-10}"
  surface-muted:          "{colors.ink-15}"
  surface-inverse:        "{colors.ink-100}"
  surface-inverse-tint:   "{colors.ink-90}"

  on-surface:             "{colors.ink-95}"
  on-surface-muted:       "{colors.ink-60}"
  on-surface-faint:       "{colors.ink-50}"
  on-surface-inverse:     "{colors.paper}"
  on-surface-inverse-muted: "{colors.ink-40}"

  border:                 "{colors.ink-20}"
  border-strong:          "{colors.ink-30}"
  border-inverse:         "{colors.ink-80}"
  divider:                "{colors.ink-15}"

  focus-ring:             "{colors.ink-100}"
  focus-ring-inverse:     "{colors.paper}"

typography:
  # ── DISPLAY — monumental scale, used like a wordmark ─────────────────────
  display-mega:
    fontFamily: Geist
    fontSize: 144px
    fontWeight: 800
    lineHeight: 0.92
    letterSpacing: -0.04em
    textTransform: uppercase
  display-2xl:
    fontFamily: Geist
    fontSize: 112px
    fontWeight: 800
    lineHeight: 0.94
    letterSpacing: -0.035em
    textTransform: uppercase
  display-xl:
    fontFamily: Geist
    fontSize: 88px
    fontWeight: 800
    lineHeight: 0.96
    letterSpacing: -0.03em
    textTransform: uppercase
  display-lg:
    fontFamily: Geist
    fontSize: 72px
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: -0.025em
    textTransform: uppercase
  display-md:
    fontFamily: Geist
    fontSize: 56px
    fontWeight: 800
    lineHeight: 1.0
    letterSpacing: -0.022em
    textTransform: uppercase

  # ── HEADLINES — uppercase, Extra Bold (800), tight ───────────────────────
  headline-xl:
    fontFamily: Geist
    fontSize: 44px
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: -0.02em
    textTransform: uppercase
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.015em
    textTransform: uppercase
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: -0.012em
    textTransform: uppercase
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: -0.005em
    textTransform: uppercase
  headline-xs:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: 0
    textTransform: uppercase

  # ── LEAD — Geist Medium 500, sentence case (sub-heads, intros) ───────────
  lead-xl:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1.35
    letterSpacing: -0.01em
  lead-lg:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: -0.005em
  lead-md:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: 500
    lineHeight: 1.45
  lead-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.45

  # ── BODY — Geist Regular 400, sentence case ──────────────────────────────
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.55
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 400
    lineHeight: 1.55
  body-xs:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.5

  # ── BUTTONS — Geist Bold 700, uppercase, tight ───────────────────────────
  button-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.01em
    textTransform: uppercase
  button-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.02em
    textTransform: uppercase
  button-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 700
    lineHeight: 1
    letterSpacing: 0.04em
    textTransform: uppercase

  # ── LABELS / OVERLINE — Geist Medium 500, uppercase, wide tracking ──────
  label-lg:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.06em
    textTransform: uppercase
  label-md:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.08em
    textTransform: uppercase
  label-sm:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: 0.1em
    textTransform: uppercase
  overline:
    fontFamily: Geist
    fontSize: 11px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.16em
    textTransform: uppercase

  # ── FORM HELPERS ─────────────────────────────────────────────────────────
  field-label:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0.04em
    textTransform: uppercase
  field-helper:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 400
    lineHeight: 1.4
  field-error:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.4

  # ── MONO — Geist Mono for tabular numerics ───────────────────────────────
  mono-md:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0
  mono-lg:
    fontFamily: Geist Mono
    fontSize: 18px
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: -0.01em

  # ── PRICES — display-weighted Geist for headline price moments ───────────
  price-xl:
    fontFamily: Geist
    fontSize: 56px
    fontWeight: 800
    lineHeight: 1
    letterSpacing: -0.025em
    fontFeature: '"tnum" 1'
  price-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: -0.02em
    fontFeature: '"tnum" 1'
  price-md:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: -0.015em
    fontFeature: '"tnum" 1'
  price-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: '"tnum" 1'

spacing:
  base: 16px
  none: 0
  hairline: 1px
  3xs: 2px
  2xs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  4xl: 96px
  5xl: 128px
  6xl: 192px
  7xl: 256px
  gutter-mobile: 16px
  gutter-desktop: 24px
  page-padding-mobile: 20px
  page-padding-desktop: 48px
  section-mobile: 64px
  section-desktop: 128px
  container-narrow: 880px
  container-default: 1280px
  container-wide: 1440px
  container-full: 1600px

rounded:
  none: 0
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 20px
  2xl: 24px
  3xl: 32px
  pill: 9999px
  full: 9999px

components:
  # ════════════════════════════════════════════════════════════════════════
  # BUTTONS — pill shape across the system. One CTA per screen.
  # ════════════════════════════════════════════════════════════════════════

  # PRIMARY = solid black pill. The everyday workhorse on light pages.
  button-primary:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.paper}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 14px 28px
    height: 48px
  button-primary-hover:
    backgroundColor: "{colors.ink-80}"
  button-primary-press:
    backgroundColor: "{colors.ink-70}"
  button-primary-disabled:
    backgroundColor: "{colors.ink-15}"
    textColor: "{colors.ink-50}"

  # PRIMARY-INVERSE = solid white pill on dark surfaces.
  button-primary-inverse:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-100}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 14px 28px
    height: 48px
  button-primary-inverse-hover:
    backgroundColor: "{colors.ink-15}"

  # CTA = the singular RED pill. Used ONCE per screen on the most
  # conversion-critical action: "Show cars", "Select", "Pay & confirm".
  # Larger by default — eye finds it without hunting.
  button-cta:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.paper}"
    typography: "{typography.button-lg}"
    rounded: "{rounded.pill}"
    padding: 18px 36px
    height: 56px
  button-cta-hover:
    backgroundColor: "{colors.signal-red-hover}"
  button-cta-press:
    backgroundColor: "{colors.signal-red-press}"
  button-cta-disabled:
    backgroundColor: "{colors.ink-15}"
    textColor: "{colors.ink-50}"

  # SECONDARY = outline pill (1.5px ink-100 border on light, paper on dark).
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-100}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 13px 27px
    height: 48px
  button-secondary-hover:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.paper}"
  button-secondary-inverse:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
  button-secondary-inverse-hover:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-100}"

  # TERTIARY = text only. Used for in-card actions and inline links.
  button-tertiary:
    backgroundColor: "transparent"
    textColor: "{colors.ink-100}"
    typography: "{typography.button-md}"
    rounded: "{rounded.pill}"
    padding: 10px 16px
    height: 40px
  button-tertiary-hover:
    backgroundColor: "{colors.ink-10}"
  button-tertiary-inverse:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
  button-tertiary-inverse-hover:
    backgroundColor: "{colors.ink-90}"

  # SIZES (overrides for primary/secondary/tertiary)
  button-sm-size:
    padding: 10px 18px
    height: 36px
    typography: "{typography.button-sm}"
  button-lg-size:
    padding: 18px 36px
    height: 56px
    typography: "{typography.button-lg}"
  button-xl-size:
    padding: 22px 44px
    height: 64px
    typography: "{typography.button-lg}"

  # Icon-only button — square hit area, pill rounded.
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink-100}"
    rounded: "{rounded.pill}"
    size: 44px

  # ════════════════════════════════════════════════════════════════════════
  # INPUTS — pill rounded, generous height, hairline border.
  # ════════════════════════════════════════════════════════════════════════
  input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-95}"
    typography: "{typography.body-md}"
    rounded: "{rounded.lg}"
    padding: 16px 18px
    height: 56px
  input-focus:
    backgroundColor: "{colors.paper}"
  input-error:
    backgroundColor: "{colors.paper}"
  input-disabled:
    backgroundColor: "{colors.ink-10}"
    textColor: "{colors.ink-50}"
  input-inverse:
    backgroundColor: "{colors.ink-90}"
    textColor: "{colors.paper}"

  # Search bar input pattern (taller, pill-rounded for hero use).
  search-input:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-95}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.pill}"
    padding: 18px 24px
    height: 64px

  # ════════════════════════════════════════════════════════════════════════
  # CHIPS — pill, two flavors: filter chip and selection chip.
  # ════════════════════════════════════════════════════════════════════════
  chip:
    backgroundColor: "{colors.ink-10}"
    textColor: "{colors.ink-80}"
    typography: "{typography.label-md}"
    rounded: "{rounded.pill}"
    padding: 8px 14px
    height: 36px
  chip-hover:
    backgroundColor: "{colors.ink-15}"
  chip-selected:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.paper}"
  chip-inverse:
    backgroundColor: "{colors.ink-80}"
    textColor: "{colors.paper}"
  chip-inverse-selected:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-100}"

  # ════════════════════════════════════════════════════════════════════════
  # CARDS — no shadow by default. Border or surface tint defines the edge.
  # ════════════════════════════════════════════════════════════════════════
  card:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: 24px

  # Tinted card — sits on white pages without a border.
  card-tint:
    backgroundColor: "{colors.ink-10}"
    rounded: "{rounded.xl}"
    padding: 24px

  # Inverse card — black surface, white type. The marketing block.
  card-inverse:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: 32px

  # Image card — used for vehicle cards and editorial tiles. Rounded
  # corners crop the image; content sits over a tonal scrim or below.
  card-image:
    backgroundColor: "{colors.ink-95}"
    rounded: "{rounded.xl}"
    padding: 0

  # Floating card — the only card that gets a shadow. Sticky summary,
  # search bar, modals.
  card-floating:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.2xl}"
    padding: 24px

  # ════════════════════════════════════════════════════════════════════════
  # VEHICLE CARD — DARK by default (Sixt pattern). Light variant exists
  # for grid contexts where a dark sea would be too heavy.
  # ════════════════════════════════════════════════════════════════════════
  vehicle-card:
    backgroundColor: "{colors.ink-95}"
    textColor: "{colors.paper}"
    rounded: "{rounded.xl}"
    padding: 0
  vehicle-card-light:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-95}"
    rounded: "{rounded.xl}"
    padding: 0
  vehicle-card-selected:
    backgroundColor: "{colors.ink-95}"
  vehicle-card-title:
    typography: "{typography.headline-sm}"
    textColor: "{colors.paper}"
  vehicle-card-spec-chip:
    backgroundColor: "rgba(255,255,255,0.1)"
    textColor: "{colors.paper}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.pill}"
    padding: 4px 10px
  vehicle-card-price:
    typography: "{typography.price-md}"
    textColor: "{colors.paper}"

  # ════════════════════════════════════════════════════════════════════════
  # BADGES — small status flags. NO shadow.
  # ════════════════════════════════════════════════════════════════════════
  badge-best-deal:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.paper}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 4px 8px
  badge-popular:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.paper}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 4px 8px
  badge-new:
    backgroundColor: "{colors.success-bg}"
    textColor: "{colors.success}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 4px 8px
  badge-pending:
    backgroundColor: "{colors.warning-bg}"
    textColor: "{colors.warning}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 4px 8px
  badge-info:
    backgroundColor: "{colors.signal-blue-bg}"
    textColor: "{colors.signal-blue}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 4px 8px

  # ════════════════════════════════════════════════════════════════════════
  # FORM CONTROLS
  # ════════════════════════════════════════════════════════════════════════
  checkbox:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.xs}"
    size: 20px
  checkbox-checked:
    backgroundColor: "{colors.ink-100}"
  radio:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.full}"
    size: 20px
  radio-selected:
    backgroundColor: "{colors.paper}"
  switch:
    backgroundColor: "{colors.ink-30}"
    rounded: "{rounded.pill}"
    width: 44px
    height: 24px
  switch-on:
    backgroundColor: "{colors.ink-100}"

  # ════════════════════════════════════════════════════════════════════════
  # NAV / HEADER — light by default; turns inverse on hero pages.
  # ════════════════════════════════════════════════════════════════════════
  header:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-95}"
    height: 72px
  header-inverse:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.paper}"
  header-transparent:
    backgroundColor: "transparent"
    textColor: "{colors.paper}"
  nav-link:
    typography: "{typography.button-sm}"
    textColor: "{colors.ink-95}"
    padding: 10px 14px
  nav-link-active:
    textColor: "{colors.ink-100}"
  nav-link-inverse:
    textColor: "{colors.paper}"

  # ════════════════════════════════════════════════════════════════════════
  # STEPPER & TABS
  # ════════════════════════════════════════════════════════════════════════
  stepper-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-50}"
    typography: "{typography.label-md}"
  stepper-item-active:
    textColor: "{colors.ink-100}"
  stepper-item-complete:
    textColor: "{colors.ink-100}"
  tab:
    backgroundColor: "transparent"
    textColor: "{colors.ink-60}"
    typography: "{typography.button-md}"
    padding: 16px 20px
  tab-active:
    textColor: "{colors.ink-100}"

  # ════════════════════════════════════════════════════════════════════════
  # MODALS / OVERLAYS — the ONLY place shadows are first-class.
  # ════════════════════════════════════════════════════════════════════════
  modal:
    backgroundColor: "{colors.paper}"
    rounded: "{rounded.3xl}"
    padding: 32px
  modal-backdrop:
    backgroundColor: "rgba(0, 0, 0, 0.72)"
  toast:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.paper}"
    typography: "{typography.body-sm}"
    rounded: "{rounded.lg}"
    padding: 14px 18px
  toast-success:
    backgroundColor: "{colors.success}"
    textColor: "{colors.paper}"
  toast-error:
    backgroundColor: "{colors.signal-red}"
    textColor: "{colors.paper}"
  tooltip:
    backgroundColor: "{colors.ink-100}"
    textColor: "{colors.paper}"
    typography: "{typography.label-sm}"
    rounded: "{rounded.sm}"
    padding: 6px 10px

  # ════════════════════════════════════════════════════════════════════════
  # WHATSAPP FAB — locked external brand, the only fully-circular floating
  # element on the site.
  # ════════════════════════════════════════════════════════════════════════
  whatsapp-fab:
    backgroundColor: "{colors.whatsapp}"
    textColor: "{colors.paper}"
    rounded: "{rounded.full}"
    size: 56px
  whatsapp-fab-hover:
    backgroundColor: "{colors.whatsapp-press}"

  # ════════════════════════════════════════════════════════════════════════
  # LISTS / DIVIDERS
  # ════════════════════════════════════════════════════════════════════════
  list-item:
    backgroundColor: "transparent"
    textColor: "{colors.ink-95}"
    typography: "{typography.body-md}"
    padding: 18px 0
  list-divider:
    backgroundColor: "{colors.divider}"
    height: 1px
---

# WHEELS / INK & SIGNAL

> Bold. Sleek. Daring. Modern.
> Black is the spine. White is the canvas. Red and blue are signals — used rarely, used loudly.

---

## Overview

Wheels Rent A Car is a premium car rental brand for Lebanon. The visual system carries that premium with the most disciplined toolkit possible: **one typeface, two colours, and a refusal to decorate**.

**The thesis in one line:**

> A car rental site that looks like an editorial magazine, drives like a flagship product page, and converts like a checkout you'd actually trust.

**Three reference points, distilled:**

- **Rivian** — monumental typography. The product name set so large it bleeds the canvas. Specs in calm tonal cards. Black footer with white display type as architecture.
- **Tripadvisor** — inverse marketing blocks dropped into a clean white page. A single saturated colour earns the eye because nothing else competes for it. Pill buttons. Generous voids.
- **Sixt** — dark vehicle cards that let the metalwork carry the message. White uppercase headline at the top of each card; spec chips as ghosted pills; price quietly assertive at the bottom; the singular accent button on the right.

**What we explicitly reject:**

- The "soft and friendly Mediterranean" template. We are premium, not approachable-cute.
- Two-CTA-per-screen marketing pages. We make one move.
- Drop shadows on every card. Depth comes from contrast, type, and tonal layers — not blur.
- Decorative colour. If a colour is on the page it has a job (action, info, status, brand external).
- Multiple typefaces. One family does the work.

**Brand personality:**

- **Cinematic.** Cars are the heroes. Photography is wide, colour-graded, shot in real Lebanese light.
- **Confident.** Type doesn't apologise. Display sizes are large. Tracking is tight.
- **Quiet about the brand colours.** The spine is monochrome — when the red shows up, you notice.
- **Editorial in rhythm.** Section breaks feel like spreads. Voids are intentional. Density is earned.
- **Mediterranean only in subject, never in decoration.** Lebanon is in the photography and the localisation, not in pastel washes.

---

## Colors

The palette is a **monochrome ramp plus two signals**. There are no decorative colours.

### The spine: ink (black + grey ramp) and paper (white)

The system has 14 monochrome steps from `ink-100` (true black) to `paper` (true white). Black is the brand surface; white is the canvas. The ramp covers borders, dividers, secondary text, hover states, disabled states, and all tonal lifts. **Never tint these colours.** A bluish grey is not a Wheels grey.

- **`ink-100` (`#000000`)** — true black. Inverse heroes, primary CTA on light pages, the marketing block on the homepage, the footer, the floating booking summary on dark sections.
- **`ink-95` (`#0A0A0A`)** — the everyday "near-black". Vehicle cards, dark inverse cards, headlines on near-paper.
- **`ink-90` to `ink-70`** — large dark surfaces, dark card secondary type.
- **`ink-60` to `ink-50`** — secondary and muted text on light surfaces.
- **`ink-40`** — placeholder text, hairline icons.
- **`ink-30`, `ink-20`, `ink-15`, `ink-10`, `ink-05`** — borders and surface lifts. `ink-20` is the default light-surface border; `ink-10` is the subtle section background tint.
- **`paper` (`#FFFFFF`)** — the canvas. Default body background.

### The signals: red, blue

Both are brand colours by name (Cedar Red, Beirut Blue) but their **role has been demoted to "signals only"**. They do not decorate. They do not appear on hover states unless the role is "selected". They do not paint navigation.

- **`signal-red` (`#C8102E`)** — the singular CTA per screen. Also: critical errors (paired with icon and text), the `Best Deal` badge. If you are about to use red twice in the same view, you are wrong; demote one.
- **`signal-blue` (`#0E4F94`)** — informational. Inline links inside body copy. The info-banner background. The "selected row" tint. Never a primary action.

### Semantic

- `success` (`#10B981`) — confirmations, completed steps. Pair with icon.
- `warning` (`#F59E0B`) — pending booking states, hold timer warning.
- `error` — alias of `signal-red`. Always paired with an icon and explanatory text.

### External brand

- `whatsapp` (`#25D366`) — locked. The only saturated green in the system. Used exclusively on the WhatsApp FAB and inline WhatsApp affordances.

### Why so few?

Because monochrome is a discipline. With colour stripped away, **typography, spacing, image, and contrast carry the entire experience**. That's the bold direction.

---

## Typography

**Geist is the only typeface.** No second sans. No serif moment. The discipline of a single family across the entire system is part of the brand.

The system is voiced through three weights and one variant:

- **Geist Extra Bold (800)** — display, headlines, prices. Always **uppercase**, tight tracking.
- **Geist Medium (500)** — leadings (sub-headlines, intro paragraphs, form labels). Sentence case.
- **Geist Regular (400)** — body copy, helper text. Sentence case.
- **Geist Mono (400 / 500 / 700)** — numerics: prices in tabular contexts, booking refs, license plates, kilometers, timers.

**Geist Bold (700)** is reserved for buttons (uppercase) and a few utility moments where 800 reads too heavy at the size.

### Hierarchy at a glance

| Token             | Weight | Case      | Use                                                            |
| ----------------- | ------ | --------- | -------------------------------------------------------------- |
| `display-mega`    | 800    | UPPERCASE | Wordmark-scale headlines (e.g. category names behind a hero)   |
| `display-2xl`     | 800    | UPPERCASE | Home hero                                                      |
| `display-xl`      | 800    | UPPERCASE | Page hero on listing/category                                  |
| `display-lg`      | 800    | UPPERCASE | Editorial section openers                                      |
| `headline-lg`     | 800    | UPPERCASE | Major section headings                                         |
| `headline-lg`     | 800    | UPPERCASE | Section sub-headings                                           |
| `headline-md`     | 800    | UPPERCASE | Card headlines, modal titles                                   |
| `headline-sm`     | 800    | UPPERCASE | Vehicle card title, accordion question                         |
| `headline-xs`     | 800    | UPPERCASE | Small in-card headings                                         |
| `lead-xl` → `sm`  | 500    | Sentence  | Sub-headlines, intro paragraphs, leading copy under a headline |
| `body-lg` → `xs`  | 400    | Sentence  | Long-form prose, descriptions, FAQ answers                     |
| `button-lg/md/sm` | 700    | UPPERCASE | Button labels                                                  |
| `label-lg/md/sm`  | 500    | UPPERCASE | Field labels, overlines, eyebrow text                          |
| `overline`        | 700    | UPPERCASE | Section eyebrow above a display                                |
| `mono-md/lg`      | 500/700| Mono      | Booking ref, plate, code                                       |
| `price-xl/lg/md/sm`| 800   | Numeric   | Headline price moments (sticky panel, hero)                    |

### Voice

- **Headlines are short, declarative, often complete sentences in three words.** "DRIVE LEBANON, YOUR WAY." "PICK YOUR CAR." "WE WAIT FOR YOU."
- **Leadings expand the headline in plain prose**, written in Medium so they sit confidently below without competing.
- **Body is unfussy.** Sentence case, short paragraphs, no jargon.
- **Buttons are commands.** "BROWSE FLEET." "PAY & CONFIRM." "CONTINUE."
- **Numbers are tabular.** Prices, totals, refs, plates — all set in Geist Mono where alignment matters; in Geist Extra Bold where they're a hero moment.

### Hierarchy in practice — a worked example

A homepage hero might read:

```
DRIVE LEBANON,
YOUR WAY.                             ← display-2xl, ink-100 on paper

Premium cars from $25 a day.          ← lead-lg, ink-60
Free Beirut Airport pickup.

[ SHOW CARS ]                         ← button-cta, signal-red
```

A vehicle card title block reads:

```
TOYOTA COROLLA                        ← headline-sm, paper, all caps
or similar                            ← body-sm italic, ink-40
[ 5 SEATS ] [ AUTO ] [ PETROL ]       ← spec chips, label-sm
$32 / DAY                             ← price-md, paper
```

### Tracking & rendering rules

- All-caps display tokens use **negative tracking** (-0.02em to -0.04em). Caps are wider than lowercase; tightening compensates.
- All-caps label and overline tokens use **wide positive tracking** (+0.06em to +0.16em) so individual letterforms read clearly at small sizes.
- Sentence-case lead and body tokens use neutral or slightly negative tracking.
- `font-feature-settings: "tnum" 1` is enabled on all `price-*` tokens and any tabular table cell.
- Use `font-display: swap` for both Geist Sans and Geist Mono. Preload Geist 400, 500, 700, 800.

---

## Layout

The site uses an **8-point spacing scale** with a 4-point half-step for micro-adjustments. The base unit is `16px`. Everything composes from there.

### Containers

- **Default container:** `1280px` max width.
- **Narrow container:** `880px` for long-form articles (Privacy, Terms, FAQ articles, About body).
- **Wide container:** `1440px` for fleet listings where wider product cards earn the room.
- **Full-bleed:** marketing dark blocks and hero photography break the container and run edge-to-edge.

### Page padding

- Mobile: `20px`.
- Desktop: `48px`. Generous on purpose — voids are part of the language.

### Section rhythm

- Mobile: `64px` between major sections.
- Desktop: `128px` between major sections. Marketing pages breathe; the booking funnel tightens to `48–64px`.
- Inside a section, sub-sections use `48px` (desktop) / `32px` (mobile).

### Grid

- 12 columns desktop, 24px gutter.
- 8 columns tablet, 24px gutter.
- 4 columns mobile, 16px gutter.

### Containment

Cards group related elements. Default card padding is `24px`. Inverse cards use `32px`. Hero cards (the homepage marketing block, Tripadvisor-style) use `48–64px`. Generous padding is part of the premium signal.

### Density rules

- A fleet listing page is **medium density** — 3 cards per row on desktop with breathing room.
- A booking flow page is **high density** — packed efficient forms with a sticky right panel.
- A marketing page (Home, About, Long-term, Chauffeur, Corporate) is **low density** — large type, large images, generous voids.

---

## Elevation & Depth

> Depth is achieved through **contrast and tonal layers, not shadows**. Cards have no shadow by default.

The system has five elevation tokens, but most components use elevation-0 (no shadow). Shadow is reserved for elements that need to **detach from the page** — modals, sheets, the floating booking summary, the WhatsApp FAB, dropdowns.

| Token         | Use                                                 |
| ------------- | --------------------------------------------------- |
| `elevation-0` | Default. No shadow. Cards, vehicle cards, sections. |
| `elevation-1` | Hover state on a vehicle card or interactive card. `0 1px 2px rgba(0,0,0,0.04), 0 2px 6px rgba(0,0,0,0.04)` |
| `elevation-2` | Sticky search bar when stuck; sticky booking summary. `0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)` |
| `elevation-3` | Floating action buttons (WhatsApp FAB), dropdowns, popovers. `0 12px 32px rgba(0,0,0,0.10), 0 4px 12px rgba(0,0,0,0.06)` |
| `elevation-4` | Modals, drawers, lightboxes. `0 24px 56px rgba(0,0,0,0.16), 0 8px 16px rgba(0,0,0,0.08)` |

### Defining edges without shadow

- **Border:** `1px solid {colors.border}` on light cards. The default.
- **Tint:** `{colors.surface-subtle}` (`ink-10`) background on a card sitting on a paper surface. The Rivian "spec card" pattern.
- **Inverse:** flip the surface to `ink-100`. The most extreme tonal layer.
- **Negative space:** sometimes the card is just a heading + content with no visible container. The spacing is the affordance.

---

## Shapes

The shape language is **pill-rounded for action, soft-rounded for surface**.

- **Buttons:** **pill** (`rounded.pill` / `9999px`). Always. Even big buttons.
- **Inputs:** **`rounded.lg`** (`16px`). Search bar uses **pill** for hero use.
- **Chips, switches, avatars, FAB:** **pill / full** (`9999px`).
- **Cards:** **`rounded.xl`** (`20px`). Vehicle cards and content cards.
- **Modals & sheets:** **`rounded.3xl`** (`32px`). The largest container deserves the largest curve.
- **Floating cards (sticky summary, search bar):** **`rounded.2xl`** (`24px`).
- **Badges:** **`rounded.sm`** (`8px`). Flatter on purpose so they read as labels, not affordances.
- **Iconography:** Lucide style, 1.5px stroke, rounded line caps, 24×24 grid.
- **Image corners:** vehicle photography is bled to the card's `rounded.xl` (`20px`). Hero imagery is full-bleed (no radius).

**Never mix radii on the same atom.** A button is pill; a card is `xl`; an input is `lg`. Compose, don't combine.

---

## Components

The component library is intentionally tight. Every component below maps to a token group in the YAML frontmatter; the prose here describes intent.

### Buttons

- **`button-primary` (BLACK pill)** — the everyday workhorse on light pages. Used for "CONTINUE", "SAVE", "EDIT", "BROWSE", "SIGN IN". 48px tall by default.
- **`button-cta` (RED pill)** — the singular conversion CTA. Used on "SHOW CARS" (search bar), "SELECT" (vehicle card expanded), "PAY & CONFIRM" (checkout), "RESERVE NOW" (long-term/chauffeur lead forms). **Larger by default** (56px tall) so the eye finds it without hunting. **Never two on the same screen.**
- **`button-primary-inverse` (WHITE pill)** — the equivalent of button-primary on dark surfaces. Used on the inverse marketing block ("GET THE APP", "JOIN FOR FREE").
- **`button-secondary` (OUTLINE pill)** — alternate paths and dismissals: "CANCEL", "EDIT SEARCH", "SAVE FOR LATER". Hover inverts to filled.
- **`button-tertiary` (TEXT pill)** — low-stakes actions inside cards: "VIEW DETAILS", "MANAGE", "READ MORE".
- **Icon-only button** — square 44px hit area, pill rounded. Always has `aria-label`.

**All button labels are UPPERCASE Geist Bold (700), tight tracking.** No emoji in button labels.

States: every button supports rest, hover, pressed, focus (4px halo at `ink-10` over a 2px `ink-100` outline), and disabled.

### Inputs

- **Default `input`** — 56px tall, `rounded.lg` (16px), 1px border at `ink-20`, paper surface.
- **Focus** — 2px `ink-100` outline + 4px `ink-10` halo. High-contrast and visible on the page.
- **Error** — 1.5px `signal-red` border + helper text in `signal-red`.
- **Search input** — pill-rounded, 64px tall, larger type. Used on the hero search bar.
- **Inverse input** — `ink-90` surface for forms inside dark sections (rare).
- **Phone input** — flag + country code (defaults to 🇱🇧 +961 for Lebanese visitors). Tabular figures.
- **File upload** — dashed border at `border-strong`, `rounded.lg`, 24px padding, centered icon + label "DRAG A FILE OR BROWSE".

Field labels use `field-label` token (uppercase Geist Medium, wide tracking) ABOVE the field. Helper text in `field-helper` below. Error text in `field-error` swaps with helper when present.

### Chips

Pill, 36px tall, two flavors:

- **Filter chip** — neutral `ink-10` background. Selected state inverts to `ink-100` with paper text.
- **Inverse chip** — `ink-80` background on dark surfaces. Selected state flips to paper-on-`ink-100`.

Used for category filters on the fleet listing, sort options on search results, vehicle spec chips on cards (ghosted variant with translucent paper background on dark).

### Cards

The spine of the layout:

- **`card`** — paper surface, `rounded.xl` (20px), 24px padding, 1px `border`. **No shadow.** Default container.
- **`card-tint`** — `ink-10` surface, no border, no shadow. Used for "spec cards" Rivian-style and quiet sub-sections.
- **`card-inverse`** — `ink-100` surface with paper text, `rounded.xl`, 32px padding. The marketing block, the footer columns, the dark hero card.
- **`card-image`** — image-led card with corners cropping the photo. The vehicle card and editorial tile share this base.
- **`card-floating`** — paper, `rounded.2xl` (24px), `elevation-3`. The only "default-shadowed" card. Used for the search bar and the sticky booking summary.

### Vehicle card (the central recurring component)

**Dark by default.** Inspired by Sixt — the car is the hero; the dark surface lets the metalwork carry the message.

```
┌─────────────────────────────────┐
│                                 │
│  [Vehicle photo, 4:3, bled to   │
│   the corners]                  │
│                                 │
├─────────────────────────────────┤
│  TOYOTA COROLLA                 │  ← headline-sm, paper, all caps
│  or similar                     │  ← body-sm italic, ink-40
│                                 │
│  [5] [AUTO] [PETROL] [3 BAGS]   │  ← spec chips, ghosted paper
│                                 │
│  $32 / DAY                      │  ← price-md, paper
│  $160 total                     │  ← body-sm, ink-40
│                                 │
│  [   SELECT   →  ]              │  ← button-primary-inverse pill
└─────────────────────────────────┘
```

- Card surface `ink-95`, `rounded.xl`, 0 padding (image bleeds), 24px padding in the content footer.
- Hover lifts elevation-0 → elevation-1 with a subtle 1.02 scale on the image (300ms ease).
- Selected state outlines with 2px `signal-red`.
- A **light variant** (`vehicle-card-light`) exists for grid contexts where a sea of dark cards would be too heavy — paper surface, `ink-95` text, 1px border, otherwise identical structure.

### Stepper

Horizontal, top of every booking step:

```
●━━━━━━━●━━━━━━━○━━━━━━━○━━━━━━━○
1. VEHICLE  2. EXTRAS  3. PROTECTION  4. CHECKOUT  5. CONFIRM
```

Active step in `ink-100`. Completed steps in `ink-100` with a check icon. Future steps in `ink-50`. Steps 1–4 are clickable to go back. **No colour on the stepper** — it's all monochrome.

### Sticky booking summary

A `card-floating` (the only shadow on a card-like element). Contents update with subtle 200ms motion when the user adds an extra or changes a tier. On mobile collapses to a bottom action bar with "TOTAL $X · SEE DETAILS ▾" — tap expands to a sheet.

### Tier comparison cards (protection step)

Three side-by-side cards. The middle one wears a `badge-popular` ribbon (BLACK, not red) and is outlined 2px in `ink-100`. Each card uses a tonal lift to differentiate visually without relying on colour.

### Modals & sheets

`rounded.3xl` (32px) — the largest curves in the system. 32px padding. `elevation-4`. Backdrop is `rgba(0, 0, 0, 0.72)` — heavy black, on-brand. On mobile, modals become bottom sheets with the top corners only rounded.

### Toasts

`ink-100` background, paper text, `rounded.lg`. Slide in from the bottom-right (desktop) or top (mobile). 4-second auto-dismiss for info; manual dismiss for errors.

### Floating WhatsApp FAB

The only fully-circular floating element. Locked WhatsApp green (`#25D366`). 56px diameter, white WhatsApp icon, `elevation-3`. Persistent on every page except checkout once the user is interacting with payment.

### Header / Nav

72px tall, paper background, 1px `border` bottom. Logo left, primary nav center-left (uppercase Geist Bold sm), right cluster (phone, WhatsApp, Sign In, Register pill). On the homepage hero only, header is **transparent** over the dark hero image and switches to solid paper on scroll past 60px.

An **inverse header** variant exists for fully dark pages.

---

## Do's and Don'ts

**Do**

- Do use Geist for everything. The single-family discipline IS the brand.
- Do set headlines in **Geist Extra Bold UPPERCASE** with tight tracking. Big and confident.
- Do let imagery do the heavy lifting on hero sections. Cars in real Lebanese light, full-bleed, no overlay decoration.
- Do use `card-inverse` (black with white type) generously for marketing blocks — homepage, long-term page, chauffeur page. It's a signature.
- Do use **massive type as a layout device** when the page can carry it (Rivian-style — category name behind a vehicle hero).
- Do reserve `signal-red` for the singular CTA per screen and for critical errors.
- Do reserve `signal-blue` for inline links, info banners, and the "selected row" tint.
- Do keep prices in tabular figures and Geist Mono (or Geist Extra Bold for hero prices).
- Do use generous voids — premium products earn their margins.
- Do default to **no shadow on cards**. Use border or tint instead.
- Do default to **pill buttons** everywhere.
- Do maintain WCAG AA contrast (4.5:1 body, 3:1 large text and UI components).
- Do photograph Lebanon — Raouché, Cedars, Downtown, the coastal road. Natural light. No studio cars on white.

**Don't**

- Don't introduce a second typeface. Geist or nothing.
- Don't use sentence-case headlines. Headlines are UPPERCASE.
- Don't put colour on hover states unless the role is "selected" (selected row tints with `signal-blue-bg`).
- Don't put two `button-cta` red buttons on the same screen. If you reach for red twice, demote one.
- Don't decorate with red or blue. They are signals, not paint.
- Don't add drop shadows to vehicle cards, content cards, tier cards, or list items. The system's depth is contrast.
- Don't crowd cards. If a card is full, it's a detail page.
- Don't mix corner radii on the same element. Pills are pills, cards are `xl`, modals are `3xl`.
- Don't use the WhatsApp green for any non-WhatsApp affordance. Locked.
- Don't tint the ink ramp. A bluish grey is not a Wheels grey.
- Don't use the brand red for badges other than `badge-best-deal` and error states.
- Don't ship copy hardcoded in components. Use the message catalog (Phase 2 ships AR + FR; the system must be ready).
- Don't decorate the booking funnel. Tighten density, hide the WhatsApp FAB once payment starts, single CTA at the bottom, sticky summary on the right.
- Don't write headlines longer than 5 words. If it doesn't fit, it isn't a headline.
- Don't centre body text. Long-form prose is left-aligned at 720px max line length.
