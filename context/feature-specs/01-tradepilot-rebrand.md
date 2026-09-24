# TradePilot Rebrand / Remove Signalist

## Goal

Replace remaining Signalist branding with TradePilot across the running app, emails, metadata, logo wordmark, and README — without changing product behavior.

## Existing / Reusable

- Dark gray/yellow visual system in `app/globals.css` and `context/ui-context.md` — keep it
- Logo file at `public/assets/icons/logo.svg` (chart icon + “Signalist” wordmark as SVG paths)
- Auth split layout, header logo, email HTML templates, Inngest welcome fallback copy
- README is still the JavaScript Mastery Signalist tutorial README (admin/CMS, billing-adjacent marketing, clone URL for `signalist_stock-tracker-app`)

## New / Required

- User-facing Signalist strings → TradePilot
- SVG wordmark paths → “TradePilot” lettering; **keep the existing chart icon**
- README rewritten for this portfolio/demo app (honest implemented vs planned status)
- Email `from` display name → TradePilot; prefer `NODEMAILER_EMAIL` as the envelope address instead of the hardcoded `signalist@jsmastery.pro` mailbox if that mailbox is not the configured transport user

## Scope

### In scope

- `app/layout.tsx` metadata `title` / `description`
- Header and auth logo `alt` text
- Auth testimonial copy that names Signalist
- Nodemailer subjects, text bodies, HTML titles, footers, “Visit …” links, © lines
- Inngest welcome fallback string and prompt examples that say Signalist
- `public/assets/icons/logo.svg` wordmark
- `README.md` product framing
- `package.json` `"name"`: `stocks_app` → `trade-pilot` (folder already uses this name)

### Out of scope

- Do not change Inngest client `id: 'signalist'` (`lib/inngest/client.ts`) — renaming breaks the existing Inngest app identity
- Do not redesign the visual system or invent a second token set
- Do not implement watchlist, alerts, notifications, middleware, or Finnhub cache
- Do not add billing, admin/CMS, or new marketing features in README that are not in `progress-tracker.md`
- Do not commit or rewrite `.env` secrets

## Current codebase state

Verified in application code (not README):

- Metadata title is `"Signalist"`
- Logo alts say `"Signalist logo"` in `components/Header.tsx` and `app/(auth)/layout.tsx`
- Auth quote: “Signalist turned my watchlist…”
- Emails: `"Signalist"` / `"Signalist News"` from-names; subjects and HTML still Signalist; footers link to `https://signalist.app` or the JSM preview URL
- Welcome Inngest fallback: “Thanks for joining Signalist…”
- Package name: `stocks_app`
- Inngest app id: `signalist` (leave as-is)

## Desired behavior

A signed-in or anonymous visitor sees **TradePilot** in the tab title, logo alt, auth panel, and emails. README describes TradePilot as a portfolio/demo app and does not claim an admin CMS, Stripe, or fully shipped alerts/watchlist.

## User flows

1. Open `/sign-in` or `/sign-up` → logo alt and testimonial say TradePilot.
2. Open any `(root)` page → header logo alt and document title say TradePilot.
3. Receive welcome or daily-news email (when Inngest runs) → TradePilot naming in from-name, subject, body, footer.
4. Read `README.md` → TradePilot name, real stack, honest feature list.

## Functional requirements

1. Replace user-visible “Signalist” / “signalist” brand strings in app UI and email templates with “TradePilot”.
2. Keep the chart icon in `logo.svg`. Replace only the wordmark (the white lettering paths) so the mark reads TradePilot. Matching weight/size to the current 130×30 viewBox is required; do not swap in a new illustration style.
3. Update metadata:
   - Title: `TradePilot`
   - Description: keep the existing meaning (track markets, alerts, company insights) without claiming unimplemented CMS/admin capabilities.
4. Auth testimonial may keep the same sentiment; it must not name Signalist.
5. Email footers: “Visit TradePilot” should point at the app origin when known (`BETTER_AUTH_URL` or a single documented placeholder), not `https://signalist.app`.
6. Nodemailer `from` display name is `TradePilot` (and `TradePilot News` for the digest). Use the configured `NODEMAILER_EMAIL` as the address when present.
7. README must:
   - Title/introduce TradePilot (Signalist mentioned only as the tutorial scaffold origin)
   - Remove admin dashboard / CMS / “managing stocks, publishing news, monitoring users” as if they exist
   - Not imply Stripe/billing
   - Distinguish **implemented today** vs **planned** (watchlist persistence, alerts, notification center, etc.) using `context/progress-tracker.md` as the status source
   - Keep real setup steps (env vars, `npm run dev`, Inngest CLI) but drop or relabel the `adrianhajdin/signalist_stock-tracker-app` clone path if this workspace is TradePilot
8. `package.json` name becomes `trade-pilot`.

## UI / UX requirements

- No new colors, fonts, or layout.
- Logo remains the header/auth image at existing widths (`h-8 w-auto`).
- If SVG viewBox must grow for the longer word “TradePilot”, keep height ~30px and avoid a huge header.

## Email requirements

Touch:

- `lib/nodemailer/index.ts`
- `lib/nodemailer/templates.ts` (welcome, news, unused alert/volume/inactive templates — rebrand all of them so later specs do not reintroduce Signalist)
- `lib/inngest/functions.ts` fallback intro
- `lib/inngest/prompts.ts` example HTML that says Signalist

Do not start sending new email types in this spec.

## Constraints / invariants

- Finnhub keys stay server-side; this spec does not move env vars except documenting names in README if needed.
- Do not add `app/api/auth/[...all]`.
- Do not modify `components/ui/*`.
- Application code remains source of truth after this change: grep should not find user-facing “Signalist” in `app/`, `components/`, `lib/` (Inngest `id: 'signalist'` is the allowed exception).

## Affected surfaces

- `app/layout.tsx`
- `app/(auth)/layout.tsx`
- `components/Header.tsx`
- `public/assets/icons/logo.svg`
- `lib/nodemailer/index.ts`
- `lib/nodemailer/templates.ts`
- `lib/inngest/functions.ts`
- `lib/inngest/prompts.ts`
- `package.json`
- `README.md`

## Dependencies

- **Depends on:** none
- **Enables:** every later spec can assume TradePilot naming

## Acceptance criteria

- [ ] Browser tab title is TradePilot
- [ ] Header and auth logo alts say TradePilot
- [ ] Auth testimonial does not say Signalist
- [ ] Logo visually reads TradePilot and still shows the existing icon
- [ ] Welcome + news email strings (and unused templates) say TradePilot
- [ ] Inngest client id remains `signalist`
- [ ] README does not describe an admin CMS or billing as shipped features
- [ ] `package.json` name is `trade-pilot`
- [ ] Product behavior (auth, dashboard widgets, search, Inngest jobs) unchanged
- [ ] `npm run lint` clean for touched files when practical

## Validation / testing

- Grep `app/`, `components/`, `lib/`, `public/`, `README.md` for `Signalist` / `signalist` and confirm only the Inngest app id remains
- Manually open `/sign-in` and `/` and check title + logo
- If Inngest is running, trigger welcome or inspect rendered HTML from templates

## Unresolved questions

None for this spec. Inngest id rename is explicitly deferred.
