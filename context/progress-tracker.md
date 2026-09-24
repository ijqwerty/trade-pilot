# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Auth edge middleware hardening shipped (spec `12`)
- Volume spike alerts shipped (spec `11`)
- Personalized logged-in dashboard shipped (spec `10`)
- TradingView symbol mapping shipped (spec `09`)
- Price alert evaluation shipped (spec `08`)
- Price Alert CRUD shipped (spec `07`)
- Notification preferences, digest opt-out, and signup profile persistence shipped (spec `06`)
- In-app Notification Center shipped (spec `05`)
- Codebase baseline: auth, TradingView dashboard/stock pages, persistent watchlist, Finnhub shared client, Inngest email workflows — branded as TradePilot

## Current Goal

- Use `context/*` as shared project memory for future sessions
- Next implementation work should start from **Next Up** only when explicitly requested

## Completed

- Better Auth email/password sign-up, sign-in, sign-out (server actions)
- Session-gated `(root)` layout with Header / nav / user menu
- Dashboard `/` with four TradingView embeds (static configs)
- Stock detail `/stocks/[symbol]` with TradingView widgets
- Finnhub stock search command dialog
- MongoDB connection helper (incl. SRV workaround) + Watchlist model
- Watchlist **read** helper by email (used by digests)
- Inngest: welcome email on `app/user.created`
- Inngest: daily news summary (cron `0 12 * * *` + `app/send.daily.news`)
- Nodemailer templates for welcome + news + price/volume alerts (inactive-user reminder template remains unused)
- Project context files populated from codebase analysis (`context/*.md`)
- **TradePilot rebrand** — metadata, logo alts/wordmark, auth copy, email/Inngest strings, `package.json` name `trade-pilot`, README rewritten; Inngest client id left as `signalist`
- **Finnhub shared cache + rate limiter** (`context/feature-specs/02-finnhub-cache-rate-limiter.md`) — `lib/finnhub/client.ts` with token bucket (≤30/min), in-flight coalescing, Next `fetch` TTLs; `getQuote` / `getQuotes` / `getVolumeSnapshot`; search + news migrated; `FINNHUB_API_KEY` documented as supported secret
- **Persistent Watchlist + `/watchlist` page** (`context/feature-specs/03-persistent-watchlist.md`) — Mongo-backed add/remove/list; `WatchlistButton` server actions + toasts; `/watchlist` table/empty state; nav enabled; stock page + search `isInWatchlist`; digest `getWatchlistSymbolsByEmail` unchanged
- **Watchlist live quotes + in-app news** (`context/feature-specs/04-watchlist-quotes-and-news.md`) — server-side `getQuotes` + best-effort profile/metric (≤5 symbols) via `lib/watchlist/enrich-market-data.ts`; `WatchlistNews` + table price/change/market cap/P/E; empty watchlist skips quote/news fetches; no client Finnhub or polling
- **In-app Notification Center** (`context/feature-specs/05-notification-center.md`) — Mongoose `Notification`; session actions list/unread/mark-read/mark-all; header `NotificationBell` popover (refresh on open); server-only `createNotification` with safe `href` + `dedupeKey` idempotency; writers: price alerts (`08`) and volume spikes (`11`)
- **Notification preferences & digest opt-out** (`context/feature-specs/06-notification-preferences.md`) — Mongoose `UserProfile` keyed by Better Auth `userId`; sign-up upsert + settings CRUD; `/settings` + user menu entry; digest filters `dailyNewsEmail !== false` (default ON); email footers → in-app settings URL; `lastSignedInAt` on sign-in + throttled root layout touch
- **Price Alert CRUD** (`context/feature-specs/07-price-alert-crud.md`) — Mongoose `Alert` (`userId`, symbol, company, alertName, upper/lower, threshold, enabled, `lastTriggeredAt`); `createAlert` / `updateAlert` / `deleteAlert` / `getMyAlerts`; max 20/user; `AlertModal` + `AlertsList` + `AddAlertButton`; watchlist Alert column + sidebar; stock page create entry; no Inngest evaluation or email
- **Price alert evaluation (email + in-app)** (`context/feature-specs/08-price-alert-evaluation.md`) — Inngest `price-alert-check` cron `* * * * *`; active users (enabled alert + `lastSignedInAt` ≤7d); shared `getQuotes` batch; `isArmed` rearm/dedup; `sendUpper`/`sendLower` Nodemailer + `createNotification` (`price_upper`/`price_lower`); respects `alertEmail`/`alertInApp`
- **TradingView symbol mapping** (`context/feature-specs/09-tradingview-symbol-mapping.md`) — heuristic `resolveTradingViewSymbol` + `SymbolMap` cache; Watchlist `tradingViewSymbol`; stock widgets use mapped `EXCHANGE:SYMBOL`; Inngest `map-tradingview-symbol` on `app/symbol.map` uses `TRADINGVIEW_SYMBOL_MAPPING_PROMPT` (no Gemini in RSC)
- **Personalized logged-in Dashboard** (`context/feature-specs/10-personalized-dashboard.md`) — `/` loads the session watchlist; overview + quotes clone configs with mapped symbols (cap 12, newest `addedAt`); empty/fail → static defaults; heatmap/timeline stay global; dead `sendDailyNewsSummary` import removed; no Finnhub/Inngest from the page
- **Volume spike alerts** (`context/feature-specs/11-volume-spike-alerts.md`) — automatic watchlist spikes (≥ 2.0 × 10-day average) on the existing `price-alert-check` minute cron; active users (signed in ≤7d + ≥1 watchlist symbol); `VolumeAlertState` armed flag + UTC-day `dedupeKey`; email `VOLUME_ALERT_EMAIL_TEMPLATE` + inbox `type: 'volume_spike'`; shared Finnhub `getVolumeSnapshots`; no volume CRUD / no price-alert dialog changes
- **Auth edge middleware hardening** (`context/feature-specs/12-auth-middleware-hardening.md`) — root `middleware.ts` cookie gate redirects anonymous users to `/sign-in?next=<safe-path>`; sign-in/sign-up honor safe `next`; `(root)` layout still validates the real session and preserves `next`; matcher excludes `api` / static / `assets`; auth pages stay public; no Better Auth HTTP catch-all; no billing

## In Progress

- None

## Next Up

None. Recommended features from the prior analysis plan are complete. Observability/deliverability extras from the original “SaaS hardening” phrase stay **out of scope** unless a later request names them. **Billing remains out of scope.**

### Original analysis list (superseded ordering)

For traceability, the first ten recommendations before clarification answers were: Persistent Watchlist + page; Price Alerts (email); Notification Preferences; Watchlist quote enrichment; In-app news; Persist personalization profile; Personalized dashboard widgets; Volume spike alerts; TradingView symbol resolution; Auth edge middleware hardening.

## Open Questions

- None blocking — UserProfile schema implemented per spec `06`.

### Resolved (2026-09-15)

- **Finnhub licensing**: Personal/non-commercial for current scope. No assumed commercial redistribution rights. Keep API access server-side; do not expose the API key. Revisit with Finnhub before any monetized/customer-facing commercial product.
- **Auth HTTP catch-all**: Stay server-actions-only. No `app/api/auth/[...all]` unless a concrete requirement appears. Prefer simplest architecture for this portfolio project.
- **Middleware redirect**: Unauthenticated users → `/sign-in`. Preserve originally requested path when practical. Do not redirect everything to `/`.
- **Alert polling defaults**: Implemented in spec `08` — 60s Inngest cron, max 60 polls/hour/user; server-side evaluation + `isArmed` deduplication; 7-day active-user window.
- **Billing**: Out of scope. No Stripe/payment/subscription infrastructure. Revisit only if the project becomes a paid product.
- **README vs product**: Resolved via rebrand — README describes TradePilot as portfolio/demo with honest implemented vs planned status; no admin CMS or billing as shipped.
- **Signup preference persistence**: Resolved via spec `06` — `UserProfile` stores country/goals/risk/industry + notification flags; no parallel Mongoose User.

## Architecture Decisions

- **Product framing**: Portfolio/demo TradePilot app with polished SaaS-like UX; not a paid commercial product in the current scope.
- **Market data**: Finnhub free tier, personal/non-commercial use; server-side only; shared cache/throttle; never expose API keys to the client; prefer TradingView embeds for heavy charting.
- **Auth surface**: Server actions only — no HTTP catch-all route for now.
- **Middleware target**: Wired — anonymous users → `/sign-in` + safe return-path (`next`); not blanket `/`. Cookie presence only on the edge; `(root)` layout remains the session source of truth.
- **Alert channels**: Email + in-app via Inngest `price-alert-check` (price thresholds **and** automatic watchlist volume spikes); UserProfile toggles `alertEmail` / `alertInApp`; CRUD in spec `07`, evaluation in spec `08`, volume in spec `11`.
- **Digest email**: Default ON (opt-out); `dailyNewsEmail === false` excludes user from Inngest daily job; welcome email unaffected.
- **Dashboard meaning**: Logged-in user home at `/` — **no** separate admin/CMS workstream. Overview + quotes widgets are watchlist-driven (mapped TradingView symbols, cap 12); heatmap/timeline stay global market widgets; empty watchlist keeps static defaults.
- **Brand**: TradePilot user-facing everywhere; Inngest client id stays `signalist`.
- **Billing**: Explicitly out of scope for now.
- **Watchlist data**: Mongoose `Watchlist` with unique `{ userId, symbol }`; optional `tradingViewSymbol`; digest path resolves user by email from Better Auth `user` collection.
- **Symbol mapping**: Global Mongoose `SymbolMap` `{ symbol unique, tradingViewSymbol, exchange?, updatedAt }`; heuristic-first; AI via Inngest `app/symbol.map` only on first miss; no Gemini in page render.
- **User profile**: Mongoose `UserProfile` with unique `userId` (Better Auth id); personalization + notification prefs + `lastSignedInAt` for active-user gating.
- **Price alerts**: Mongoose `Alert` owned by session `userId`; max 20 per user; `enabled`, `isArmed`, `lastTriggeredAt` for evaluation; alerts persist even if symbol leaves watchlist.
- **Volume spikes**: Automatic for watchlist symbols (shared 2.0 × 10-day-average threshold); Mongoose `VolumeAlertState` `{ userId, symbol }` armed flag — **not** stored on price `Alert` documents; removing a watchlist symbol stops further volume alerts for it.
- **Background work**: Inngest owns welcome + daily digest + price-alert check (also volume spikes) + TradingView symbol mapping; Gemini model currently `gemini-2.5-flash-lite`.
- **Auth gate today**: Root middleware checks Better Auth session cookie presence; `(root)` layout still calls `auth.api.getSession` and redirects to `/sign-in` (with `next`) if the session is missing/invalid.
- **Email app URL**: Footers/CTAs use `BETTER_AUTH_URL` (fallback `NEXT_PUBLIC_BASE_URL`, then `http://localhost:3000`) via `{{appUrl}}` / `{{settingsUrl}}` in templates; Nodemailer `from` uses `NODEMAILER_EMAIL`.

## Session Notes

- Workspace folder: `trade-pilot`; npm package name: `trade-pilot`; Inngest app id: `signalist`.
- Only API route present: `app/api/inngest`.
- `WatchlistButton` persists add/remove via `lib/actions/watchlist.actions.ts` (session `user.id`, revalidate `/`, `/watchlist`, `/stocks/[symbol]`).
- `NAV_ITEMS` includes `/watchlist`; Search uses a dialog, not `/search`.
- Home `/` personalizes overview + quotes from the session watchlist (`lib/watchlist/dashboard-widget-symbols.ts`); add/remove revalidates `/`.
- Env expectations include MongoDB, Better Auth, Finnhub, Gemini, Nodemailer; see README / `.env` (do not commit secrets).
- Prior feature board: agent transcript [Feature recommendations](17ff167e-3747-46ab-8040-74d3539dee01); canvas may exist under the Cursor project `canvases/` folder.
- Spec completed: `context/feature-specs/01-tradepilot-rebrand.md`, `context/feature-specs/02-finnhub-cache-rate-limiter.md`, `context/feature-specs/03-persistent-watchlist.md`, `context/feature-specs/04-watchlist-quotes-and-news.md`, `context/feature-specs/05-notification-center.md`, `context/feature-specs/06-notification-preferences.md`, `context/feature-specs/07-price-alert-crud.md`, `context/feature-specs/08-price-alert-evaluation.md`, `context/feature-specs/09-tradingview-symbol-mapping.md`, `context/feature-specs/10-personalized-dashboard.md`, `context/feature-specs/11-volume-spike-alerts.md`, `context/feature-specs/12-auth-middleware-hardening.md`.
- Auth return path: `lib/auth/safe-next.ts` (`getSafeNextPath`); Next executes root `middleware.ts` (old `middleware/index.ts` helper folded in to avoid a duplicate `/middleware` route).
- Do not implement Next Up items until the user explicitly requests implementation.
- Notification write path for jobs: `lib/notifications/create-notification.ts` (not a client server action).
- Profile/settings: `lib/actions/profile.actions.ts` (`getMyProfile`, `updateMyProfile`); sign-up upsert in `lib/actions/auth.actions.ts`; digest filter in `lib/actions/user.actions.ts`.
- Alert CRUD: `lib/actions/alert.actions.ts`; UI: `AlertModal`, `AlertsList`, `AddAlertButton`.
- Price alert jobs: `lib/alerts/evaluate-price-alerts.ts`; Inngest `checkPriceAlerts` in `lib/inngest/functions.ts`; nodemailer `sendUpperPriceAlertEmail` / `sendLowerPriceAlertEmail`.
- Volume spike jobs: `lib/alerts/evaluate-volume-alerts.ts`; same `price-alert-check` cron; model `database/models/volume-alert-state.model.ts`; nodemailer `sendVolumeAlertEmail`.
- TV symbol mapping: `lib/tradingview/mapSymbol.ts` + `get-mapped-symbol.ts`; model `database/models/symbol-map.model.ts`; Inngest `mapTradingViewSymbol`.
