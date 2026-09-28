# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Retail investors and aspiring investors who want a focused signed-in workspace to monitor markets and the stocks they care about, without the overload of a professional trading terminal.

Their job is to quickly understand what is happening with the stocks they follow, investigate a symbol when something catches their attention, maintain a watchlist, and create useful price/volume alerts.

**Secondary:** Portfolio reviewers evaluating the project. TradePilot should demonstrate thoughtful product design and frontend engineering, but portfolio presentation must never distort the primary investor experience. It should feel like a real product first and a portfolio project second.

## Product Purpose

TradePilot is a signed-in stock-market monitoring app. Users authenticate, land on a personalized market home, manage a watchlist, discover and inspect symbols, set price/volume alerts, and receive in-app notifications and email digests.

Success is a polished, credible end-to-end market-monitoring experience — convincing enough that it could continue toward a real launch — while remaining honest about capabilities that actually exist. For the portfolio audience, success means demonstrated product thinking, information architecture, interaction design, visual craft, responsive implementation, and attention to detail — not resemblance to a generic commercial SaaS template.

## Positioning

A focused retail market-monitoring workspace: watchlist-driven personalization, symbol investigation, and useful alerts/digests — not a brokerage terminal, not a Bloomberg imitation, and not an interchangeable SaaS dashboard. Clarity and legibility of market information outrank decorative visualization. The product should have a recognizable identity appropriate to market monitoring while remaining usable for non-professional investors.

## Operating Context

- Email/password auth (Better Auth, server actions only); anonymous users are redirected to sign-in with a safe return path
- Logged-in shell: header, nav, search command dialog, notifications, user menu
- Dashboard at `/` with TradingView market widgets (overview/quotes personalize from watchlist when present; heatmap/timeline stay global)
- Finnhub-backed stock search → `/stocks/[symbol]` TradingView detail widgets
- Persistent watchlist at `/watchlist` with quotes and in-app news
- Price alert CRUD + Inngest evaluation (email + in-app); automatic watchlist volume-spike alerts
- Notification preferences and daily AI news digest (opt-out) via UserProfile / settings
- Background work via Inngest (welcome email, daily digest, alert checks, TradingView symbol mapping)
- Market data: Finnhub (personal/non-commercial, server-side) + TradingView embeds for charts

## Capabilities and Constraints

**In scope / shipped capabilities to preserve unless UX strongly requires resurfacing:**
- Auth, session-gated app shell, personalized dashboard, stock detail, Finnhub search, persistent watchlist, notification center, notification preferences, price alerts, volume-spike alerts, welcome + daily digest emails, TradingView symbol mapping

**Hard constraints:**
- TradePilot is the only user-facing product name (Inngest client id may remain `signalist` as infrastructure identity)
- Finnhub stays personal/non-commercial and server-side; never expose API keys to the client
- No billing, Stripe, subscriptions, or admin/CMS
- Auth remains server-actions-only (no Better Auth HTTP catch-all unless a concrete requirement appears)
- `/` is the logged-in home/dashboard — not an admin console
- No brokerage execution, portfolio accounting, or live order routing; do not present TradePilot as a brokerage or imply users can execute trades
- Do not invent capabilities the current infrastructure cannot support
- Preserve existing functional capabilities and working business logic unless there is a strong UX reason to restructure how they are surfaced

**Open / undecided:**
- Whether or when the project becomes a monetized/commercial product (would require revisiting Finnhub licensing and billing — currently out of scope)

## Brand Commitments

- User-facing name: **TradePilot** (metadata, logo wordmark, auth copy, emails)
- Voice: clear, credible market-monitoring product language; honest about what exists; no invented commercial claims
- The existing dark gray/yellow UI is **not** a binding visual direction. Redesign work may reconsider visual system, layout, navigation, typography, color, density, and component language. Treat the current UI as evidence of functionality and workflows, not the desired aesthetic.
- Avoid defaulting to a generic SaaS dashboard, crypto dashboard, Bloomberg-terminal imitation, or an interface filled with interchangeable cards
- Logo asset: `/assets/icons/logo.svg`

## Evidence on Hand

- Runnable Next.js 15 app with the flows above implemented in code
- Product docs in `context/` (`project-overview.md`, `progress-tracker.md`, feature specs)
- Logo at `public/assets/icons/logo.svg`
- No real customer testimonials, press, or commercial benchmarks — do not fabricate them
- Origin scaffold: JavaScript Mastery Signalist tutorial (historical; not user-facing brand)

## Product Principles

1. **Investor job first** — Every surface serves monitoring, investigation, watchlist, or alerts for a non-professional investor; portfolio polish never overrides that job.
2. **Honest capability** — Only ship and claim what infrastructure supports; never imply brokerage or invented features.
3. **Clarity over spectacle** — Market information must be legible and scannable; decoration does not outrank understanding.
4. **Personal focus** — The product earns value by centering the user’s watchlist and alerts, not by dumping a generic market terminal.
5. **Craft without template** — Distinct, usable market-monitoring identity; not a stock SaaS, crypto, or terminal clone.

## Accessibility & Inclusion

Responsive behavior and keyboard accessibility are product requirements. Design and implementation must support usable layouts across typical desktop and mobile viewports and operable primary flows via keyboard.
