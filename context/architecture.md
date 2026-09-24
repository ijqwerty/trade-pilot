# Architecture Context

## Stack

| Layer | Technology | Role |
| ----- | ---------- | ---- |
| Framework | Next.js 15.5 (App Router) + React 19 + TypeScript | Full-stack UI, layouts, server actions |
| UI | Tailwind CSS v4 + shadcn/ui (new-york) + Lucide | Styling and reusable primitives |
| Auth | Better Auth (`better-auth`) + MongoDB adapter | Email/password sessions |
| Database | MongoDB via Mongoose 8 + native driver collections | App models + Better Auth user/session collections |
| Background jobs | Inngest 3 | Welcome email + daily AI news digest + price-alert check (also volume spikes) + TradingView symbol mapping |
| Market UI | TradingView embed widgets (CDN scripts) | Charts, heatmaps, profiles, financials |
| Market data API | Finnhub REST | Search + company/general news + optional profile2 for symbol mapping |
| AI | Gemini via Inngest `step.ai` (`gemini-2.5-flash-lite`) | Welcome intro + news HTML summary + TradingView symbol mapping |
| Email | Nodemailer (Gmail transport) | Transactional emails |
| Forms / UX | react-hook-form, cmdk, sonner, next-themes | Auth forms, command search, toasts |

Package name in `package.json` is `trade-pilot`. Inngest client id is `signalist` (kept for existing Inngest app identity).

## System Boundaries

- `app/` — Routes and layouts only. `(auth)` for sign-in/up; `(root)` for authenticated pages; `app/api/inngest` for the Inngest serve endpoint.
- `middleware.ts` — Root Next.js cookie-presence gate (redirect anonymous users to `/sign-in` with a safe `next`). Matcher excludes `api`, static, `favicon.ico`, and `assets`; auth pages are matched but allowed through.
- `components/` — Presentational and interactive UI. Feature components at root; shadcn primitives in `components/ui/`; form fields in `components/forms/`.
- `lib/actions/` — Server actions (`'use server'`) for auth, Finnhub, users, watchlist, alerts, profile, and in-app notifications.
- `lib/watchlist/` — Watchlist market-data enrichment and dashboard widget symbol mapping (spec `10`).
- `lib/notifications/` — Server-only write helpers (e.g. `createNotification` for Inngest); not client-callable actions.
- `lib/better-auth/`, `lib/inngest/`, `lib/nodemailer/` — Integration clients, workflows, and email templates.
- `lib/auth/` — Edge-safe return-path sanitizer (`safe-next.ts`) shared by middleware, layouts, and auth pages.
- `database/` — Mongoose connection (`mongoose.ts`) and app schemas (`models/`).
- `hooks/` — Client hooks (e.g. TradingView widget loader).
- `types/` — Ambient global TypeScript declarations (`global.d.ts`).
- `scripts/` — Operational scripts (DB connectivity test).
- `context/` — AI/human project context docs (this folder); not runtime code.
- `public/` — Static assets (logos, images, readme media).

## Storage Model

- **MongoDB (Better Auth collections)**: Users, sessions, and related auth documents managed by the Better Auth MongoDB adapter (e.g. `user` collection queried by email in watchlist actions). No local Mongoose User schema.
- **MongoDB (Mongoose `Watchlist`)**: Per-user symbols with `userId`, `symbol`, `company`, optional `tradingViewSymbol`, `addedAt`; unique index on `{ userId, symbol }`.
- **MongoDB (Mongoose `SymbolMap`)**: Global Finnhub→TradingView mapping `{ symbol` unique, `tradingViewSymbol`, optional `exchange`, `updatedAt` }; filled by heuristic on stock page / watchlist add, and by Inngest AI on first miss.
- **MongoDB (Mongoose `Notification`)**: Per-user inbox rows with `userId`, `type`, `title`, `body`, optional `symbol` / `href` / `dedupeKey`, `readAt`, `createdAt`; partial unique index on `{ userId, dedupeKey }` when `dedupeKey` is a string.
- **MongoDB (Mongoose `UserProfile`)**: Per-user personalization + notification prefs (`dailyNewsEmail`, `alertEmail`, `alertInApp`) keyed by Better Auth `userId`.
- **MongoDB (Mongoose `Alert`)**: Per-user price alerts with `userId`, `symbol`, `company`, `alertName`, `alertType` (`upper`|`lower`), `threshold`, `enabled`, `isArmed` (rearm after price returns), optional `lastTriggeredAt`; indexes `{ userId, symbol }` and `{ userId, enabled }`; max 20 alerts per user (enforced in actions). Evaluated by Inngest `price-alert-check` (spec `08`).
- **MongoDB (Mongoose `VolumeAlertState`)**: Automatic watchlist volume-spike armed flags `{ userId, symbol }` unique, `isArmed`, optional `lastTriggeredAt`. Not stored on price `Alert` documents. Evaluated on the same `price-alert-check` cron (spec `11`).
- **No blob/file storage**: Media is static under `public/` or remote URLs in email templates. No migration framework; schema changes are code-driven.

## Auth and Access Model

- Authentication is email/password via Better Auth (`lib/better-auth/auth.ts`), with `nextCookies()`, auto sign-in after sign-up, and no email verification.
- Mutations for auth go through server actions in `lib/actions/auth.actions.ts` calling `auth.api.*`. Stay **server-actions-only** — do **not** add `app/api/auth/[...all]` unless a concrete requirement appears (portfolio-project simplicity).
- App pages under `app/(root)/` require a session: layout calls `auth.api.getSession` and redirects to `/sign-in` (with a safe `next` return path) if missing.
- Auth pages redirect signed-in users to a safe `next` when present, otherwise `/`.
- There is no role-based authorization, multi-tenant collaboration, or ownership ACL beyond “signed-in user.” Watchlist, alert, notification, and profile rows are keyed by session `userId`; users only read/mutate their own data.
- Root `middleware.ts` (Next.js convention) checks Better Auth session **cookie presence** only (no full session validation on the edge). Missing cookie → `/sign-in?next=<safe-path>` (omit `next` when the target is `/`). Cookie present → continue; the layout still rejects invalid sessions. Matcher never runs on `/api/*` (Inngest stays reachable). `/sign-in` and `/sign-up` stay public. Do **not** redirect everything to `/`. The old unused `middleware/index.ts` helper was folded into this root file so Next does not register a duplicate `/middleware` page.

## Data and integration flow

```
Browser → Next.js App Router / Server Actions
                ├─ Better Auth → MongoDB
                ├─ Finnhub REST (search, news)
                └─ TradingView CDN embeds (client)

Inngest ← /api/inngest
  ├─ app/user.created → Gemini → Nodemailer welcome
  ├─ cron / app/send.daily.news → users → watchlist symbols → Finnhub news → Gemini → Nodemailer digest
  ├─ cron * * * * * (price-alert-check) → price alerts + watchlist volume spikes → email + inbox
  └─ app/symbol.map → Gemini → SymbolMap (+ Watchlist stamp)
```

## Invariants

1. Do not run long-lived polling or heavy AI work inside Next.js route handlers or page renders; use Inngest for background workflows.
2. Finnhub access is **server-side only**. Never expose the API key to the client (`NEXT_PUBLIC_*` Finnhub keys should not be the pattern going forward). All outbound Finnhub HTTP goes through `lib/finnhub/client.ts` (rate limit, cache, coalescing); UI and Inngest import via `lib/actions/finnhub.actions.ts` or `lib/finnhub/*`.
3. Treat current Finnhub usage as **personal/non-commercial**. Do not assume commercial redistribution rights; revisit Finnhub licensing before any monetized or customer-facing commercial launch.
4. Treat TradingView embeds as the primary charting surface; do not duplicate full chart stacks in-app without an explicit decision.
5. Watchlist uniqueness is `{ userId, symbol }`; symbols are stored uppercase.
6. Authenticated product UI lives under `app/(root)/` and must remain session-gated. Edge middleware sends anonymous users (no session cookie) to `/sign-in` with a safe return-path, not blanket-redirect to `/`. `(root)` layout remains the authorization source of truth for missing/invalid sessions. Logged-in `/` overview and quotes widgets use the current user’s watchlist mapped symbols (cap 12, newest first) when present; otherwise the static TradingView defaults. Heatmap and timeline stay global. Do not fetch Finnhub quotes or start Inngest from the dashboard page.
7. Do not introduce an admin/CMS subsystem unless product scope changes — “dashboard” means the logged-in user home at `/`.
8. Do not add billing/payment/subscription infrastructure in the current scope.
9. Context docs in `context/` describe intent; **application code is the source of truth** for what is shipped.

### Alert engineering defaults

Server-side price-alert evaluation (spec `08`) and automatic watchlist volume spikes (spec `11`) share one Inngest cron:

- Inngest cron every minute (`* * * * *`) — equals **60 polls/hour/user**; no extra per-user loops
- Price active users: ≥1 enabled alert **and** `lastSignedInAt` within **7 days**
- Volume active users: ≥1 watchlist symbol **and** `lastSignedInAt` within **7 days** (may have zero price alerts)
- Shared Finnhub `getQuotes` over unique price-alert symbols; volume uses `getVolumeSnapshots` (metric 300s + candle 60s) over unique watchlist symbols, cap 50
- Volume threshold: latest session volume **≥ 2.0 × 10-day average**; skip if either value is missing
- Dedup: price `isArmed` on `Alert`; volume `isArmed` on `VolumeAlertState` plus UTC-day `dedupeKey` `volume:${userId}:${symbol}:${yyyy-mm-dd}`
- If limiter is exhausted after quotes, skip volume rather than adding more Finnhub HTTP

## Tooling and runtime notes

- Scripts: `npm run dev` / `build` (Turbopack), `start`, `lint` (ESLint), `test:db` (Mongo connectivity).
- `next.config.ts` currently sets `eslint.ignoreDuringBuilds: true` and `typescript.ignoreBuildErrors: true`.
- Local Inngest: README expects a separate `npx inngest-cli@latest dev` process alongside Next.
- `database/mongoose.ts` includes a Windows/Next-oriented SRV DNS workaround converting `mongodb+srv://` to direct hosts when needed.
