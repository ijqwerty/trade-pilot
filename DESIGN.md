---
name: TradePilot
description: Morning briefing packet for retail market monitoring — cool paper, thrifty teal, clay stamps.
colors:
  cool-paper: "#EEF2F6"
  ink: "#1B2430"
  thrifty-teal: "#2F6F8F"
  teal-deep: "#275F7A"
  clay: "#C45C26"
  mute-slate: "#5A6573"
  panel: "#F7F8F8"
  stamp-ink: "#F7F2EE"
  field: "#FFFFFF"
  delta-up: "#1F6B4A"
  delta-down: "#9B2C2C"
  rule: "color-mix(in srgb, #1B2430 14%, transparent)"
typography:
  display:
    fontFamily: "Castoro Titling, ui-serif, Georgia, serif"
    fontSize: "clamp(1.35rem, 2.2vw, 1.85rem)"
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: "0.04em"
  headline:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "0.08em"
  title:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "normal"
  body:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Source Sans 3, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.06em"
rounded:
  stamp: "2px"
  sm: "4px"
  md: "8px"
  none: "0px"
spacing:
  xs: "0.65rem"
  sm: "0.85rem"
  md: "1.25rem"
  lg: "1.75rem"
  xl: "2.5rem"
  container-x: "1rem"
components:
  button-primary:
    backgroundColor: "{colors.thrifty-teal}"
    textColor: "{colors.field}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.teal-deep}"
    textColor: "{colors.field}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
    height: "48px"
  button-clay-outline:
    backgroundColor: "transparent"
    textColor: "{colors.clay}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
  input-field:
    backgroundColor: "{colors.field}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px"
    height: "48px"
    typography: "{typography.body}"
  attention-stamp:
    backgroundColor: "{colors.clay}"
    textColor: "{colors.stamp-ink}"
    rounded: "{rounded.stamp}"
    padding: "0.2rem 0.4rem"
    typography: "{typography.label}"
  nav-link:
    backgroundColor: "transparent"
    textColor: "{colors.mute-slate}"
    padding: "0"
  nav-link-active:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    padding: "0 0 0.125rem"
  panel-surface:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0"
---

# Design System: TradePilot

## Overview

**Creative North Star: "Morning Briefing Packet"**

TradePilot reads as a cool morning market memo on continuous paper, not a trading terminal or a grid of interchangeable dashboard cards. The signed-in home splits attention: a left memo rail for alerts and movers, a right measurement column for the personal watchlist, and a quieter full-width market-context band beneath. Identity comes from thrifty accent use, tabular numerals, hairline strata rules, and struck selection — never glass, neon, or yellow-on-charcoal chrome.

Density is editorial and scannable: uppercase section headings, restrained chrome in mute slate, and clay reserved for attention stamps. Surfaces stay flat; depth is conveyed by rule lines and soft tonal washes (teal hover, clay strike), not drop shadows or frosted panels.

**Key Characteristics:**
- Continuous cool-paper packet (`#EEF2F6`) with ink charcoal (`#1B2430`) as the primary voice
- Split attention rail (≈3/7) above a demotable market-context band
- Thrifty ocean teal for actions, links, symbols, and focus; clay only for attention stamps and strike washes
- Castoro Titling for display masthead / wordmark moments; Source Sans 3 for UI and data
- Tabular numerals, hairline rules, struck selection — no glass, neon, or widget-card collage

## Colors

A cool, desaturated morning palette: paper field, ink type, thrifty teal actions, mute slate chrome, and clay reserved for attention.

### Primary
- **Thrifty Ocean Teal** (`#2F6F8F`): Actions, symbol links, active nav underline, focus rings, selection tint, and hover washes. Deepens to **Teal Deep** (`#275F7A`) on primary-button hover. Kept rare enough that the packet stays paper-first.

### Secondary
- **Clay Stamp** (`#C45C26`): Attention stamps (UPPER / LOWER / VOLUME / NOTE), add-alert outline chrome, and the struck-row wash. Stamp type sits on warm **Stamp Ink** (`#F7F2EE`). Not a general accent.

### Neutral
- **Cool Paper** (`#EEF2F6`): App shell, body, header, and TradingView embed wash — the continuous packet surface.
- **Ink Charcoal** (`#1B2430`): Primary text, active nav, masthead date, table body.
- **Mute Slate** (`#5A6573`): Secondary chrome — nav idle, labels, meta, empty copy, copyright, flat deltas.
- **Panel Mist** (`#F7F8F8`): Menus, search dialog, alert dialogs — slightly lifted paper, still flat.
- **Field White** (`#FFFFFF`): Form inputs and selects.
- **Rule** (`color-mix(in srgb, #1B2430 14%, transparent)`): Strata hairlines for masthead, tables, attention items, and bands.
- **Delta Up / Down** (`#1F6B4A` / `#9B2C2C`): Restrained gain/loss type only; never neon green/red fills.

### Named Rules
**The Accent Thrift Rule.** Teal is for action and focus; clay is for attention stamps and strike only. Neither paints large surfaces.

**The Continuous Paper Rule.** The shell stays cool paper end-to-end. Do not introduce glass, neon glows, or yellow-on-charcoal terminal chrome.

## Typography

**Display Font:** Castoro Titling (with ui-serif, Georgia)
**Body Font:** Source Sans 3 (with ui-sans-serif, system-ui)

**Character:** A titling serif for the morning date masthead and wordmark moments; a clean humanist sans for labels, nav, body, and numeric grids. Data always uses tabular figures.

### Hierarchy
- **Display** (400, `clamp(1.35rem, 2.2vw, 1.85rem)`, 1.15, tracking `0.04em`, uppercase): Session masthead date line only.
- **Headline** (700, `0.8125rem`, tracking `0.08em`, uppercase): Section titles — Needs Attention, My Watchlist.
- **Title** (600, `1.25rem`–`1.5rem`): Auth form titles, empty-state titles, alert names.
- **Body** (400–500, `0.9375rem`–`1rem`, ~1.45–1.5): Attention detail, forms, nav, table cells.
- **Label** (600, `0.6875rem`, tracking `0.06em`–`0.08em`, uppercase): Table headers, masthead dt, section labels (Alerts, Movers, Market Context), stamps at `0.625rem` / `0.1em`.

### Named Rules
**The Tabular Numerals Rule.** Prices, changes, caps, P/E, and thresholds use `font-variant-numeric: tabular-nums` so columns align.

**The Measurement Label Rule.** Section and column labels are small, uppercase, tracked Source Sans — not decorative eyebrows or kickers above the masthead.

## Layout

The packet is a vertical stack inside a max-width container (`max-w-screen-2xl`, horizontal padding `1rem` / `1.5rem` / `2rem`). Main briefing padding is `1.75rem` top / `3rem` bottom with `2.5rem` stack gaps.

**Split attention rail:** One column below `960px` (attention, then watchlist). From `960px`, `minmax(0, 3fr) minmax(0, 7fr)` with `2rem`/`2.5rem` gutters — left memo rail, right watchlist measurement grid. Market context is a full-width band under both columns, demoted (`opacity: 0.78`) when the watchlist is empty. Watchlist widgets go two-up from `1100px`; context widgets `1.2fr / 0.8fr` from `960px`.

Sticky header uses paper at 90% with light blur and a bottom rule — quiet chrome, not a floating card.

### Named Rules
**The Split Desk Rule.** Needs Attention stays left; the personal watchlist owns the main column; global market context stays quieter and below. Do not flatten this into an equal widget-card grid.

## Elevation & Depth

Flat by default. Depth comes from hairline rules, soft color-mix washes (teal 6% row hover, clay 8% struck row, teal 10–12% menu focus), and the slight panel lift to `#F7F8F8` for overlays — not ambient shadows or glass.

### Shadow Vocabulary
None on packet surfaces. Do not add lift shadows to rails, tables, or stamps.

### Named Rules
**The Strata Voids Rule.** Separate zones with ink-mixed hairline rules and spacing, not bordered cards or offset shadows.

## Shapes

Most packet structure is square (`0`): tables, news rows, alert lists, TradingView frames. Interactive chrome uses gently rounded corners (`8px` / `rounded-md`) for buttons, inputs, and search CTAs. Attention stamps use a tight `2px` radius. News tags use `4px`. Avoid pill-full radii on primary actions; circular treatments appear only on small icon affordances (update/delete).

### Named Rules
**The Square Packet Rule.** Measurement grids and memo lists stay square-edged; radius is reserved for controls, not content cards.

## Components

### Buttons
- **Shape:** Gently rounded (`8px`)
- **Primary:** Teal fill, white type, medium weight, height `44–48px`; hover Teal Deep; disabled at 50% opacity. (Legacy class name `yellow-btn` still maps to this teal treatment.)
- **Clay outline:** Transparent fill, clay type and border (`35%` clay mix), soft clay wash on hover — used for add-alert.
- **Focus:** Global `2px` teal outline, `2px` offset.

### Attention stamps
- **Style:** Clay fill, stamp-ink type, `2px` radius, min-width `3.25rem`, uppercase tracked micro-label (UPPER / LOWER / VOLUME / NOTE).
- **Role:** The only saturated mark in the attention rail; pairs with teal symbol links beside them.

### Cards / Containers
- **Corner Style:** Square for packet regions; no card chrome on the briefing split.
- **Background:** Cool paper continuous; overlays use Panel Mist.
- **Border:** Hairline rules only — no boxed card frames on dashboard strips.
- **Internal Padding:** Attention items and table cells ~`0.65–0.85rem` rhythm.

### Inputs / Fields
- **Style:** White field, ink type, slate placeholder, ink-mix border (`18%`), `8px` radius, height `48px`.
- **Focus:** Teal border, no ring glow beyond the global focus-visible outline.
- **Overlays (search / menus):** Panel Mist background, ink-mix borders, teal selection wash on active items.

### Navigation
- **Header:** Sticky cool-paper bar, logo left, primary nav center (sm+), bell + user right. Idle links Mute Slate; hover Teal; active Ink with `2px` teal underline.
- **In-packet links:** Teal, medium weight, underline on hover with `3px` offset (Manage watchlist →, View all alerts →, symbols).

### Watchlist measurement grid
- **Style:** Full-width table between top/bottom rules; uppercase slate headers; teal symbol links; tabular body.
- **Hover / focus-visible:** Teal 6% wash on the row.
- **Focus-expansion (interaction):** Selecting a row (click / Enter / Space) emphasizes it with a teal inset bar and slightly expanded padding while sibling rows recede (`opacity ~0.4`). The same focus symbol syncs to Needs Attention items. Escape clears focus.
- **Struck selection:** Clay strike / line-through remains a design raise in the approved comp, but the product has no dismissed/read-row (or equivalent) state. Do not hardcode a struck first row for decoration.

### Session masthead
- **Style:** Display date line + Session / Focus definition list under a bottom rule. Date is Castoro Titling uppercase; dt labels are micro uppercase slate.

## Do's and Don'ts

### Do:
- **Do** keep teal thrifty and clay stamp-bound; let cool paper and ink carry most of the screen.
- **Do** use tabular numerals for every price, change, and threshold column.
- **Do** preserve the split desk: attention rail, watchlist column, quieter market band below.
- **Do** separate strata with hairline rules and spacing voids.
- **Do** use Castoro Titling for masthead/display moments and Source Sans 3 for UI and data.

### Don't:
- **Don't** rebuild the home as a grid of interchangeable elevated cards or terminal chrome.
- **Don't** reintroduce yellow-on-charcoal, neon gain/loss fills, glassmorphism, or decorative glow.
- **Don't** spend clay on large fills, marketing badges, or general CTAs — stamps and strike only.
- **Don't** invent eyebrow/kicker lines above the masthead; the date line is the display voice.
- **Don't** drop shadows under packet rails, tables, or stamps.
