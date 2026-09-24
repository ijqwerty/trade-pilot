# Price Alert Evaluation (Email + In-App)

## Goal

Evaluate persisted upper/lower price alerts in Inngest using shared Finnhub quotes, then notify through email and/or the in-app inbox according to user preferences. Alerts stay secondary: conservative, server-side, deduped.

## Existing / Reusable

- Alert documents from spec `07` (`enabled`, `alertType`, `threshold`, `lastTriggeredAt`)
- Spec `02` `getQuote` / `getQuotes` (60s cache, limiter)
- Spec `05` `createNotification` + inbox
- Spec `06` `alertEmail`, `alertInApp`, `lastSignedInAt` (default both channels ON)
- Unused templates: `STOCK_ALERT_UPPER_EMAIL_TEMPLATE`, `STOCK_ALERT_LOWER_EMAIL_TEMPLATE`
- Nodemailer transporter in `lib/nodemailer/index.ts`
- Inngest app + `app/api/inngest/route.ts` (must register the new function)
- Engineering defaults in `architecture.md`: ~60s cadence per active user, max 60 polls/hour/user, server-side evaluation + dedup, no unbounded per-user Finnhub polling

## New / Required

- Inngest checker (cron or repeated function) that selects **active** users and their enabled alerts
- Compare cached quote `c` to threshold
- Send email via existing templates when `alertEmail`
- Write inbox rows when `alertInApp`
- Dedup so a crossed threshold does not spam every tick
- Respect Finnhub shared cache — **unique symbols globally per tick**, not one HTTP call per user

## Scope

### In scope

- Upper: trigger when last price `>= threshold`
- Lower: trigger when last price `<= threshold`
- Email + in-app delivery
- Preference flags
- Active-user gating
- Dedup / `lastTriggeredAt`

### Out of scope

- Alert CRUD UI (already `07`)
- Volume spikes (`11`)
- Client-side watchers
- Billing, SMS, push
- Welcome/digest changes except not breaking them
- Better Auth catch-all

## Current codebase state

- After `07`, alerts exist but nothing reads them on a schedule
- Daily news is the only cron
- Alert HTML templates are unused

## Desired behavior

Once per minute, Inngest loads users who are **active**: at least one **enabled** alert **and** `lastSignedInAt` within **7 days**. For those users’ enabled alerts, resolve quotes through the shared cache (batch unique symbols). When a condition is newly satisfied, notify via allowed channels, set `lastTriggeredAt`, and skip until the condition has reset (see dedup).

Inactive users (no recent sign-in) are not polled.

## User flows

1. User creates upper alert AAPL @ 200 (spec `07`) and uses the app (sign-in stamps `lastSignedInAt`).
2. Quote crosses 200 → email (if `alertEmail`) and inbox item (if `alertInApp`).
3. Same tick/minute while still above 200 → **no** second send.
4. Price falls below 200, then crosses again → new notification.
5. User disables `alertEmail` → in-app only (and vice versa).
6. Both channels off → evaluate optionally skip user entirely (still OK to skip work).
7. User has not signed in for 8 days → no polling until they return.

## Functional requirements

1. **Active user (product decision):**
   - Has ≥ 1 enabled price alert
   - `lastSignedInAt >= now - 7 days`
   - Missing `lastSignedInAt` ⇒ **not** active (do not poll the whole user table)
2. **Cadence:** Inngest cron every minute (`* * * * *`) **or** equivalent. Document the schedule in code comments.
3. **Cap:** ≤ **60** quote-check cycles per user per hour. A 1-minute cron already equals 60/hour — do not add extra per-user loops inside a run.
4. **Shared quotes:** collect unique symbols across active users; `getQuotes(uniqueSymbols)` once per tick.
5. **Trigger rules:**
   - `upper`: `price >= threshold`
   - `lower`: `price <= threshold`
   - Missing/invalid quote → skip alert, log
6. **Dedup / reset:**
   - After fire, set `lastTriggeredAt`
   - Do not fire again while still on the triggered side of the threshold
   - Allow re-fire after price returns to the non-triggered side (upper: `price < threshold`; lower: `price > threshold`). Persist a simple `isArmed: boolean` **or** derive from last price vs threshold stored as `lastSeenPrice` — pick one and keep it on the Alert document.
   - `dedupeKey` for notifications: e.g. `price:${alertId}:${yyyy-mm-dd-hh}` is **not** enough if we want reset-based rearm; prefer `price:${alertId}:${lastTriggeredAt}` uniqueness plus armed flag
7. **Email:** wire templates with `symbol`, `company`, `currentPrice`, `targetPrice`, `timestamp`. From-name TradePilot (spec `01`). Respect `alertEmail === false`.
8. **In-app:** `createNotification` with type `price_upper` | `price_lower`, `href: /stocks/SYMBOL`, `dedupeKey` per firing. Respect `alertInApp === false`.
9. **Both false:** skip delivery; do not need to fetch that user if all flags false and no other reason.
10. **Errors:** one user/symbol failure must not abort the whole tick.
11. **No page-render evaluation.**

## Inngest behavior

- New function id kebab-case, e.g. `price-alert-check`
- Register in `app/api/inngest/route.ts` alongside welcome + digest
- Use `step.run` for fetch users, fetch quotes, deliver
- Do not run Gemini for price alerts
- Do not call Finnhub except through spec `02`

## Finnhub / caching / rate-limit

- Quotes TTL 60s means many users sharing AAPL cost **one** HTTP call per minute
- Never `getQuote` in a per-alert loop that bypasses batching
- If unique symbols exceed the spec `02` cap, process a stable subset and log (prefer symbols of most recently signed-in users)

## Notification / email

- Channel flags from UserProfile; missing profile ⇒ both ON (spec `06` defaults)
- Footer manage-preferences link from spec `06`
- Do not archive email HTML in Mongo

## Auth

- Jobs are trusted server context; they still must not notify the wrong `userId`

## Loading / empty / error (ops)

| Case | Behavior |
| ---- | -------- |
| No active users | Exit success, no Finnhub |
| No quotes | Skip triggers |
| SMTP failure | Log; still try in-app |
| Inbox insert failure | Log; still try email |
| User became inactive mid-way | Skip remaining delivery if detected |

## Edge cases

- Threshold equals price exactly → fire (gte/lte)
- User deletes alert after quote fetch → skip missing ids
- Inngest retry → idempotent `dedupeKey` / armed flag prevents double email
- Digest cron at 12:00 plus alert cron — limiter must absorb both (spec `02` 30/min budget)

## Constraints / invariants

- Server-side evaluation only
- 60s / 60-per-hour / 7-day active window
- No per-user Finnhub process
- Personal/non-commercial Finnhub
- Alerts are secondary — if limiter is exhausted, skip tick rather than hammering

## Affected surfaces

- `lib/inngest/functions.ts` (add function)
- `app/api/inngest/route.ts`
- `lib/nodemailer/index.ts` (sendUpper/Lower helpers)
- `lib/nodemailer/templates.ts` (already exist)
- Alert model fields for armed/lastSeen
- `database/models/alert.model.ts`
- Uses notification + profile + finnhub helpers

## Dependencies

- **Depends on:** `02`, `05`, `06`, `07`
- **Enables:** `11` volume evaluation pattern

## Acceptance criteria

- [ ] New Inngest function registered
- [ ] Crossing an upper/lower threshold sends email when `alertEmail`
- [ ] Crossing writes an inbox row when `alertInApp`
- [ ] No spam while price remains through the threshold
- [ ] Rearm after price returns
- [ ] Users without recent sign-in are not polled
- [ ] Unique symbols batched through the shared cache
- [ ] Page renders do not evaluate alerts
- [ ] Opt-out flags respected
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Create a lower alert far above current price (should fire) or upper far below
- Confirm one email + one notification
- Wait another minute: no duplicate
- Set `lastSignedInAt` old: no poll
- Toggle `alertEmail` false: inbox only

## Unresolved questions

None. 7-day window and 60s/60-per-hour are locked. Exact armed-flag field name is an implementation detail.
