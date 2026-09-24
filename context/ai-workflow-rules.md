# AI Workflow Rules

## Approach

Work from the six files in `context/` plus the live codebase. Treat **application code as the source of truth** for what exists; treat `progress-tracker.md` as the source of truth for planned work and open questions.

This repo is a Signalist tutorial scaffold being evolved into a TradePilot portfolio/demo app. Do not assume README marketing features (admin CMS, live alerts, full watchlist UX, billing) are implemented — verify in code.

Build incrementally: one feature unit at a time, matched to an item in `progress-tracker.md`.

## Scoping Rules

- Work on one feature unit at a time
- Prefer small, verifiable increments over large speculative changes
- Do not combine unrelated system boundaries in a single implementation step
- Do not implement “recommended” features unless the user explicitly asks to build them
- Respect Finnhub free-tier and personal/non-commercial scope (shared cache/throttle; server-side only; never expose the API key; no per-user unbounded polling)
- Do not add billing/Stripe/subscription code
- Do not add a Better Auth HTTP catch-all unless the user cites a concrete need

## When to Split Work

Split an implementation step if it combines:

- UI page work and Inngest/background job changes
- Schema/model changes and unrelated UI redesign or rebrand
- Multiple independent server-action domains (e.g. watchlist writes + alert engine)
- Behavior not clearly defined in context files or still listed under Open Questions
- Rebrand/copy changes bundled with feature logic (keep rebrand as its own unit unless asked otherwise)

If a change cannot be verified end to end quickly, the scope is too broad — split it.

## Handling Missing Requirements

- Do not invent product behavior not defined in the context files or user instructions
- If a requirement is ambiguous, resolve it in the relevant context file (or ask the user) before implementing
- If a requirement is missing, add it as an open question in `progress-tracker.md` before continuing
- Never describe scaffold-only UI (e.g. `WatchlistButton` local state) as persistence

## Protected Files

Do not modify the following unless explicitly instructed:

- `components/ui/*` — shadcn primitives (prefer CLI/additive updates over hand-edits)
- `node_modules/**`, `.next/**`
- Third-party library internals
- `.env` secrets (never commit or rewrite credentials)
- Unrelated README/tutorial marketing copy unless the task is documentation or rebrand

## Repo-specific implementation rules

- Prefer server actions under `lib/actions/` for app mutations; keep `/api/inngest` for Inngest; keep auth server-actions-only
- Reuse existing types in `types/global.d.ts`, constants in `lib/constants.ts`, and CSS utilities in `app/globals.css`
- Session-gate authenticated pages via `app/(root)/layout.tsx` (real session). Root middleware is a cookie-presence gate: redirect anonymous users to `/sign-in` and preserve a safe return path — never blanket-redirect to `/`.
- Put AI + multi-user email fan-out in Inngest, not in page renders
- Do not add an admin/CMS app area; personalization belongs on the logged-in user dashboard
- When touching market data, design for a shared Finnhub cache/limiter before adding new call sites; keep keys server-side
- If implementing alerts later: server-side evaluation, ~60s cadence per active user, max 60 polls/hour/user (see `architecture.md`)

## Keeping Docs in Sync

Update the relevant context file whenever implementation changes:

- Feature scope or success criteria → `project-overview.md`
- Stack, boundaries, storage, auth, invariants → `architecture.md`
- Conventions → `code-standards.md`
- Visual system / layout patterns → `ui-context.md`
- Status, decisions, open questions → `progress-tracker.md`

## Before Moving to the Next Unit

1. The current unit works end to end within its defined scope
2. No invariant defined in `architecture.md` was violated
3. `progress-tracker.md` reflects the completed work (move items from Next Up → Completed)
4. `npm run lint` is clean for touched files when practical; note known `next.config.ts` build ignore flags
5. Manual check: auth still gates `(root)`, and Inngest paths still register if job code changed
