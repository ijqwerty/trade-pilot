# In-app Notification Center

## Goal

Add a persisted in-app inbox (header entry, list, unread count, mark-read) so later alert jobs can deliver alongside email. Shipping this spec with an empty inbox is expected.

## Existing / Reusable

- Header is a Server Component (`components/Header.tsx`) with logo, `NavItems`, `UserDropdown`
- Global Sonner toasts (not a substitute for an inbox)
- shadcn `Popover`, `DropdownMenu`, `Button`, `ScrollArea` is **not** installed — use `Popover` or `DropdownMenu` rather than a new design system
- Dark header `.header` / `.header-wrapper`
- No Notification model, routes, or bell UI exist today

## New / Required

- Mongoose `Notification` model
- Server actions: list, unread count, mark one read, mark all read
- Header bell + panel (client popover is OK)
- Empty, loading, error, unread badge states
- Stable helper `createNotification` for specs `08` and `11` (may go unused until then)

## Scope

### In scope

- Per-user notifications stored in Mongo
- Header UI on authenticated chrome
- Read/unread
- Link to an internal path when `href` is present (e.g. `/stocks/AAPL`)

### Out of scope

- Email sending
- Price/volume evaluation
- Preferences (spec `06`)
- WebSockets, SSE, or service workers
- Admin blast notifications
- Billing

## Current codebase state

- In-app notification center **does not exist** (`project-overview.md`)
- Header has no bell
- Alert email templates exist unused; they are not inbox items

## Desired behavior

Signed-in users see a bell in the header. Unread count badge when `unread > 0`. Opening the panel lists newest first. Empty copy explains that alerts will appear here. Clicking an item marks it read and navigates if `href` is set. No realtime push; a refresh or re-open can pick up new rows.

## User flows

1. User with zero notifications → bell, no badge, empty panel.
2. (Later specs) Job inserts a row → next navigation/refresh shows badge.
3. User opens panel → sees items; click → read + optional navigate.
4. “Mark all as read” clears the badge.

## Functional requirements

1. **Model** (Mongoose, `database/models/`):
   - `userId: string` (Better Auth user id), indexed
   - `type: string` (e.g. `price_upper` | `price_lower` | `volume_spike` — keep extensible)
   - `title: string`
   - `body: string`
   - `symbol?: string` (uppercase if present)
   - `href?: string` (internal path only)
   - `readAt?: Date | null`
   - `createdAt: Date`
   - Optional `dedupeKey?: string` unique with `userId` for later alert dedup
2. **Do not** create a Mongoose User model.
3. **List:** session user’s items, newest first, cap **50** in the panel.
4. **Unread count:** `readAt` missing/null.
5. **Mark read / mark all read:** session user only.
6. **`createNotification`:** server-only helper for Inngest; not a public client action. Validate `userId`. If `dedupeKey` collides, skip insert (idempotent).
7. **`href`:** allow only in-app paths starting with `/` and not `//` (open-redirect safe). External URLs not stored as `href` (news stays on the watchlist page).
8. No polling interval faster than **60s** if a light client refresh is added; prefer refresh on popover open (server action) only.

## UI / UX requirements

- Place the bell **between nav and user menu** on desktop; keep it reachable in the user dropdown row on small screens if header space is tight (do not drop it on mobile).
- Lucide `Bell` is consistent with existing `LogOut` usage.
- Badge: small yellow accent, not a new color system.
- Panel: dark `gray-800` / `gray-700` surfaces, `gray-600` border, `gray-400` text — match dropdown.
- Unread items slightly emphasized; read items muted (`gray-500`).
- Empty: “No notifications yet” + one line that price/volume alerts will show up here.
- Do not use alert-dialog CSS for the inbox; those classes are for price-alert CRUD (`07`).
- Do not add a standalone `/notifications` page unless the popover is clearly insufficient — **prefer header popover only** for this portfolio app.

## Server actions and boundaries

`lib/actions/notification.actions.ts`:

- `getMyNotifications()`
- `getMyUnreadCount()`
- `markNotificationRead(id)`
- `markAllNotificationsRead()`

Header may fetch unread count on the server and pass it into a small client popover.

Keep Inngest as the writer for alert fan-out later; this spec only needs the write helper.

## Auth / authorization

- Session required
- Users read/write only their `userId`
- No role/admin inbox

## Loading / empty / success / error / disabled

| State | UI |
| ----- | -- |
| Loading list | Short spinner inside panel (Loader2 already used in search) |
| Empty | Empty copy |
| Error | “Couldn’t load notifications” |
| Mark-all with 0 unread | Hidden or disabled |
| Badge 0 | No badge |

## Edge cases

- Very long `body` — clamp in UI (`line-clamp`)
- Missing symbol
- Stale count after mark-read — re-fetch on action success
- Duplicate `dedupeKey` from a retried job — no second row

## Constraints / invariants

- Mongo/Mongoose only
- Better Auth remains the user source
- No Finnhub in this spec
- No billing/CMS

## Affected surfaces

- `database/models/notification.model.ts` (new)
- `lib/actions/notification.actions.ts` (new)
- `components/Header.tsx`
- New `components/NotificationBell.tsx` (or similar)
- `types/global.d.ts` — add `Notification` types **without** colliding with the existing `Alert` type name
- `app/(root)/layout.tsx` only if the bell needs user id already passed (Header already receives `user`)

## Dependencies

- **Depends on:** authenticated header (exists)
- **Enables:** `06` in-app channel toggle meaning, `08` / `11` in-app delivery

## Acceptance criteria

- [ ] Notification documents persist in Mongo
- [ ] Header shows bell; empty state works
- [ ] Unread badge matches DB
- [ ] Mark one / mark all read works and is user-scoped
- [ ] `createNotification` is server-only and idempotent on `dedupeKey`
- [ ] No websocket
- [ ] `href` cannot redirect off-site
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Manual empty inbox
- Temporarily call `createNotification` from a server action or Inngest test event, then confirm UI (remove any temporary trigger before finishing)

## Unresolved questions

None. Realtime transport is explicitly out of scope.
