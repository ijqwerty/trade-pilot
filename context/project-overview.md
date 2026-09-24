# TradePilot (Signalist scaffold)

## Overview

TradePilot is a Next.js stock-market web app for retail investors who want a dark-themed workspace to monitor markets, look up companies, and eventually manage personal watchlists and alerts. The repository started as the JavaScript Mastery “Signalist” tutorial scaffold; product direction is a polished TradePilot **portfolio/demo** app (not a paid commercial product in the current scope). User-facing copy, metadata, emails, and the logo wordmark say **TradePilot**.

Today a signed-in user can authenticate, view a TradingView-powered dashboard (watchlist-personalized overview/quotes when symbols exist), open per-symbol chart/profile widgets, manage a persistent watchlist with quotes/news, search stocks via Finnhub, and use a header in-app notification inbox. Background Inngest jobs send a personalized welcome email, a daily AI news digest, evaluate price alerts, and notify on automatic watchlist volume spikes. Root middleware redirects anonymous users to `/sign-in` and preserves a safe return path. Admin/CMS and billing remain out of scope.

## Goals

1. Deliver a reliable signed-in market workspace: auth, dashboard charts, stock detail, and search.
2. Complete the personalization loop: persistent watchlist, prefs, and digest/alert controls that respect Finnhub free-tier limits.
3. Polish TradePilot as a portfolio/demo product (email + in-app alerts, branded UX) without inventing an admin CMS or billing stack that does not exist in code.

## Core User Flow

1. User opens `/sign-up` or `/sign-in` (auth route group).
2. User creates an account with email/password plus country, investment goals, risk tolerance, and preferred industry (prefs are sent to Inngest for the welcome email; they are **not** stored on a user profile document).
3. On success, Better Auth establishes a session; the user returns to the safe `next` path when present, otherwise `/`. Signed-in users hitting auth pages are redirected the same way.
4. User lands on the dashboard (`/`) behind `app/(root)/layout.tsx` session check and sees TradingView market widgets (overview/quotes use the user’s watchlist when present; heatmap/timeline stay global).
5. User opens Search from the header (command dialog, not a `/search` page), finds a symbol via Finnhub, and navigates to `/stocks/[symbol]`.
6. Stock page shows TradingView symbol info, charts, technicals, profile, and financials; a Watchlist button is present but only toggles local UI state.
7. Optionally (background): welcome email on `app/user.created`; daily AI news email via Inngest cron/`app/send.daily.news`; minute `price-alert-check` for price thresholds and watchlist volume spikes.

## Features

### Implemented today

- Email/password sign-up, sign-in, and sign-out via Better Auth server actions
- Session-gated app shell with header, nav, user dropdown, and notification bell/popover
- Dashboard with TradingView embeds (overview, heatmap, timeline/stories, market quotes); overview and quotes follow the session watchlist when it has mapped symbols, otherwise static defaults
- Stock detail page with TradingView widgets for a given symbol
- Finnhub-backed stock search dialog (⌘/Ctrl+K style command UI)
- Persistent watchlist + `/watchlist` page with cache-backed quotes and in-app news
- In-app notification inbox (Mongo `Notification`, mark read / mark all, unread badge; empty until writers use `createNotification`)
- Inngest welcome email (Gemini intro + Nodemailer)
- Inngest daily news summary email (Finnhub news + Gemini HTML + Nodemailer)
- Price Alert CRUD + Inngest evaluation (email + in-app)
- Automatic watchlist volume-spike alerts (email + in-app; shared 2× 10-day-average threshold; no volume CRUD)
- Root auth middleware: anonymous product URLs redirect to `/sign-in` with a safe `next` return path; layout still validates the real session

### Scaffolded / partial (not product-complete)

- Unused inactive-user reminder email template

### Not present in code

- Admin dashboard / CMS / analytics management
- Billing, Stripe, subscriptions, or payment infrastructure

## Scope

### In Scope

- Authenticated market dashboard and stock detail via TradingView
- Finnhub search and news for digests
- Better Auth + MongoDB session/user storage
- Inngest background emails (welcome + daily digest)
- Completing planned product features listed in `progress-tracker.md` (watchlist, alerts, prefs, rebrand, etc.)

### Out of Scope

- Separate admin/CMS for managing stocks, publishing news, or monitoring users (README mentions this; **no related code**; product decision treats “dashboard” as the logged-in user home)
- Billing, Stripe, subscriptions, or payment infrastructure (revisit only if the project becomes a paid product)
- Commercial redistribution of Finnhub data / assuming commercial Finnhub rights (current scope is personal/non-commercial)
- Better Auth HTTP catch-all route (`app/api/auth/[...all]`) unless a concrete requirement appears — stay server-actions-only
- Brokerage execution, portfolio accounting, or live order routing
- Non-email social OAuth / MFA (not configured in Better Auth today)
- Automated unit/e2e test suites (only a DB connectivity script exists)

## Success Criteria

1. A new user can sign up, receive a welcome email when Inngest is running, and land on `/`.
2. A signed-in user can use Search to open `/stocks/[symbol]` and see TradingView widgets for that symbol.
3. Unauthenticated users cannot use `(root)` pages (edge middleware + layout redirect to `/sign-in`, preserving a safe return path).
4. Daily digest job can run for users with emails; when watchlist rows exist for a user, symbol-scoped news is preferred over general news.
5. Future work is tracked in `progress-tracker.md` and does not get described as shipped until implemented.
6. A signed-in user with watchlist symbols sees personalized overview/quotes on `/`; an empty watchlist still shows the four default widgets.
