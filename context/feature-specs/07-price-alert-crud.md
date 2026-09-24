# Price Alert CRUD (Models, Dialogs, Watchlist Sidebar)

## Goal

Let a signed-in user create, edit, and delete **upper/lower price alerts** for symbols they care about, persisted in Mongo, with UI on the watchlist page (and stock page entry). This spec does **not** evaluate prices or send email/in-app messages.

## Existing / Reusable

- Types: `Alert`, `AlertData`, `AlertModalProps`, `AlertsListProps`, `SelectedStock`
- Constants: `ALERT_TYPE_OPTIONS` (`upper` / `lower`), `CONDITION_OPTIONS` (greater/less — align UX to upper/lower; do not invent a third product type)
- CSS: `.alert-dialog`, `.alert-title`, `.alert-list`, `.alert-empty`, `.alert-item`, `.alert-name`, `.alert-details`, `.alert-company`, `.alert-price`, `.alert-actions`, `.alert-update-btn`, `.alert-delete-btn`, `.add-alert`, `.watchlist-alerts`
- `getAlertText` in `lib/utils.ts`
- shadcn `Dialog`, `Input`, `Button`, `Select`
- Watchlist page from spec `03`/`04` (alerts column currently placeholder)
- Unused email templates exist but are **not** wired here
- **No** Alert mongoose model and **no** alert actions today

## New / Required

- Mongoose `Alert` model
- Server actions: create, update, delete, list mine (optionally by symbol)
- `AlertModal` + alerts list on `/watchlist` right column
- Stock page control to open create-alert for that symbol
- Session-scoped ownership

## Scope

### In scope

- Upper/lower threshold alerts
- Watchlist sidebar list + empty state
- Edit/delete
- Validation (threshold must be a positive number)

### Out of scope

- Inngest evaluation, Finnhub polling, email, notification writes (spec `08`)
- Volume spikes (spec `11`, automatic — no extra CRUD)
- Billing, admin, CMS
- Client-side price watching

## Current codebase state

- CSS/types/constants/email HTML are scaffold only
- Watchlist table Alert column is placeholder after `03`/`04`

## Desired behavior

User clicks “Add alert” on a watchlist row or stock page, fills name + upper/lower + threshold, saves. Sidebar lists alerts with company, threshold copy (`getAlertText`), and edit/delete. Refresh preserves alerts. Nothing is emailed yet.

## User flows

1. `/watchlist` with symbols → Add alert on a row → dialog → save → item appears in `.watchlist-alerts`.
2. Empty alerts → `.alert-empty` copy.
3. Edit → dialog prefilled (`AlertModalProps.alertData`) → save.
4. Delete → confirm (simple confirm or destructive dialog) → gone.
5. `/stocks/[symbol]` → add alert for that symbol (company from page/watchlist).

## Functional requirements

1. **Model:**
   - `userId: string` indexed
   - `symbol: string` uppercase
   - `company: string`
   - `alertName: string`
   - `alertType: 'upper' | 'lower'`
   - `threshold: number` (store number, form may use string)
   - `enabled: boolean` default `true` (evaluation will skip `enabled: false`; CRUD should allow future disable — include the field even if the first UI always leaves it true)
   - `lastTriggeredAt?: Date` (owned by spec `08`; allow null now)
   - `createdAt` / `updatedAt`
2. Indexes: `{ userId, symbol }`, `{ userId, enabled }` for later jobs.
3. **Ownership:** all queries filter `userId` from session.
4. **Create/update validation:**
   - symbol non-empty
   - alertName non-empty, reasonable max length (e.g. 80)
   - alertType in `upper` | `lower`
   - threshold finite number `> 0`
5. **Delete:** by alert id + session user.
6. **List:** current user, optional `symbol` filter; newest first.
7. **Cap (engineering):** max **20** alerts per user. Exceeding returns a clear error toast.
8. Watchlist Alert column becomes the Add/Edit entry using `.add-alert`.
9. Do not evaluate `currentPrice` in this spec. List UI may show “—” for live price or reuse spec `04` quote cache for **display only** (no trigger logic).

## UI / UX requirements

- Dialog uses `.alert-dialog` / `.alert-title` and existing yellow/gray inputs (`focus:!border-yellow-500`)
- Upper/lower via `ALERT_TYPE_OPTIONS`
- Threshold numeric input
- List uses `.alert-list` / `.alert-item` / action buttons
- Empty: `.alert-empty`
- Layout: `.watchlist-container` → table `.watchlist` + sidebar `.watchlist-alerts`
- Do not add a second design system
- Toasts on success/error
- Pending submit disables the save button

## Server actions and boundaries

`lib/actions/alert.actions.ts`:

- `createAlert(input)`
- `updateAlert(id, input)`
- `deleteAlert(id)`
- `getMyAlerts(symbol?: string)`

No Inngest functions in this spec. No Finnhub required except optional display quotes already cached.

## Auth

- `(root)` session
- Cannot edit another user’s alert by guessing ids

## Loading / empty / success / error / disabled

| State | UI |
| ----- | -- |
| No alerts | Empty sidebar |
| Dialog open create | Blank name, type upper default, empty threshold |
| Dialog open edit | Prefill; auto-focus name or threshold |
| Invalid threshold | Inline error, no write |
| At 20 alerts | Create disabled + toast |
| Delete | Destructive styling (red) |

## Edge cases

- Alert for a symbol later removed from watchlist — **keep the alert** (user may still want it; stock page still works)
- Duplicate alerts same symbol/type/threshold — allowed unless you add a unique index; not required
- Stock page company fallback = symbol (existing)

## Constraints / invariants

- Alerts are secondary; keep CRUD small
- Server actions only
- Mongo/Mongoose
- No evaluation side effects on save (do not send test emails)

## Affected surfaces

- `database/models/alert.model.ts` (new)
- `lib/actions/alert.actions.ts` (new)
- `components/AlertModal.tsx` (new)
- `components/AlertsList.tsx` (new)
- `app/(root)/watchlist/page.tsx`
- `app/(root)/stocks/[symbol]/page.tsx`
- `types/global.d.ts` (existing alert types; avoid duplicate names)
- `lib/constants.ts` (already has options)

## Dependencies

- **Depends on:** spec `03` watchlist page (stock page also exists today)
- **Enables:** spec `08` evaluation

## Acceptance criteria

- [ ] Alerts persist in Mongo for the session user
- [ ] Create/edit/delete work from watchlist sidebar
- [ ] Stock page can create an alert for its symbol
- [ ] Empty and error states exist
- [ ] Other users cannot see or mutate the alerts
- [ ] No emails, notifications, or Inngest checkers added
- [ ] 20-alert cap enforced
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Manual CRUD on `/watchlist` and `/stocks/AAPL`
- Confirm refresh keeps alerts
- Confirm evaluation still does not run (no new Inngest function registered in `app/api/inngest/route.ts`)

## Unresolved questions

None. `lastTriggeredAt` exists for `08` but is unused here.
