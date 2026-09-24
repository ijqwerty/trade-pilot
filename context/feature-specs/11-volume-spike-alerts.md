# Volume Spike Alerts (Automatic Watchlist)

## Goal

Automatically notify **active** users when a **watchlist** symbol’s volume spikes versus its recent average. No extra alert-type CRUD. Deliver email + in-app using the same conservative engine pattern as price alerts.

## Existing / Reusable

- Watchlist symbols per user (spec `03`)
- Shared Finnhub client (spec `02`) — quote/metric/candle helpers
- Notification inbox + `createNotification` (spec `05`)
- Channel flags `alertEmail` / `alertInApp` (spec `06`)
- Active-user rule from spec `08`: enabled interest + **signed in within 7 days**
- Price-alert Inngest cadence, batching, limiter, dedup patterns (spec `08`)
- Unused `VOLUME_ALERT_EMAIL_TEMPLATE` (`{{symbol}}`, `{{company}}`, `{{currentVolume}}`, `{{averageVolume}}`, `{{volumeSpike}}`, `{{currentPrice}}`, `{{changePercent}}`, `{{alertMessage}}`, …)
- Price `Alert` CRUD is **not** the volume surface

## New / Required

- Shared engineering threshold evaluation on watchlist symbols
- Inngest work (extend `08` function or add `volume-alert-check` with the same 1-minute cron — prefer **one market-scan function** that already batches quotes, to save Finnhub budget)
- Email helper for the volume template
- Inbox `type: 'volume_spike'`
- Dedup per user+symbol per spike episode / UTC day

## Scope

### In scope

- Automatic watchlist volume spikes
- Email + in-app
- Shared threshold (not user-authored)

### Out of scope

- User-created volume alert dialogs
- Changing price-alert CRUD
- Per-user custom multipliers
- Client polling
- TradingView mapping (spec `09`) except using company/symbol strings already stored

## Current codebase state

- Volume template exists unused
- No volume checker, no average-volume cache usage in UI
- Product decision: **automatic for watchlist symbols**, shared threshold

## Desired behavior

For each active user (signed in within 7 days) who has watchlist symbols and at least one alert channel on, if a symbol’s latest session volume is **≥ 2.0 × 10-day average volume**, send at most one notification per user+symbol until volume falls back below the threshold (or until the next UTC day — see dedup). Users without watchlist symbols get no volume alerts. Users who opted out of both channels get none.

**Active user for volume:** signed in within 7 days **and** has ≥ 1 watchlist symbol. (They may have zero price alerts.)

## User flows

1. User watches TSLA, uses the app this week, leaves alert channels on.
2. TSLA volume prints at 2×+ 10-day average → email + inbox.
3. Continues spiking the same day → no spam.
4. Remove TSLA from watchlist → no further volume alerts for TSLA.
5. Disable `alertInApp` only → email still sends (if `alertEmail`).

## Functional requirements

1. **Threshold (engineering guidance, not a settings UI):**
   - `spike = currentVolume >= 2.0 * averageVolume`
   - `averageVolume` = Finnhub 10-day average trading volume when available (`/stock/metric` or equivalent via spec `02`)
   - `currentVolume` = latest daily bar volume (`/stock/candle` or quote volume if the shared client exposes it)
   - If average or current is missing → skip symbol
2. **Universe:** unique watchlist symbols among **active** users only; batch through spec `02`. Do not scan the whole market.
3. **Cadence:** same 1-minute job as price alerts if combined; still max 60 cycles/hour/user.
4. **Delivery:**
   - Email template `VOLUME_ALERT_EMAIL_TEMPLATE` when `alertEmail`
   - Inbox when `alertInApp` with `href: /stocks/SYMBOL`
5. **Dedup:** `dedupeKey` e.g. `volume:${userId}:${symbol}:${yyyy-mm-dd}` **or** armed-flag per user+symbol (like price alerts). Do not send every minute during a spike.
6. **No CRUD** for volume. Do not add `alertType: 'volume'` to the price Alert modal.
7. **Prefs:** same flags as price alerts. Digest flag is irrelevant.
8. Failures isolated per symbol/user.

## Inngest behavior

- Prefer extending the spec `08` market tick: one unique-symbol fetch, then evaluate price alerts **and** volume spikes
- If split, volume function must still use the shared cache (60s) so HTTP is not doubled
- Register any new function in `app/api/inngest/route.ts`
- No Gemini for volume

## Finnhub / caching

- Metric TTL 300s, candle/quote 60s (spec `02`)
- Unique symbols across users
- If limiter is exhausted, skip volume before adding new Finnhub endpoints

## Notification / email

- Fill template placeholders; `volumeSpike` can be a formatted multiple (`2.4x`)
- TradePilot branding from spec `01`
- Settings footer from spec `06`

## Auth

- Job is server-side; scope by watchlist `userId`

## Loading / empty / error

Ops-only: no UI beyond inbox/email.

| Case | Behavior |
| ---- | -------- |
| Empty watchlists | No volume work |
| Inactive users | Excluded |
| Metric missing | Skip symbol |
| Both channels off | Skip user |

## Edge cases

- First day of listing (no 10d average) → skip
- After-hours: use last session bar; do not invent extended-hours logic
- Symbol in watchlist and also has price alerts — both may fire independently with separate dedupe keys
- Very large watchlists — respect spec `02` unique-symbol cap

## Constraints / invariants

- No unbounded per-user polling
- Server-side only
- Automatic, shared threshold
- Mongo/Mongoose; no new DB product
- Alerts remain secondary

## Affected surfaces

- `lib/inngest/functions.ts` (extend or add)
- `app/api/inngest/route.ts`
- `lib/nodemailer/index.ts` + `VOLUME_ALERT_EMAIL_TEMPLATE`
- Spec `02` volume helpers (must exist)
- Notification types
- Optional tiny `VolumeAlertState` collection if armed flags should not live on Watchlist — **do not** overload price `Alert` documents for this automatic feature

## Dependencies

- **Depends on:** `02`, `03`, `05`, `06`, `08` (shared scan/delivery)
- **Enables:** complete alert story for the backlog

## Acceptance criteria

- [ ] No volume fields in the price-alert dialog
- [ ] Watchlist symbol at ≥ 2× 10d average notifies allowed channels once per episode/day
- [ ] Inactive users (no sign-in in 7 days) are not scanned
- [ ] Unique symbols batched through the shared Finnhub cache
- [ ] Removing a symbol stops future volume alerts
- [ ] Price-alert CRUD unaffected
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Temporarily lower threshold in a local-only debug path **or** pick a symbol currently spiking; do not leave a debug threshold in production code
- Confirm template renders
- Confirm dedup on the next cron tick

## Unresolved questions

None. **2.0 × 10-day average** is the recorded engineering default (same class of guidance as 60 polls/hour). Changing the multiplier later does not require a user-facing setting.
