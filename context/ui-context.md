# UI Context

## Theme

Dark-only product chrome. Root layout forces `<html className="dark">`. Body uses near-black `bg-gray-900` with muted gray text. The look is a dense financial workspace: dark surfaces (`gray-800` / `gray-700`), yellow primary CTAs, teal used in TradingView accent configs, red for destructive/remove states. Light-mode shadcn `:root` tokens exist but the app does not ship a light theme toggle in active UX.

Brand in the UI is **TradePilot** (metadata title, logo alt/wordmark, auth testimonial, emails). The dark gray/yellow visual system is unchanged.

## Colors

### Product palette (primary for app chrome)

Defined in `app/globals.css` under `@theme` and used heavily via Tailwind classes:

| Role | Token / class | Value |
| ---- | ------------- | ----- |
| Page background | `gray-900` | `#050505` |
| Elevated surface / header | `gray-800` | `#141414` |
| Panel / table header | `gray-700` | `#212328` |
| Borders / subtle chrome | `gray-600` | `#30333A` |
| Muted / secondary text | `gray-500` | `#9095A1` |
| Primary readable text | `gray-400` | `#CCDADC` |
| Strong text / active nav | `gray-100` / white | (Tailwind defaults) |
| Primary CTA / accent | `yellow-400` / `yellow-500` | `#FDD458` / `#E8BA40` |
| Positive / chart accent | `teal-400` | `#0FEDBE` |
| Destructive / remove | `red-500` | `#FF495B` |
| Extra accents (sparingly) | `blue-600`, `orange-500`, `purple-500` | `#5862FF`, `#FF8243`, `#D13BFF` |

### shadcn CSS variables

`:root` and `.dark` define `--background`, `--foreground`, `--primary`, `--destructive`, `--radius`, chart/sidebar tokens, etc. Use these inside `components/ui/*` primitives. For feature layouts, prefer the gray/yellow utilities above for consistency with Header, auth, search, and watchlist classes.

Do not invent a parallel custom-property system (e.g. `--bg-base`) unless migrating the whole theme deliberately.

## Typography

| Role | Font | Variable |
| ---- | ---- | -------- |
| UI sans | Geist (`next/font/google`) | `--font-geist-sans` → `--font-sans` |
| Mono | Geist Mono | `--font-geist-mono` → `--font-mono` |

Body is antialiased. Form titles use large bold gray text (`.form-title`). Avoid introducing a second display font.

## Border Radius

| Context | Pattern in repo |
| ------- | ---------------- |
| Base token | `--radius: 0.625rem` (shadcn scale: sm/md/lg/xl derived) |
| Buttons / inputs | Often `rounded-lg` or utility classes (`.form-input`, `.yellow-btn`) |
| Search CTA | `.search-btn` uses `rounded` |
| Cards / tables / previews | `rounded-lg` / `rounded-xl` (auth dashboard preview, watchlist table) |
| Icon chips | Occasional `rounded-full` (e.g. `.watchlist-icon`) |

Match nearby components rather than standardizing a new radius scale.

## Component Library

- **shadcn/ui** (style: `new-york`, RSC, baseColor slate, Lucide) configured in `components.json`.
- Primitives live in `components/ui/`: avatar, button, command, dialog, dropdown-menu, input, label, popover, select, sonner.
- Add new primitives via the shadcn workflow into `components/ui/`; do not fork copies elsewhere.
- Feature components at `components/` root: `Header`, `NavItems`, `UserDropdown`, `NotificationBell`, `SearchCommand`, `TradingViewWidget`, `WatchlistButton`.
- Shared form fields: `components/forms/*` with react-hook-form.
- Icons: Lucide React in shadcn/header patterns; some watchlist SVGs are inline.

## Layout Patterns

- **App shell**: Sticky/top `Header` (`.header`, height ~70px, `bg-gray-800`) + `container` main (`max-w-screen-2xl`) with vertical padding. Bell sits between nav and user menu (always visible on mobile next to the avatar).
- **Auth**: Split layout (`.auth-layout`) — left form column (~45%), right marketing/testimonial + dashboard preview (~55%) on large screens; stacked on small screens.
- **Dashboard home**: `.home-wrapper` + responsive `.home-section` grids hosting TradingView widgets. Optional one-line `text-sm text-gray-500` subtitle (“Showing your watchlist”) when overview/quotes are personalized — no KPI card grid or CMS chrome.
- **Stock detail**: `.stock-details-container` responsive grid (1 col → 3 col on xl).
- **Search**: Command dialog (`.search-dialog`) triggered from nav; `/search` href in constants is a trigger, not a page route.
- **Notifications**: Header `Popover` inbox (`gray-800` / `gray-700`, yellow unread badge); refresh on open — no websocket / fast polling.
- **Toasts**: Global Sonner `<Toaster />` in root layout.
- **Watchlist / alerts**: CSS for empty states, tables, news cards, and alert dialogs already exists in `globals.css` — reuse those classes for watchlist/alert CRUD; do **not** use alert-dialog CSS for the notification inbox.
## Interaction accents

- Hover/active nav and links lean on `text-yellow-500` / `hover:text-yellow-500`.
- Primary buttons: `.yellow-btn` gradient or solid `yellow-500`.
- Remove-from-watchlist styling: `.watchlist-remove` (red).
- Focus rings on forms: yellow border (`focus:!border-yellow-500`).

## Icons and imagery

- Logo: `/assets/icons/logo.svg` (chart icon + TradePilot wordmark).
- Auth preview: dashboard image assets under `public/assets/images/`.
- Prefer existing asset paths; keep email template imagery consistent when rebranding.

## UI rules for future work

1. Stay dark-first and reuse existing utility classes before adding one-off colors.
2. Keep the first authenticated viewport focused on market widgets — avoid turning `/` into a dense multi-card admin console.
3. New interactive surfaces (watchlist table, alert dialogs) should adopt the pre-written `.watchlist-*` / `.alert-*` utilities where they fit.
4. Do not hardcode a light theme or purple-glow aesthetic that conflicts with the gray/yellow system.
5. When rebranding to TradePilot, update metadata, logo alts, auth copy, and email templates together so UI and email do not diverge further.
