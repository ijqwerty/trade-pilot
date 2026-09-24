# Code Standards

Standards below reflect conventions **already present** in this repository. Prefer matching existing files over introducing a parallel style.

## General

- Keep route files thin; put side effects and integrations in `lib/actions/` or `lib/{integration}/`.
- Prefer small, single-purpose modules (one concern per action file / component).
- Fix root causes; do not leave dead imports or stub UI that claims persistence without server actions.
- Do not invent product behavior absent from `context/` docs or explicit user instruction — record open questions in `progress-tracker.md`.

## TypeScript

- `strict` is enabled in `tsconfig.json`; keep it on.
- Path alias: `@/*` maps to the project root.
- Shared domain types live as ambient globals in `types/global.d.ts` (e.g. `SignUpFormData`, `Stock`, `Alert*`). Prefer extending that file for cross-cutting types rather than scattering duplicate interfaces — and avoid duplicating the same type name twice in that file.
- Use explicit props types for components (`WatchlistButtonProps`, etc.). Avoid `any` except at unavoidable adapter boundaries (Better Auth Mongo adapter currently casts `db as any`).
- Validate or narrow unknown external JSON at Finnhub/Inngest/email boundaries before trusting fields.

## Next.js

- Default to Server Components. Add `"use client"` only when browser APIs, hooks, or interactivity require it (forms, search dialog, TradingView hook, dropdowns).
- Use App Router route groups: `(auth)` for public auth UX, `(root)` for session-gated product UI.
- Prefer server actions in `lib/actions/*.ts` with `'use server'` for mutations and data fetching used by the UI. Keep the sole API route reserved for Inngest unless a real HTTP surface is required.
- Do not add a Better Auth HTTP catch-all route unless explicitly required; auth stays server-actions-only.
- Layouts own cross-cutting concerns (session gate, chrome); pages own page-specific composition.
- Root `middleware.ts` is the Next.js cookie-presence gate: redirect anonymous users to `/sign-in` and preserve a safe return path; do not blanket-redirect to `/`. `(root)` layout still validates the real session.
- Finnhub (and other secret-backed APIs) must be called from the server only; do not ship API keys via `NEXT_PUBLIC_*`.

## Styling

- Use Tailwind utility classes and project utility classes from `app/globals.css` (e.g. `.yellow-btn`, `.form-input`, `.watchlist-btn`).
- Prefer the custom gray / yellow / teal / red palette (`gray-900`…`gray-400`, `yellow-500`, `teal-400`, `red-500`) used across the app shell.
- shadcn tokens (`--background`, `--primary`, etc.) exist for primitives; product chrome primarily uses the custom `@theme` colors. See `ui-context.md` for the visual system — do not invent a second token set.
- Use `cn()` from `lib/utils.ts` to merge class names.

## Server actions and APIs

- Auth and Finnhub entry points are server actions, not REST controllers. Match that pattern for new mutations (watchlist add/remove, alerts, prefs) unless there is a clear reason for a Route Handler.
- Check session / identity before mutating user-owned data once write paths exist.
- Return small, predictable result objects from actions (existing auth actions use `{ success, data | error }`).
- Log failures with enough context for debugging; do not leak secrets or raw provider payloads to the client.

## Data and storage

- App domain documents use Mongoose models under `database/models/`.
- Better Auth owns its collections; read users via the native Mongo collection when needed (as `getWatchlistSymbolsByEmail` does), or through Better Auth APIs — do not fork a parallel User mongoose model without a decision.
- Connect through `connectToDatabase()`; rely on the existing global mongoose cache.
- Do not store large generated HTML or binary blobs in Mongo; emails are generated and sent, not archived as documents today.
- Background work (AI, multi-user fan-out email) belongs in Inngest functions under `lib/inngest/`.

## File organization

- `app/` — pages, layouts, route handlers only
- `middleware.ts` — Next.js cookie-presence gate (root convention)
- `components/` — UI; `components/ui/` for shadcn primitives; `components/forms/` for shared fields
- `lib/actions/` — server actions
- `lib/auth/` — edge-safe auth helpers (return-path sanitizer)
- `lib/constants.ts` — nav, select options, TradingView widget configs
- `lib/utils.ts` — `cn` and shared formatters/helpers
- `database/` — connection + models
- `hooks/` — client hooks
- `types/` — ambient types
- `scripts/` — one-off / ops scripts
- `context/` — project context markdown for humans/AI (update when behavior changes)

## Naming

- Components: PascalCase files (`SearchCommand.tsx`).
- Actions / utilities: camelCase exports (`searchStocks`, `signInWithEmail`).
- Mongoose models: PascalCase schema export (`Watchlist`).
- Inngest function ids: kebab-case strings (`sign-up-email`, `daily-news-summary`).
- Events: dotted names (`app/user.created`, `app/send.daily.news`).

## Tooling

- Lint with `npm run lint` (ESLint `next/core-web-vitals` + `next/typescript`).
- There is no unit/e2e test runner configured; `npm run test:db` only checks Mongo connectivity.
- Note: builds currently ignore ESLint and TypeScript errors via `next.config.ts`. Prefer fixing type/lint issues in touched code rather than relying on that escape hatch for new work.
