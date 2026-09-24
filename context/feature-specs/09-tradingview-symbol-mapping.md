# TradingView Symbol Mapping

## Goal

Resolve Finnhub-style symbols (e.g. `AAPL`) to TradingView `EXCHANGE:SYMBOL` identifiers, persist/cache the mapping, and use it on stock widgets and later the personalized dashboard. TradingView stays the charting surface.

## Existing / Reusable

- Stock page passes raw `symbol` into widget configs (`SYMBOL_INFO_WIDGET_CONFIG(symbol)`, etc.) — often works for US tickers, brittle for prefixed/international symbols
- Dashboard widgets already use `NASDAQ:AAPL` / `NYSE:…` in static `lib/constants.ts` configs
- Unused `TRADINGVIEW_SYMBOL_MAPPING_PROMPT` in `lib/inngest/prompts.ts`
- Watchlist stores `symbol` + `company` (spec `03`)
- Search results include `exchange` on `Stock` (`searchStocks` mapping)
- Inngest Gemini via `step.ai` (`gemini-2.5-flash-lite`)
- Spec `02` cache for any Finnhub profile lookup used as mapping input

## New / Required

- A server-side resolver: heuristic first, optional AI fallback using the existing prompt
- Persistence of the resolved `tradingViewSymbol` (watchlist document and/or a small mapping collection)
- Stock detail widgets consume the mapped symbol when available
- No client Finnhub; no new chart stack

## Scope

### In scope

- Helper `resolveTradingViewSymbol({ symbol, company, exchange })`
- Cache/store results
- Wire `/stocks/[symbol]` widgets
- Prepare data for spec `10` (dashboard)

### Out of scope

- Personalized dashboard layout (spec `10`)
- Volume alerts
- Replacing TradingView with a custom chart
- Calling Gemini from a Server Component render (use heuristic on-request; AI only in Inngest or a cached background step)

## Current codebase state

- Mapping prompt is unused
- Stock page: `symbol.toUpperCase()` only
- Watchlist has no `tradingViewSymbol` field unless added here

## Desired behavior

When a user opens `/stocks/AAPL`, widgets use `NASDAQ:AAPL` (or whatever was resolved) if known. If unknown, fall back to the raw symbol (today’s behavior) and enqueue/store a resolution without blocking the page on Gemini.

## User flows

1. Search → stock page: charts still render immediately (heuristic or raw fallback).
2. If AI is needed, Inngest fills `tradingViewSymbol`; subsequent loads use it.
3. Adding to watchlist stores mapping when already known.

## Functional requirements

1. **Heuristic table / rules (required, must work offline from Gemini):**
   - US common stocks: map exchange strings from Finnhub/search (`NASDAQ`, `NYSE`, `NYSE NKT`, `AMEX`, etc.) → `NASDAQ:AAPL`, `NYSE:IBM`
   - If exchange is missing, use a small built-in map for `POPULAR_STOCK_SYMBOLS` where obvious
   - If still unknown, return `SYMBOL` unchanged (current behavior)
2. **Confidence:** return `{ tradingViewSymbol, source: 'heuristic' | 'ai' | 'fallback' }`
3. **Persistence:** 
   - Prefer fields on Watchlist: `tradingViewSymbol?: string`
   - Plus a global `SymbolMap` collection `{ symbol unique, tradingViewSymbol, exchange?, updatedAt }` so stock pages without watchlist still benefit
4. **AI fallback (optional but should use the existing prompt if Gemini is configured):**
   - Inngest function `map-tradingview-symbol` on event `app/symbol.map` 
   - Input: symbol, company, exchange, currency/country if cheaply available from cached `profile2`
   - Parse JSON only; validate `EXCHANGE:SYMBOL` shape; ignore low-confidence if heuristic already produced a prefixed symbol
   - Never block page render on this
5. **Stock page:** `const tvSymbol = mapped ?? symbol.toUpperCase()` passed into widget configs.
6. **Do not** call Finnhub from the client to “guess” exchange.

## UI / UX requirements

- No new mapping UI
- Widgets keep existing dark/transparent configs
- If mapping is wrong, user still sees TradingView’s own symbol handling — acceptable for demo; do not build a manual override editor

## Inngest / AI

- Reuse `TRADINGVIEW_SYMBOL_MAPPING_PROMPT`
- Register the function only if implemented
- Rate: map on first miss, not every page view (cache)

## Finnhub

- Optional `profile2` via spec `02` for exchange/country — cached 3600s
- Do not add a second client

## Auth

- Mapping data is not secret; still only fetched server-side because profile2 uses the API key
- Stock page remains session-gated by `(root)` layout

## Loading / empty / error

| Case | Behavior |
| ---- | -------- |
| Cache hit | Use stored TV symbol |
| Heuristic hit | Use immediately; persist |
| AI fail | Keep heuristic/raw |
| Invalid AI JSON | Log; ignore |

## Edge cases

- `FB` vs `META` — do not invent rename tables beyond heuristic; AI may help
- Duplicate mapping writes — upsert
- International suffixes (`BARC.L`) — prompt already describes LSE examples; heuristic may pass through to AI

## Constraints / invariants

- TradingView remains primary charting (`architecture.md`)
- No Gemini in page render
- Server-side Finnhub only
- Do not combine dashboard redesign here

## Affected surfaces

- `lib/utils.ts` or `lib/tradingview/mapSymbol.ts` (new helper)
- `database/models/` watchlist and/or `symbol-map.model.ts`
- `app/(root)/stocks/[symbol]/page.tsx`
- `lib/inngest/prompts.ts` (consume)
- `lib/inngest/functions.ts` + `app/api/inngest/route.ts` if AI path ships
- Watchlist add path may stamp mapping

## Dependencies

- **Depends on:** spec `03` if stamping watchlist; spec `02` if using profile2
- **Enables:** spec `10` personalized dashboard widgets

## Acceptance criteria

- [ ] Stock widgets receive an `EXCHANGE:SYMBOL` when heuristic/cache knows it
- [ ] Raw symbol fallback still renders charts
- [ ] Gemini is not invoked during the RSC render path
- [ ] Mapping is persisted and reused
- [ ] Existing unused prompt is used if AI fallback ships
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Open `/stocks/AAPL` and confirm widget `symbol` is prefixed (view generated config or TradingView header)
- Open an unknown ticker: page still loads
- Repeat load: no extra AI events

## Unresolved questions

None. Heuristic-first + optional AI is the specified approach.
