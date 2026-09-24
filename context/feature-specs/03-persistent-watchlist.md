# Persistent Watchlist + `/watchlist` Page

## Goal

Make watchlist add/remove persist in MongoDB for the signed-in user, wire `WatchlistButton` to those actions, and ship a session-gated `/watchlist` page using existing watchlist CSS.

## Existing / Reusable

- Mongoose `Watchlist` in `database/models/watchlist.model.ts`: `userId`, `symbol` (uppercase), `company`, `addedAt`; unique `{ userId, symbol }`
- Read helper `getWatchlistSymbolsByEmail` used by the daily digest — keep working
- `WatchlistButton` UI contract (local `useState` only; comments say persistence is not implemented)
- CSS: `.watchlist-*`, `.watchlist-empty-*`, `.watchlist-table`, `.add-alert`, etc. in `app/globals.css`
- Types: `WatchlistButtonProps`, `WatchlistTableProps`, `StockWithData`, `WATCHLIST_TABLE_HEADER`
- Nav item `{ href: '/watchlist', label: 'Watchlist' }` commented out in `lib/constants.ts`
- Stock page renders `<WatchlistButton … isInWatchlist={false} />` with `company={symbol}`
- Search results hardcode `isInWatchlist: false`
- Session gate: `app/(root)/layout.tsx` (`auth.api.getSession` → `/sign-in`)
- Auth result shape to match: `{ success, data | error }`

## New / Required

- Server actions: add, remove, list current user’s watchlist, check membership
- Persist from `WatchlistButton` (stock page and later table actions)
- `app/(root)/watchlist/page.tsx` (and table/empty components)
- Enable Watchlist in `NAV_ITEMS`
- Stock page + search should reflect real membership
- Session identity on every write (`session.user.id` as `userId`)

## Scope

### In scope

- CRUD-lite: create/delete rows; list for the current user
- `/watchlist` empty + populated table
- Remove from table (`showTrashIcon` / Action column)
- Idempotent add (unique index)

### Out of scope

- Live quotes, market cap, P/E, in-app news (spec `04`)
- Alert create/list (spec `07`) — Alert column may render a disabled/non-wired control or “—” 
- Notification center, prefs, dashboard personalization
- New persistence technology; no Better Auth User mongoose model
- Client Finnhub

## Current codebase state

- Model exists; **no create/delete actions**
- No `/watchlist` route
- Button toggles local state only; refresh loses it
- Digest can read symbols **if** rows exist, but the UI cannot create them

## Desired behavior

Signed-in user adds a symbol from the stock page; it survives refresh and appears on `/watchlist`. Removing it from the button or table deletes the Mongo row. Unique constraint prevents duplicates. Anonymous users never reach the page (existing layout gate).

## User flows

1. Open `/stocks/AAPL` → button shows Add (unless already saved).
2. Click Add → toast success → button shows Remove (red `.watchlist-remove`).
3. Refresh → still Remove.
4. Header **Watchlist** → `/watchlist` table includes AAPL.
5. Click Remove on the page or table → row gone; stock page shows Add.
6. Empty watchlist → empty state (existing `.watchlist-empty-container` pattern), with a way to open Search (existing `SearchCommand`).

## Functional requirements

1. **Identity:** Writes use Better Auth session `user.id`. Never trust a client-supplied `userId`.
2. **Add:** `symbol` uppercase/trim; `company` required string (from button/search name; stock page should pass a real name when available, else symbol).
3. **Remove:** by `symbol` for the session user.
4. **List:** current user, newest `addedAt` first.
5. **Membership:** helpers so stock page and `searchStocks` can set `isInWatchlist`.
6. **Duplicate add:** treat as success (already watched); do not 500 on unique index.
7. **Invalid symbol:** reject empty symbol.
8. **Digest path:** `getWatchlistSymbolsByEmail` remains the Inngest entry; do not break email lookup via Better Auth `user` collection.
9. **Revalidation:** after add/remove, `revalidatePath` for `/watchlist` and `/stocks/[symbol]` (and `/` if needed).
10. **Search:** when a session exists, map results with real `isInWatchlist`. Header currently calls `searchStocks()` without user context — pass the current user’s symbol set into search (either argument or lookup inside the action using session).

## UI / UX requirements

- Reuse `.watchlist-btn` / `.watchlist-remove` / icon variants; do not invent a second button system.
- Page layout: `.watchlist-container` grid is built for table + alerts. For this spec, table (or empty state) is enough; alerts column **omitted or empty placeholder** — do not fake alert CRUD.
- Table headers may use `WATCHLIST_TABLE_HEADER`. Quote columns (Price, Change, Market Cap, P/E) show **—** until spec `04`. Alert column **—** or disabled until spec `07`. Action = remove.
- Company cell should link to `/stocks/[symbol]`.
- Empty state: title + short description + Search CTA (existing classes `.empty-title`, `.empty-description`).
- Toasts via existing Sonner for success/failure.
- Loading: button `disabled` while the server action is in flight; prevent double-submit.
- Keep dark gray/yellow system; no purple-glow aesthetic.

## Data / model requirements

No schema change required unless you add optional `exchange` for later mapping (defer to spec `09`).

Continue using `connectToDatabase()` and the existing unique index.

## Server actions and boundaries

Put actions in `lib/actions/watchlist.actions.ts` (`'use server'`).

Suggested exports:

- `addToWatchlist({ symbol, company })`
- `removeFromWatchlist({ symbol })`
- `getCurrentUserWatchlist(): Promise<StockWithData[]>` (quote fields optional/absent)
- Keep `getWatchlistSymbolsByEmail`

Return `{ success, data | error }` like auth actions.

No REST route.

## Auth / authorization

- Session required for all writes and `/watchlist`.
- Users can only mutate their own rows (`userId` from session).
- Layout already redirects anonymous users to `/sign-in`. Root middleware is **not** required for this spec (spec `12`).

## Loading / empty / success / error / disabled

| State | Behavior |
| ----- | -------- |
| Empty list | Empty illustration/copy; Search CTA |
| Populated | Table with — for quote/alert columns |
| Action pending | Button disabled; no optimistic-only persistence (optimistic UI OK if rolled back on error) |
| Duplicate add | Success toast “Already in watchlist” or silent success |
| Not signed in | Cannot hit page; actions return error |
| DB error | Toast + log; do not leak Mongo internals |

## Edge cases

- Rapid double-click add
- Symbol casing `aapl` vs `AAPL`
- Stock page `company` currently equals symbol — acceptable fallback
- Watchlist row exists but stock page still passed `false` — must be fixed
- User deleted in Better Auth while rows remain — ignore orphan rows; do not create a parallel User model

## Constraints / invariants

- `{ userId, symbol }` uniqueness; symbols uppercase (`architecture.md`)
- Better Auth owns users; Watchlist only stores `userId` string
- Do not combine alert engine work in this unit
- Do not describe local button state as persistence

## Affected surfaces

- `lib/actions/watchlist.actions.ts`
- `components/WatchlistButton.tsx`
- `app/(root)/watchlist/page.tsx` (new)
- New presentational pieces e.g. `components/WatchlistTable.tsx` if needed
- `app/(root)/stocks/[symbol]/page.tsx`
- `lib/actions/finnhub.actions.ts` and/or Header — watchlist flags on search
- `lib/constants.ts` `NAV_ITEMS`
- `types/global.d.ts` if list/action types need cleanup (file currently **duplicates** `SearchCommandProps` — do not add a third copy; fix only if you touch that region)

## Dependencies

- **Depends on:** existing auth + Watchlist model (not spec `02`, though search may already use the cache)
- **Enables:** `04` quotes/news, `07` alert UI home, `09` mapping storage, `10` dashboard, `11` automatic volume on watchlist symbols

## Acceptance criteria

- [ ] Add from stock page writes a Mongo row for the session user
- [ ] Refresh preserves button state from DB
- [ ] `/watchlist` is in nav and lists the user’s symbols
- [ ] Empty state renders when there are no rows
- [ ] Remove from button and table deletes the row
- [ ] Duplicate add does not crash
- [ ] Search/popular results mark watched symbols
- [ ] `getWatchlistSymbolsByEmail` still works for Inngest
- [ ] Anonymous users still cannot use `(root)` pages
- [ ] Quote/alert columns are placeholders, not fake live data
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Manual: sign in → add → `/watchlist` → refresh → remove
- Confirm a second user does not see the first user’s rows
- `npm run test:db` only checks Mongo connectivity; optional

## Unresolved questions

None. Placeholder columns until `04`/`07` are intentional.
