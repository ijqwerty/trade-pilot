# Personalized Logged-in Dashboard

## Goal

Personalize the signed-in home at `/` using the user’s watchlist (mapped TradingView symbols) while keeping the dark market-widget workspace. This is **not** an admin/CMS.

## Existing / Reusable

- `app/(root)/page.tsx` composes four static TradingView embeds: market overview, heatmap, timeline/stories, market quotes
- Configs in `lib/constants.ts` (`MARKET_OVERVIEW_WIDGET_CONFIG`, `HEATMAP_WIDGET_CONFIG`, `TOP_STORIES_WIDGET_CONFIG`, `MARKET_DATA_WIDGET_CONFIG`)
- Layout: `.home-wrapper`, `.home-section` grids
- `TradingViewWidget` client wrapper
- **Dead import:** `sendDailyNewsSummary` is imported on the home page and **never called** — remove it when touching the file
- Watchlist from spec `03`
- Mapped symbols from spec `09`
- UI rule: keep `/` focused on market widgets; do not build a dense admin console (`ui-context.md`)
- `context/architecture.md`: “dashboard” means logged-in user home at `/`

## New / Required

- Server page loads the current user’s watchlist
- When the watchlist has symbols, feed those (mapped) tickers into the widgets that accept a symbol list (overview + quotes at minimum)
- When empty, **keep the current static configs** (not a blank admin empty-state wall)
- Optional short heading like “Your watchlist” only if it does not push widgets into a card forest

## Scope

### In scope

- Watchlist-driven TradingView configs on `/`
- Empty watchlist → existing default widgets
- Cleanup dead Inngest import

### Out of scope

- Admin CMS, user analytics, publishing news, managing the global stock catalog
- Recreating charts in-app (no Chart.js/Lightweight Charts project)
- Alert inbox on the dashboard (header bell from `05` is enough)
- Billing
- Signup-goal-based stock picking (profile fields exist in `06` but this dashboard is **watchlist-driven**, not questionnaire-driven)

## Current codebase state

- Dashboard is 100% hardcoded symbols
- Home is a Server Component with no session usage of its own (layout already gates)
- Watchlist data is not read here

## Desired behavior

User with watchlist symbols sees overview/quotes widgets emphasizing those names (TradingView `EXCHANGE:SYMBOL`). User with no watchlist sees today’s defaults. Heatmap/stories may remain global market widgets if they do not accept a personal list cleanly — do not break them.

## User flows

1. New user lands on `/` → same four widgets as today.
2. User adds AAPL/MSFT → returns to `/` → overview/quotes include those mapped symbols.
3. User clears watchlist → defaults return.

## Functional requirements

1. Load session user watchlist in `app/(root)/page.tsx` (or a small server helper).
2. Map each row through spec `09` (`tradingViewSymbol` or resolver). Skip rows that still have no usable symbol.
3. **Market overview + market quotes:** rebuild `symbols` / tabs from the user’s list (cap **6–12** symbols for widget readability; if more, take most recently `addedAt`).
4. **Heatmap + timeline:** keep default configs unless the widget API clearly supports a personal universe without extra Finnhub — default is keep static.
5. Empty watchlist: exact current configs (post-rebrand strings only).
6. Do not fetch Finnhub quotes on `/` for this spec (spec `04` covers watchlist page). TradingView loads its own data in the iframe/script.
7. Remove unused `sendDailyNewsSummary` import.
8. Do not start Inngest from the page.

## UI / UX requirements

- Preserve `.home-wrapper` / `.home-section` / `custom-chart`
- Dark theme, teal TradingView accents already in configs
- No extra KPI card grid, no tables of all users, no CMS filters
- Optional one-line subtitle if watchlist-driven (“Showing your watchlist”) — muted `gray-500`
- Nav “Dashboard” continues to `/`

## Auth

- Existing `(root)` gate
- Personalization is per session user only

## Loading / empty / success / error

| State | Behavior |
| ----- | -------- |
| Empty watchlist | Static widgets (success path) |
| Watchlist load fail | Log; fall back to static widgets |
| Mapping missing | Use raw `SYMBOL` in the widget (TradingView often accepts it) |
| Too many symbols | Cap + ignore the rest |

## Edge cases

- Watchlist symbols not US-listed — mapping spec should supply prefixes
- Widget script fails — existing TradingView behavior
- User A must never see user B’s list

## Constraints / invariants

- No admin/CMS subsystem
- No billing
- TradingView is the charting surface
- No Finnhub in this page unless already cached mapping needs profile2 (prefer stored mapping)

## Affected surfaces

- `app/(root)/page.tsx`
- `lib/constants.ts` (helpers to clone configs with a symbol list, rather than mutating shared defaults in place)
- Watchlist read actions from `03`
- Mapping from `09`

## Dependencies

- **Depends on:** `03` watchlist, `09` mapping
- **Enables:** a portfolio-complete home; no further specs require it

## Acceptance criteria

- [ ] Empty watchlist dashboard matches the current four-widget layout
- [ ] Non-empty watchlist personalizes overview and/or quotes using mapped symbols
- [ ] No CMS/admin UI
- [ ] Dead `sendDailyNewsSummary` import removed
- [ ] User-specific: two accounts do not share personal lists
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Manual: empty vs populated watchlist
- Confirm heatmap still renders
- Confirm `/` is still session-gated

## Unresolved questions

None. Heatmap/timeline remaining global is an explicit allowed default.
