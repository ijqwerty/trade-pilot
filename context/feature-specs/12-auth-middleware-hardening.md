# Auth Edge Middleware + SaaS Hardening

## Goal

Activate Next.js root middleware so anonymous users hitting authenticated product URLs are redirected to `/sign-in` with their requested path preserved, then returned after sign-in. Keep auth **server-actions-only**. No billing.

## Existing / Reusable

- Helper at `middleware/index.ts`:
  - Uses `getSessionCookie` from `better-auth/cookies`
  - If cookie missing → `NextResponse.redirect(new URL("/", request.url))` (**wrong target** vs product decision)
  - Matcher excludes `api`, `_next/static`, `_next/image`, `favicon.ico`, `sign-in`, `sign-up`, `assets`
  - **Not wired** — there is no root `middleware.ts`, so Next never runs it
- Real session gate today: `app/(root)/layout.tsx` calls `auth.api.getSession` and redirects to `/sign-in`
- Auth layout redirects signed-in users from `/sign-in` and `/sign-up` to `/`
- Sign-in page **always** `router.push('/')` on success (`app/(auth)/sign-in/page.tsx`)
- Sign-up also `router.push('/')`
- Only Route Handler: `app/api/inngest`
- Product decision: unauthenticated → `/sign-in`, preserve return path; do **not** blanket-redirect to `/`
- Product decision: **no** `app/api/auth/[...all]` unless a concrete HTTP requirement appears
- Billing explicitly out of scope

## New / Required

- Root `middleware.ts` that Next actually executes (re-export or replace `middleware/index.ts`)
- Redirect anonymous (no session cookie) to `/sign-in?next=<safe-path>`
- Sign-in (and sign-up if they landed with `next`) honor that path after success
- Open-redirect protection
- Layout **keeps** validating the real session (cookie ≠ valid session)

## Scope

### In scope

- Edge middleware activation
- Return path round-trip
- Matcher that never blocks Inngest or static/auth assets
- Safe internal `next` paths only

### Out of scope

- Stripe/subscriptions/plans
- Better Auth catch-all HTTP route
- Sentry/APM/observability product
- New rate-limit UX beyond what spec `02` already logs
- Replacing the layout session check
- MFA / OAuth
- Email deliverability vendor changes

## Current codebase state

- Middleware helper unused and redirects to `/`
- Deep links like `/watchlist` or `/stocks/AAPL` for anonymous users: layout sends them to `/sign-in` **without** remembering the URL
- After login they always land on `/`

## Desired behavior

Anonymous request to `/watchlist` → `/sign-in?next=/watchlist` (or equivalent). After successful sign-in → `/watchlist`. Anonymous request to `/sign-in` is public. `/api/inngest` stays reachable. Invalid cookie still fails at the layout and goes to `/sign-in`.

## User flows

1. Logged-out user opens `/stocks/MSFT` → sign-in page → success → stock page.
2. Logged-out user opens `/` → sign-in (`next=/` or omit and default `/`).
3. Logged-in user opens `/sign-in` → auth layout still sends them to `/` (existing). If you must preserve `next` for already-signed-in users hitting sign-in with a query, redirect to the safe `next` instead of always `/` — allowed polish.
4. Logged-out user opens `/api/inngest` → not redirected by middleware (Inngest handshake works).

## Functional requirements

1. Add `middleware.ts` at the project root (Next convention). Reuse matcher intent from `middleware/index.ts`.
2. If **no** session cookie:
   - Allow public: `sign-in`, `sign-up`, `api`, static, `assets`, `favicon.ico`
   - Otherwise redirect to `/sign-in?next=<pathname+search>`
3. If session cookie **exists**: `next()` (do not validate the full session on the edge).
4. **Safe `next`:**
   - Must start with `/`
   - Must not start with `//`
   - Must not include `http:` / `https:`
   - Disallow `/sign-in` and `/sign-up` as return targets (avoid loops) — use `/` instead
   - Default `/` if missing/unsafe
5. Sign-in client page: read `next` from `useSearchParams`, `router.push(safeNext)` on success.
6. Sign-up: if `next` present and safe, honor it; else `/`.
7. Layout anonymous redirect should also append `next` when practical so users who skip middleware (or have a cookie but invalid session) still return.
8. Do **not** add Better Auth catch-all.
9. Do **not** add payment code.
10. Matcher must exclude `api` so Inngest `GET/POST/PUT` succeed.

## Auth / authorization

- Still no roles
- Middleware is cookie presence only (Better Auth recommended pattern)
- Layout remains the authorization source of truth for `(root)`

## UI / UX requirements

- No new marketing pages
- Sign-in form unchanged aside from redirect target
- Do not flash the dashboard for anonymous users

## Loading / empty / error

| Case | Behavior |
| ---- | -------- |
| Safe next | Navigate there after auth |
| Unsafe next | `/` |
| Invalid session + cookie present | Middleware allows; layout redirects to sign-in (include `next`) |
| Sign-in failure | Existing toast; stay on form; keep `next` in the URL |

## Edge cases

- `next=/watchlist?foo=1` — preserve search if you include `search` in the stored path; strip hash
- `next=https://evil.com` — reject
- `next=/sign-in?next=/watchlist` — collapse to `/`
- Trailing encoded slashes / `%2F%2F` — treat as unsafe if they decode to `//`
- Auth pages must remain usable without a cookie

## Constraints / invariants

- Authenticated product UI stays under `app/(root)/` and session-gated
- Edge redirect target is `/sign-in`, not `/`
- Server-actions-only auth
- No billing
- Finnhub keys still server-side (not this spec’s job beyond not introducing `NEXT_PUBLIC_` auth secrets)

## Affected surfaces

- `middleware.ts` (new root)
- `middleware/index.ts` (fix redirect + `next` query; or fold into root file)
- `app/(auth)/sign-in/page.tsx`
- `app/(auth)/sign-up/page.tsx` (honor `next` if present)
- `app/(root)/layout.tsx` (redirect URL includes `next`)
- Possibly `app/(auth)/layout.tsx` signed-in redirect

## Dependencies

- **Depends on:** Better Auth cookie helper (exists). Stronger demo if `/watchlist` exists (`03`) for return-path QA
- **Enables:** defense in depth for all later `(root)` routes (`/settings`, `/watchlist`, `/stocks/...`)

## Acceptance criteria

- [ ] Root middleware is actually executed by Next
- [ ] Anonymous `/watchlist` (or `/stocks/AAPL`) lands on `/sign-in` with return path
- [ ] Successful sign-in returns to that path
- [ ] Unsafe `next` cannot leave the origin
- [ ] `/api/inngest` is not redirected
- [ ] `/sign-in` and `/sign-up` remain public
- [ ] Layout still rejects missing/invalid sessions
- [ ] No `app/api/auth/[...all]`
- [ ] No Stripe/billing
- [ ] Signed-in users are not bounced to `/` by middleware
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Logged out: visit `/watchlist` → sign-in → success → `/watchlist`
- Logged out: visit `/sign-in` → page renders
- Logged in: visit `/` → dashboard
- Hit `/api/inngest` (Inngest dev) still works
- Try `?next=https://example.com` after login → `/`

## Unresolved questions

None. Observability/deliverability extras from the original “SaaS hardening” phrase stay **out of scope** unless a later request names them.
