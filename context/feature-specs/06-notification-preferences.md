# Notification Preferences, Digest Opt-out, and Signup Profile

## Goal

Persist signup personalization (country, goals, risk, industry) on a Mongoose profile, let users control digest and alert channels, and stop the daily news job from treating “has an email” as consent forever — **default remains ON (opt-out)**.

## Existing / Reusable

- Sign-up form already collects `country`, `investmentGoals`, `riskTolerance`, `preferredIndustry` (`app/(auth)/sign-up/page.tsx`)
- `signUpWithEmail` sends those fields only on `app/user.created` — **not stored**
- Better Auth user: `id`, `name`, `email` (password hashes in auth collections)
- `getAllUsersForNewsEmail` reads Better Auth `user` and returns everyone with email+name
- Daily Inngest job `daily-news-summary` emails all of those users
- News email footer has a non-functional `href="#"` Unsubscribe link
- Select options: `INVESTMENT_GOALS`, `RISK_TOLERANCE_OPTIONS`, `PREFERRED_INDUSTRIES`
- User dropdown: profile display + Logout only
- Notification center (spec `05`) for the meaning of “in-app alerts”
- **No** UserProfile / NotificationPreference models today
- **Do not** add a parallel Mongoose User that duplicates Better Auth

## New / Required

- Mongoose `UserProfile` keyed by Better Auth `userId`
- Write profile on sign-up; backfill defaults for existing users on first read
- Settings UI (session-gated) to edit personalization + notification toggles
- Daily news job filters `dailyNewsEmail !== false` (default ON)
- Email footers link to the in-app settings path (session required) — **no tokenized one-click unsubscribe**
- `lastSignedInAt` on the profile for spec `08` active-user definition

## Scope

### In scope

- Profile persistence
- Digest email opt-out
- Alert email / in-app toggles (consumed by spec `08`)
- Settings page + entry from user dropdown
- Digest job filter
- Footer “Manage preferences” / Unsubscribe → `/settings` (or `/settings/notifications`)

### Out of scope

- Tokenized email unsubscribe without login
- Changing digest content generation (Gemini prompt) except skipping opted-out users
- Price alert CRUD/evaluation
- Admin/CMS
- Billing
- Better Auth HTTP catch-all
- Storing passwords or email on UserProfile

## Current codebase state

- Prefs are event payload only
- Digest assumes all users want mail
- No settings route

## Desired behavior

New sign-up writes a profile with the form values and **all email/in-app notification flags default true**. Existing users get the same defaults on first settings load or first digest run (create profile if missing). Users can turn off daily news and still use the app. Users can turn off alert emails and/or in-app alerts independently. Digest Inngest skips opted-out users.

## User flows

1. Sign up → Better Auth user + UserProfile row; welcome email still sends (unchanged opt-in for welcome).
2. User menu → Settings → see country/goals/risk/industry and toggles.
3. Disable “Daily market news email” → save → next `0 12 * * *` run skips them.
4. Re-enable → they receive the digest again.
5. Click Unsubscribe in a news email → `/sign-in?next=/settings` if anonymous, else `/settings`.

## Functional requirements

1. **UserProfile model** (single document per user):
   - `userId` unique, required
   - `country: string`
   - `investmentGoals: string`
   - `riskTolerance: string`
   - `preferredIndustry: string`
   - `dailyNewsEmail: boolean` default `true`
   - `alertEmail: boolean` default `true`
   - `alertInApp: boolean` default `true`
   - `lastSignedInAt?: Date`
   - timestamps optional
2. **Sign-up:** after successful `auth.api.signUpEmail`, upsert profile from form fields + defaults. Still emit `app/user.created`.
3. **Existing users:** if no profile, treat flags as `true` and persist on first `getMyProfile` / digest / sign-in.
4. **Settings update:** session-only; cannot change `userId`; validate select values against existing constants (and country as non-empty string).
5. **Digest:** `getAllUsersForNewsEmail` (or a successor) must join/filter profiles so `dailyNewsEmail === false` users are excluded. Missing profile ⇒ include (opt-out default).
6. **Welcome email:** still sent on create; not controlled by `dailyNewsEmail`.
7. **`lastSignedInAt`:** update on successful sign-in and when `(root)` layout sees a session (throttle to once per calendar day is enough). Spec `08` uses “signed in within 7 days”.
8. **Email footers** (news + later alert templates): replace dead `#` unsubscribe with the settings URL. No secret token.
9. Return `{ success, data | error }` from actions.

## UI / UX requirements

- New page under `app/(root)/` e.g. `app/(root)/settings/page.tsx` — session-gated by layout
- User dropdown item “Settings” above Logout
- Reuse `SelectField`, `CountrySelectField`, `.form-input`, `.yellow-btn`, gray surfaces
- Toggles: use existing button/checkbox patterns; if a shadcn Switch is needed, add it via shadcn CLI into `components/ui/` — do not hand-fork primitives
- Do not turn Settings into an admin console
- Success/error toasts
- Disabled submit while saving

## Data / model requirements

- Mongo/Mongoose only
- Better Auth collections untouched except reading `user.id`
- No Prisma

## Server actions and boundaries

`lib/actions/user.actions.ts` and/or `lib/actions/profile.actions.ts`:

- `getMyProfile()`
- `updateMyProfile(partial)`
- Keep `getAllUsersForNewsEmail` digest-safe

`lib/inngest/functions.ts`: skip opted-out users.

`lib/actions/auth.actions.ts`: persist profile on sign-up; bump `lastSignedInAt` on sign-in.

## Inngest / email

- Cron unchanged (`0 12 * * *`)
- If zero eligible users, existing “No users found” style result is OK
- Do not send digest to users with empty email

## Auth

- Settings is `(root)` — anonymous → `/sign-in`
- Middleware return-path (spec `12`) will make email footer links smoother; until then layout redirect is enough

## Loading / empty / success / error / disabled

| State | Behavior |
| ----- | -------- |
| First visit, no profile | Show defaults (US/Growth/Medium/Technology if unknown) + flags ON; persist on save or silently upsert |
| Save success | Toast |
| Save error | Toast; leave fields as edited |
| Digest user opted out | No email, no Gemini spend for that user |

## Edge cases

- Sign-up succeeds but profile upsert fails — log; next settings visit backfills defaults (user can re-enter prefs)
- User in Better Auth deleted — digest lookup already skips missing email; orphan profiles OK
- All flags off — user still uses dashboard/watchlist
- `getAllUsersForNewsEmail` currently projects unused `country` from Better Auth user — country lives on UserProfile after this spec

## Constraints / invariants

- No parallel Mongoose User
- Default digest **ON** (product decision)
- Finnhub still server-side only
- No billing

## Affected surfaces

- `database/models/user-profile.model.ts` (new)
- `lib/actions/auth.actions.ts`
- `lib/actions/user.actions.ts`
- `lib/inngest/functions.ts`
- `lib/nodemailer/templates.ts` footer links
- `components/UserDropdown.tsx`
- `app/(root)/settings/page.tsx` (new)
- `types/global.d.ts`

## Dependencies

- **Depends on:** spec `05` (in-app toggle is meaningful); existing digest job
- **Enables:** `08` respects `alertEmail` / `alertInApp`; honest digest opt-out

## Acceptance criteria

- [ ] Sign-up persists country/goals/risk/industry on UserProfile
- [ ] Settings can edit those fields and three boolean flags
- [ ] New and existing users default to digest ON
- [ ] Opted-out users are skipped by the daily job
- [ ] Welcome email still sends on create
- [ ] No Mongoose User model
- [ ] Email unsubscribe links to in-app settings (not a forged token)
- [ ] `lastSignedInAt` updates on sign-in
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Manual: sign up → Mongo profile exists
- Toggle digest off → run `app/send.daily.news` → no mail to that user
- Toggle on → mail resumes
- Second browser session cannot update another user’s profile

## Unresolved questions

None. Tokenized unsubscribe remains out of scope by decision.
