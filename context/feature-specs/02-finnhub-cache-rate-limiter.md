# Finnhub Shared Cache + Rate Limiter

## Goal

Put all Finnhub HTTP access behind one server-side client with shared caching and throttling so later watchlist quotes, news, and alert jobs cannot stampede the free-tier limit or leak the API key.

## Existing / Reusable

- `lib/actions/finnhub.actions.ts`: `fetchJSON`, `getNews`, `searchStocks` (React `cache()` on search only)
- Per-request Next `fetch` revalidate already used: news `300s`, search `1800s`, profile2 `3600s`
- `POPULAR_STOCK_SYMBOLS` in `lib/constants.ts`
- Token today: `process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY`
- Callers: `components/Header.tsx` (popular search), `components/SearchCommand.tsx`, `lib/inngest/functions.ts` (`getNews`)

## New / Required

- A single Finnhub module (e.g. `lib/finnhub/client.ts` plus thin `lib/actions/finnhub.actions.ts` wrappers) that:
  - Reads **only** `FINNHUB_API_KEY` (server secret)
  - Rate-limits outbound Finnhub HTTP
  - Deduplicates in-flight requests
  - Caches responses by endpoint + params with explicit TTLs
  - Exposes `getQuote` (and metric/candle helpers needed later) even if no UI uses quotes yet
- Migrate `getNews` and `searchStocks` onto that client
- Stop treating `NEXT_PUBLIC_FINNHUB_API_KEY` as the supported pattern

## Scope

### In scope

- Shared client, cache, limiter
- Quote (and volume-related) fetch helpers for specs `04`, `08`, `11`
- Error mapping that does not leak the key or raw provider bodies to the client
- Existing search + news behavior preserved (same result shapes)

### Out of scope

- Watchlist UI, alerts, dashboard personalization
- Client-side Finnhub calls or `NEXT_PUBLIC_` Finnhub keys
- Redis or a new database product — use process memory + Next `fetch` cache; optional Mongo document cache only if required so Next and Inngest share quote freshness (see Data)
- Commercial redistribution of Finnhub data
- Per-user polling loops

## Current codebase state

- There is **no** shared limiter. Header search + command dialog + daily digest each call Finnhub independently.
- Empty search still fans out up to 10 `profile2` requests.
- `getNews(symbols)` fans out `company-news` per symbol, then general news fallback.
- No `quote` helper exists. Types already include `QuoteData` (`c`, `dp`) as unused UI types.
- `.env` currently has `NEXT_PUBLIC_FINNHUB_API_KEY` (do not commit secrets; spec requires server-only going forward).

## Desired behavior

All Finnhub HTTP goes through one function. Identical keys within TTL return cached data. Concurrent identical keys share one in-flight request. When the limiter is saturated, callers fail softly (empty search, thrown/logged news/quote errors) rather than retry storms.

## Functional requirements

1. **Secret:** Use `FINNHUB_API_KEY` only. Do not add new `NEXT_PUBLIC_FINNHUB_*` usage. Existing fallback may log a one-time warning if only the public env is set, then read it for local compat — but new code and README must document `FINNHUB_API_KEY` as the supported variable.
2. **Never** put the token in a client bundle, search params visible to the browser, or error toasts.
3. **Central `finnhubGet(path, params, ttlSeconds)`** (name may vary) that:
   - Builds `https://finnhub.io/api/v1/...` URLs
   - Injects `token` server-side
   - Applies cache + limiter
   - Parses JSON and throws on non-OK
4. **Rate limit (engineering default):** token bucket **≤ 30 outbound Finnhub HTTP calls per minute per process** (half of the typical 60/min free tier, leaving headroom for Inngest + Next). Queue or wait briefly; if wait would exceed ~2s, fail that call.
5. **In-flight coalescing:** same cache key in flight → one HTTP request.
6. **TTLs (engineering defaults):**

   | Resource | TTL | Notes |
   | -------- | --- | ----- |
   | `/quote` | 60s | Aligns with alert cadence |
   | `/stock/candle` or volume bars | 60s | For spec `11` |
   | `/stock/metric` (if used for 10d avg volume) | 300s | |
   | `/company-news`, `/news` | 300s | Match current news |
   | `/search` | 1800s | Match current search |
   | `/stock/profile2` | 3600s | Match current popular-symbol path |

7. **Public helpers (server-only):**
   - `searchStocks(query?: string): Promise<StockWithWatchlistStatus[]>` — keep signature; `isInWatchlist` may stay `false` until spec `03`
   - `getNews(symbols?: string[]): Promise<MarketNewsArticle[]>` — keep signature and max-6 / round-robin / general fallback behavior
   - `getQuote(symbol: string): Promise<QuoteData | null>` — new; uppercase symbol; return `null` on failure
   - `getQuotes(symbols: string[]): Promise<Record<string, QuoteData>>` — batch via cache; **do not** unbounded parallel HTTP; go through limiter
   - Volume helper used by spec `11` (e.g. latest volume + 10-day average) may be added here now so `11` does not open a second client
8. **Symbol normalization:** uppercase + trim before cache keys.
9. **Logging:** log status + path on failure; never log the token.

## Data / cache requirements

Prefer:

1. Next `fetch` `revalidate` for HTTP-level caching (already used)
2. Module-level memo for quote coalescing inside a Node/Inngest process

If Next and Inngest would otherwise double-fetch quotes every minute, a small Mongoose `FinnhubCache` collection (`key`, `payload`, `expiresAt`) is allowed. Do **not** introduce Redis or Prisma.

Do not store API keys in Mongo.

## Server actions and boundaries

- Keep `'use server'` actions as the UI entry for search/news.
- Heavy alert polling must call the same client from Inngest (specs `08`/`11`), not from page renders.
- No new Route Handler for Finnhub.

## Finnhub / API behavior

- Personal/non-commercial use only (see `architecture.md`).
- Free-tier: design for shared traffic, not one Finnhub stream per user.
- `getQuotes` must unique-ify symbols before fetching.

## Loading / empty / error

| Case | Behavior |
| ---- | -------- |
| Missing API key | Search returns `[]` (current). Quotes return `null`. News: log and throw or return `[]` consistently — prefer `[]` for UI callers, throw only inside Inngest steps that already catch. |
| 429 / limiter | Same as missing data for UI; log `rate_limited`. Do not busy-loop. |
| Invalid symbol | `null` / omit from map |
| Partial batch | Return whatever succeeded; omit failures |

## Edge cases

- Duplicate symbols in one batch
- Empty `symbols[]` for news → general news (existing)
- Very large symbol lists: cap unique quotes per call (engineering: **50**) and log truncation; later specs must not pass unbounded lists
- `profile2` missing `name` already dropped from popular search — keep that

## Constraints / invariants

- Finnhub access is server-side only (`architecture.md` invariant 2)
- No per-user unbounded polling (invariant 9 / alert defaults)
- Do not duplicate a second HTTP client in later specs
- Do not expose keys via `NEXT_PUBLIC_*` going forward

## Affected surfaces

- `lib/actions/finnhub.actions.ts` (refactor)
- New `lib/finnhub/*` (or equivalent)
- Callers should keep importing from `finnhub.actions.ts` if possible
- `types/global.d.ts` only if quote/metric types need tightening
- README env docs: `FINNHUB_API_KEY` (as part of honesty; rebrand spec may already touch README — this spec updates the Finnhub env guidance if `01` landed first)

## Dependencies

- **Depends on:** none required (`01` is independent)
- **Enables:** `04` quotes/news enrichment, `08` price evaluation, `11` volume spikes

## Acceptance criteria

- [ ] `grep` shows a single outbound Finnhub base URL usage path (shared helper)
- [ ] Search and daily-news still function with the same result caps
- [ ] `getQuote` / `getQuotes` exist and are server-only
- [ ] Repeating `getQuote('AAPL')` within 60s does not hit Finnhub twice in-process
- [ ] Limiter prevents >30 HTTP calls/min in a simple burst test (script or log)
- [ ] No new `NEXT_PUBLIC_FINNHUB` reads added
- [ ] Client components still call server actions, not Finnhub URLs
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Manual: Search dialog popular + query
- Optional: `npm run test:db` unchanged
- No unit runner is configured; do not add a test framework in this spec

## Unresolved questions

None. TTL and 30/min cap are engineering defaults, not product commitments (same spirit as alert 60s/60-per-hour guidance in `architecture.md`).
