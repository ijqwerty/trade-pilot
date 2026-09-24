# Watchlist Live Quotes + In-App News

## Goal

Enrich the `/watchlist` page with cache-backed Finnhub quotes (and related metrics) plus an in-app news section. TradingView remains the heavy charting surface.

## Existing / Reusable

- `/watchlist` page and Watchlist rows from spec `03`
- Shared Finnhub client/cache/limiter from spec `02` (`getQuotes`, `getNews`)
- CSS: `.watchlist-table`, `.watchlist-news`, `.news-item`, `.news-title`, `.news-summary`, `.news-cta`, `.news-tag`, `.news-meta`
- Types: `StockWithData`, `WatchlistNewsProps`, `MarketNewsArticle`
- Formatters: `formatPrice`, `formatChangePercent`, `getChangeColorClass`, `formatMarketCapValue`, `formatTimeAgo` in `lib/utils.ts`
- `WATCHLIST_TABLE_HEADER` already includes Price, Change, Market Cap, P/E
- `getNews` already caps at 6 articles with watchlist-symbol company news and general fallback

## New / Required

- Server-side enrichment of watchlist rows: `currentPrice`, `changePercent`, formatted fields, market cap, P/E when Finnhub provides them
- News block on `/watchlist` using `getNews(symbols)` for the current user’s symbols
- Loading/empty/error states for quote cells and news — never call Finnhub from the client

## Scope

### In scope

- Quote + basic fundamental columns on the watchlist table
- News cards under (or beside) the table using existing news CSS
- Soft failure: table still lists symbols if quotes fail

### Out of scope

- Alert CRUD (spec `07`)
- Personalized TradingView dashboard (spec `10`)
- Inngest jobs / emails
- New chart library
- Unbounded per-row polling or `setInterval` quote refresh

## Current codebase state

- After spec `03`, the table shows **—** for Price/Change/Market Cap/P/E
- `getNews` exists but is only used by Inngest digest, not the watchlist page
- No quote UI on `/watchlist`

## Desired behavior

On `/watchlist`, each row shows cached quote data when available. A news grid shows up to 6 articles related to watchlist symbols (else general news). Data comes from the shared cache (60s quotes, 300s news). Refreshing the page may update values; the page does **not** open a WebSocket or per-user Finnhub stream.

## User flows

1. User with symbols opens `/watchlist` → sees prices/changes when the cache/API allows.
2. User clicks a news headline → external article URL (`target=_blank`, `rel=noopener`).
3. User with empty watchlist → empty watchlist state from spec `03`; news may be omitted or show general market news (see below).
4. Finnhub/limiter failure → symbols still listed; quote cells “—”; news empty/error copy.

## Functional requirements

1. Load watchlist rows for the session user (spec `03`).
2. Collect unique symbols; call `getQuotes` (and profile/metrics **only** if needed for market cap / P/E). Prefer fields already implied by types:
   - `QuoteData.c` → price
   - `QuoteData.dp` → change percent
   - `ProfileData.marketCapitalization` → market cap (existing type)
   - P/E from Finnhub metric/financials **if** fetched via the shared client — do not add a third HTTP stack
3. If market cap / P/E would explode request volume, **omit extra Finnhub calls** and leave those columns “—” rather than breaking the limiter. Price + change are required; market cap / P/E are best-effort.
4. News: `getNews(symbols)` for the user’s symbols; reuse max 6 and fallback-to-general behavior.
5. Empty watchlist: do **not** fan out quote fetches. News: skip the news section (prefer this) rather than extra Finnhub calls for general news on an empty page.
6. All Finnhub work in the server page or a server action used by that page — not in `WatchlistButton`.
7. Do not refresh quotes on a timer. Optional: `revalidatePath` is enough; users refresh or navigate.

## UI / UX requirements

- Reuse `WATCHLIST_TABLE_HEADER` and `.watchlist-*` / `.news-*` classes.
- Positive change: existing green utility (`getChangeColorClass`); negative: red; missing: gray “—”.
- News cards: headline, source/time, summary, “Read” CTA in yellow (`text-yellow-500`).
- Do not wrap the page in a new card design system.
- Alerts column still placeholder until spec `07`.
- Keep `/` dashboard unchanged.

## Finnhub / caching

- Must use spec `02` helpers only
- Unique symbols only
- Respect the 50-symbol truncation/log behavior from `02` if a user somehow has more

## Auth

- Same `(root)` session gate as `/watchlist`

## Loading / empty / success / error

| State | Quotes | News |
| ----- | ------ | ---- |
| Empty watchlist | No quote fetch | Hide news section |
| Quotes loading (RSC) | Skeleton optional; static “—” until data is ready is OK because the page is a Server Component |
| Partial quotes | Fill successes; “—” failures |
| News empty array | Short empty copy inside `.watchlist-news` |
| News throw | Log; show “News unavailable” — do not crash the table |

## Edge cases

- Symbol with no Finnhub quote
- Stale 60s cache vs user expecting realtime — acceptable for this demo
- External news URL missing → skip card (`validateArticle` already requires url)
- Duplicate headlines — `getNews` already dedupes general news

## Constraints / invariants

- Server-side Finnhub only
- No per-user quote polling loop
- TradingView stays on stock/dashboard pages, not reimplemented here
- Personal/non-commercial Finnhub use

## Affected surfaces

- `app/(root)/watchlist/page.tsx`
- Watchlist table component(s) from `03`
- New `components/WatchlistNews.tsx` (or similar) matching `WatchlistNewsProps`
- `lib/actions/finnhub.actions.ts` / `lib/finnhub/*` (consume only)
- `lib/utils.ts` formatters (reuse)

## Dependencies

- **Depends on:** `02` Finnhub cache, `03` persistent watchlist
- **Enables:** richer watchlist UX; not required for alerts but shares quote helpers with `08`

## Acceptance criteria

- [ ] Watchlist rows show price and change when Finnhub/cache returns them
- [ ] Missing quotes render “—”, not a crash
- [ ] News section renders for non-empty watchlists using shared `getNews`
- [ ] Empty watchlist does not fire quote batches
- [ ] No Finnhub key in client bundles
- [ ] No interval/WebSocket quote polling
- [ ] Existing CSS classes reused
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Manual: add 1–2 symbols, open `/watchlist`, confirm numbers and news links
- Disable API key locally: table still lists symbols

## Unresolved questions

None. Market cap / P/E are explicitly best-effort so the limiter stays intact.
