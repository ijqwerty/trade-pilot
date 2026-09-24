# TradePilot

Portfolio/demo stock-market web app built from the JavaScript Mastery **Signalist** tutorial scaffold. TradePilot keeps the dark gray/yellow UI and core flows (auth, TradingView dashboard, Finnhub search, Inngest emails) while product docs and branding reflect what is actually shipped vs planned.

## Tech stack

- **Next.js 15** (App Router) + React 19 + TypeScript
- **Better Auth** — email/password sessions (server actions only)
- **MongoDB** — Better Auth collections + Mongoose `Watchlist` model
- **TradingView** embeds — charts, heatmap, market overview, financials
- **Finnhub** — server-side stock search and news (personal/non-commercial)
- **Inngest** — welcome email + daily AI news digest
- **Gemini** (`gemini-2.5-flash-lite`) via Inngest `step.ai`
- **Nodemailer** — transactional email
- **Tailwind CSS v4** + **shadcn/ui**

## Features

### Implemented today

- Email/password sign-up, sign-in, and sign-out
- Session-gated app shell (header, nav, user menu)
- Dashboard `/` with four TradingView widgets
- Stock detail `/stocks/[symbol]` with TradingView widgets
- Finnhub-backed stock search (command dialog)
- Watchlist **read** path used by daily digests (persistence UI not wired yet)
- Welcome email on user creation
- Daily AI news summary email (Inngest cron + event)

### Planned (see `context/progress-tracker.md`)

- Finnhub shared cache + rate limiter
- Persistent watchlist + `/watchlist` page
- In-app notification center
- Price / volume alerts (email + in-app)
- Notification preferences & digest opt-in
- Personalized logged-in dashboard widgets
- Auth edge middleware hardening

**Out of scope:** billing/Stripe, admin CMS, or a separate “managing stocks / publishing news / monitoring users” console. “Dashboard” means the logged-in user home at `/`.

## Quick start

**Prerequisites:** [Node.js](https://nodejs.org/), npm, and a MongoDB URI.

```bash
npm install
```

Create a `.env` in the project root (do not commit secrets):

```env
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# FINNHUB (server-only; set FINNHUB_API_KEY — do not use NEXT_PUBLIC_* for Finnhub)
FINNHUB_API_KEY=
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# MONGODB
MONGODB_URI=

# BETTER AUTH
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# GEMINI
GEMINI_API_KEY=

# NODEMAILER
NODEMAILER_EMAIL=
NODEMAILER_PASSWORD=
```

Run the Next app and Inngest Dev Server:

```bash
npm run dev
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project notes

- Package name: `trade-pilot`
- Inngest client id remains `signalist` (existing Inngest app identity — do not rename casually)
- Status and backlog live in `context/progress-tracker.md`
- Origin: [Signalist tutorial](https://youtu.be/gu4pafNCXng) / [JavaScript Mastery scaffold](https://github.com/adrianhajdin/signalist_stock-tracker-app)
