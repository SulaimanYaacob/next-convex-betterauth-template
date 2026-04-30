---
phase: 02
phase_name: home-presence
status: draft
created: 2026-04-30
tool: manual (Radix UI + Tailwind CSS v4 — no shadcn components.json)
---

# UI-SPEC: Phase 02 — Home + Presence

## 1. Design System State

**Tool:** None (no shadcn). Project uses Radix UI primitives with Tailwind CSS v4 `@theme inline` pattern defined in `src/app/globals.css`.

**Registry:** Not applicable — no shadcn, no third-party block registry in use.

**Existing tokens (from globals.css):**
- `--primary`: `oklch(0.6716 0.1368 48.5130)` — amber/orange (light mode)
- `--secondary`: `oklch(0.5360 0.0398 196.0280)` — teal/blue-gray
- `--background`: `oklch(1.0000 0 0)` — white
- `--foreground`: `oklch(0.2101 0.0318 264.6645)` — near-black
- `--muted`: `oklch(0.9670 0.0029 264.5419)` — light gray
- `--muted-foreground`: `oklch(0.5510 0.0234 264.3637)` — medium gray
- `--destructive`: `oklch(0.6368 0.2078 25.3313)` — red
- `--border`: `oklch(0.9276 0.0058 264.5313)` — hairline gray
- `--radius`: `0.75rem` (12px)
- `--font-sans`: Geist Mono (monospace — used throughout)
- `--font-mono`: JetBrains Mono

**Section-specific surface tokens (from PROJECT.md and GuestBanner pattern):**
- Solo section surface: `#f8f6f2` (warm neutral)
- Multiplayer section surface: `#f1f5fb` (soft blue tint — same as GuestBanner background)

---

## 2. Spacing Scale

8-point scale. All spacing uses multiples of 4px only.

| Token | Value | Use |
|-------|-------|-----|
| 4px | `p-1`, `gap-1` | Inline micro-gaps (icon + label) |
| 8px | `p-2`, `gap-2` | Chip padding, badge padding, tight rows |
| 12px | `p-3`, `gap-3` | Card internal padding (compact) |
| 16px | `px-4`, `gap-4` | Standard content padding, nav horizontal padding |
| 24px | `p-6`, `gap-6` | Section internal padding, card grid gap |
| 32px | `py-8` | Section vertical padding |
| 48px | `py-12` | Section top-of-page breathing room |
| 64px | `py-16` | Major section separation |

**Touch targets:** All interactive elements must be `min-h-[44px] min-w-[44px]` (WCAG 2.5.5). This applies to nav icon buttons, filter chips, avatar button, mobile tab bar items.

**Nav height:**
- Desktop: `h-16` (64px)
- Mobile top bar: `h-14` (56px)
- Mobile bottom tab bar: `h-16` (64px) + safe-area inset via `pb-[env(safe-area-inset-bottom)]`

**Page container:** `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` — from CLAUDE.md standard.

---

## 3. Typography

**Font family:** Geist Mono for all body and UI text (already set as `--font-sans`). Sora for logo wordmark only (GamiLogo component uses `var(--font-sora)`).

**Sizes — exactly 4 in use this phase:**

| Role | Size | Weight | Line Height | Tailwind |
|------|------|--------|-------------|---------|
| Section heading | 20px | 600 (semibold) | 1.2 | `text-xl font-semibold tracking-tight` |
| Body / label | 16px | 400 (regular) | 1.5 | `text-base` |
| Small / metadata | 14px | 400 (regular) | 1.5 | `text-sm` |
| Micro / badge | 12px | 600 (semibold) | 1.25 | `text-xs font-semibold` |

**Weights — exactly 2:**
- Regular: 400 (`font-normal`)
- Semibold: 600 (`font-semibold`)

**Coin balance display:** `text-sm font-semibold tabular-nums` — monospaced numerals, semibold. Format: `⟟ 1,240` with comma thousands separator.

**Presence player name in panel:** `text-sm` regular. Status label: `text-xs` regular, muted-foreground color.

---

## 4. Color Contract

### 60/30/10 Split

| Role | % | Value | Elements |
|------|---|-------|---------|
| Dominant surface | 60% | `--background` (white) | Page background, nav background, card background |
| Secondary surfaces | 30% | `#f8f6f2` (solo), `#f1f5fb` (MP) | Section backgrounds, GuestBanner |
| Accent (primary) | 10% | `--primary` (oklch amber/orange) | Active filter chip, active nav tab, coin glyph ⟟, CTA buttons, focus rings |

### Semantic Colors Reserved For

| Color | Variable | Reserved For |
|-------|----------|-------------|
| Primary (orange) | `--primary` | Active chip highlight, mobile bottom tab active indicator, coin ⟟ glyph, primary CTA buttons only |
| Secondary (teal) | `--secondary` | "In-game" presence status dot only |
| Destructive (red) | `--destructive` | Sign-out item in dropdown only (text color, not background) |
| Muted | `--muted` | Skeleton loading states, inactive chip backgrounds |
| Muted-foreground | `--muted-foreground` | Metadata text, helper labels, idle/offline status text |

### Presence Status Dots

Status dots are 8px filled circles overlaid bottom-right of presence avatars.

| Status | Color | Hex |
|--------|-------|-----|
| online | Green | `#22c55e` (Tailwind green-500) |
| in-game | Blue / `--secondary` | `oklch(0.5360 0.0398 196.0280)` |
| idle | Gray | `--muted-foreground` oklch value |
| offline | Not shown in panel (filtered out) | — |

### Section Surface Application

- Solo section: `style={{ backgroundColor: "#f8f6f2" }}` — matches PROJECT.md spec. No Tailwind token mapping needed; use inline style for precision.
- Multiplayer section: `style={{ backgroundColor: "#f1f5fb" }}` — matches GuestBanner pattern. Use inline style.
- Nav background: `bg-background border-b border-border` (white + hairline bottom border).
- Mobile bottom nav: `bg-background border-t border-border` (white + hairline top border).

---

## 5. Component Inventory

### Phase 2 Components to Build

| Component | Path | Reuses |
|-----------|------|--------|
| `AppNav` (desktop top nav) | `src/components/app-nav.tsx` | GamiLogo, Avatar, DropdownMenu, Input |
| `MobileNav` (top bar, mobile) | `src/components/mobile-nav.tsx` | GamiLogo, Avatar |
| `MobileBottomNav` | `src/components/mobile-bottom-nav.tsx` | lucide-react House, ShoppingBag |
| `FilterChips` | `src/components/filter-chips.tsx` | Badge (or plain button) |
| `GameCard` (placeholder) | `src/components/game-card.tsx` | Card |
| `PresencePanel` | `src/components/presence-panel.tsx` | Avatar, Badge |
| `CoinBalance` | `src/components/coin-balance.tsx` | useQuery |
| `HeartbeatProvider` | `src/components/heartbeat-provider.tsx` | useMutation, useEffect |
| Home page | `src/app/page.tsx` | All above |

### Existing Components Already Available

| Component | Location | Phase 2 Use |
|-----------|----------|-------------|
| `GamiLogo` | `src/components/gami-logo.tsx` | Nav logo (size `sm` on mobile, `md` on desktop) |
| `GuestBanner` | `src/components/guest-banner.tsx` | Remains at top of layout for guests |
| `Avatar` | `src/components/ui/avatar.tsx` | Nav avatar, presence panel avatars |
| `DropdownMenu` | `src/components/ui/dropdown-menu.tsx` | Nav avatar dropdown |
| `Badge` | `src/components/ui/badge.tsx` | Genre tags on game cards |
| `Card` | `src/components/ui/card.tsx` | Game card base |
| `Input` | `src/components/ui/input.tsx` | Search bar |
| `Button` | `src/components/ui/button.tsx` | Filter chips (variant="ghost") |

---

## 6. Layout Specifications

### Desktop Nav (`AppNav`) — `hidden md:flex`

```
[ GamiLogo size=md ]   [ Search Input — flex-1, max-w-xl, centered ]   [ CoinBalance ] [ Avatar ]
```

- Outer: `fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16`
- Inner: `w-full max-w-7xl mx-auto px-6 flex items-center gap-4`
- Logo: left, no flex-grow, `shrink-0`
- Search: `flex-1 max-w-xl` centered in the space between logo and right cluster
- Right cluster: `flex items-center gap-3 shrink-0`
- CoinBalance: shown only when authenticated (session user is not anonymous). Hidden entirely for guests — no `⟟ 0` placeholder.
- Avatar: 36px (`size-9`), click opens DropdownMenu

### Mobile Top Bar (`MobileNav`) — `flex md:hidden`

```
[ GamiLogo size=sm ]   [ Avatar ]
```

- `fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14`
- Inner: `w-full px-4 flex items-center justify-between`
- Search bar moves to a full-width row directly below top bar on mobile (separate `div`, `px-4 py-2 bg-background border-b border-border`)
- CoinBalance NOT shown in mobile top bar — coin balance visible via Profile page on mobile only

### Mobile Bottom Tab Bar (`MobileBottomNav`) — `fixed bottom-0 left-0 right-0 z-50 md:hidden`

```
[ Home tab ]   [ Store tab ]
```

- `bg-background border-t border-border h-16 pb-[env(safe-area-inset-bottom)]`
- Two equal-width tabs: `flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]`
- Active tab: icon + label in `--primary` color. Inactive: `--muted-foreground`
- Home: `lucide-react House` icon (size-5) + "Home" label (text-xs)
- Store: `lucide-react ShoppingBag` icon (size-5) + "Store" label (text-xs)
- Store links to `/store` (empty placeholder in Phase 2)

### Filter Chips Strip

```
[ All ] [ Multiplayer ] [ Desktop ] [ Mobile ]
```

- Positioned below the nav (accounts for `pt-16` on desktop, `pt-[calc(56px+48px)]` on mobile for top bar + search row)
- `flex flex-row gap-2 px-4 sm:px-6 lg:px-8 py-3 overflow-x-auto scrollbar-hide`
- Each chip: `px-4 h-9 rounded-full text-sm` — pill shape
- Active chip: `bg-primary text-primary-foreground`
- Inactive chip: `bg-muted text-muted-foreground hover:bg-muted/80`
- Visual-only in Phase 2; no filter behavior. "All" renders as active by default (hardcoded).

### Home Page Layout

```
[ Nav ]
[ Filter Chips ]
─────────────────── Solo section (#f8f6f2) ───────────────────
[ Section heading: "Solo" ]
[ Game card grid ]
─────────────────── Multiplayer section (#f1f5fb) ────────────
[ Section heading: "Multiplayer" ]
[ Game card grid ]
[ Presence panel ]
```

- Sections are full-width; inner content constrained by max-w-7xl container
- Section padding: `py-10 px-4 sm:px-6 lg:px-8`
- Section heading: `text-xl font-semibold mb-6`
- Game card grid: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6`
- Presence panel sits below game cards in Multiplayer section, separated by `mt-8`

### Game Card (Placeholder)

- Base: `Card` component with `rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow`
- Aspect ratio container: `aspect-video bg-muted` (16:9 thumbnail placeholder)
- Content area: `p-4 space-y-2`
- Game name: `text-sm font-semibold` (foreground color)
- Genre tag: `Badge` variant default, `text-xs`
- Hover: `hover:shadow-md transition-shadow duration-200` — no transform/scale (keep minimal)
- Placeholder thumbnail: rounded rectangle filled with `bg-muted animate-pulse` — no image in Phase 2

Hardcoded placeholder games:
- Solo section: "Pixel Rush" (genre: "Arcade"), "Mind Maze" (genre: "Puzzle")
- Multiplayer section: "Pixel Rush MP" (genre: "Arcade"), "Mind Maze Co-op" (genre: "Puzzle")

### Presence Panel

- Container: `rounded-xl border border-border bg-background/60 p-4`
- Heading: `text-sm font-semibold mb-3` — "Online now"
- Layout: horizontal scroll row — `flex flex-row gap-3 overflow-x-auto pb-1`
- Each player entry: `flex flex-col items-center gap-1 shrink-0 w-14`
- Avatar: `size-10` (40px), initials-based (no photo in Phase 2)
- Status dot: `absolute bottom-0 right-0 size-2 rounded-full ring-2 ring-background` — colors per status table above
- Avatar wrapper: `relative` to position dot
- Player name: `text-xs text-muted-foreground truncate w-full text-center`
- Max visible without scroll: 6 players (panel does not paginate in Phase 2)
- Loading state: 4 skeleton avatar circles (`animate-pulse bg-muted rounded-full size-10`)
- Empty state (no one online): Show panel with message "No players online right now" in `text-sm text-muted-foreground text-center py-4`

### CoinBalance Component

- Renders: `⟟ {balance.toLocaleString()}` — e.g. `⟟ 1,240`
- Typography: `text-sm font-semibold tabular-nums`
- Color: `--primary` for the ⟟ glyph, `--foreground` for the number — or full primary color to draw attention
- Loading state (Convex `undefined`): render a skeleton `w-16 h-5 bg-muted animate-pulse rounded`
- Hidden entirely for guests (anonymous session) — component does not render, leaves no space

---

## 7. Interaction Contracts

### Nav Avatar Dropdown

Trigger: click on Avatar in nav. Uses Radix DropdownMenu.

Menu items in order:
1. "Profile" → `/profile` (navigates; Phase 4 destination)
2. "Settings" → `/settings` (navigates; Phase 1 settings page)
3. Separator (`DropdownMenuSeparator`)
4. "Sign out" → calls `authClient.signOut()` then redirect to `/sign-in` — item text in `--destructive` color

Keyboard: Radix handles full keyboard nav. No custom `onKeyDown` needed.

### Filter Chips

- Visual-only. Click on any chip does nothing (or optionally sets local state to show selection visually, but no data filtering occurs).
- "All" chip is active state by default on mount.
- One chip active at a time (radio behavior). Can implement with local `useState<string>` initialized to `"all"`.

### Search Bar

- Renders `Input` component with `placeholder="Search games..."` and `lucide-react Search` icon prefix.
- Visual-only in Phase 2 — no `onChange` handler wired to filtering.
- `type="search"` attribute for accessibility and mobile keyboard hint.
- Desktop: `max-w-xl` width, inside nav.
- Mobile: full-width below top bar, `px-4 py-2`.

### Heartbeat

- `HeartbeatProvider` is a client component mounted in `src/app/layout.tsx` (root layout).
- Calls presence mutation every 15 seconds. Uses `setInterval` in `useEffect`.
- Runs only when session user is authenticated and not anonymous.
- Idle detection: attaches `mousemove`, `keydown`, `scroll`, `click` listeners to `window`. Timer resets on each event. After 3 minutes of silence, sets status to `"idle"`. On event after idle, sets back to `"online"`.
- Cleanup: `clearInterval` and `removeEventListener` on unmount.
- React Compiler is active — no manual `useCallback` on event handlers.

### Coin Balance Real-Time

- Uses `useQuery(api.coinLedger.getBalance)` — subscribes to live Convex data.
- No polling or manual refresh. Convex subscription fires automatically on ledger change.
- `undefined` from `useQuery` = loading → show skeleton. `null` or `0` = valid zero balance → show `⟟ 0`.

---

## 8. States Required Per Component

### AppNav / MobileNav

| State | Visual |
|-------|--------|
| Guest (anonymous) | No CoinBalance, no Avatar dropdown (avatar still shows as generic icon or initials) |
| Authenticated loading | CoinBalance skeleton |
| Authenticated loaded | CoinBalance + Avatar with user initials |

### PresencePanel

| State | Visual |
|-------|--------|
| Loading (`undefined`) | 4 skeleton avatar circles `animate-pulse` |
| Empty (0 online) | "No players online right now" centered text |
| Populated | Horizontal scroll list of player entries |

### GameCard

| State | Visual |
|-------|--------|
| Default | Card with muted thumbnail placeholder + name + genre tag |
| Hover | `shadow-md` (no transform) |
| Focus-visible | `focus-visible:ring-2 focus-visible:ring-ring` |

### FilterChips

| State | Visual |
|-------|--------|
| Active chip | `bg-primary text-primary-foreground` |
| Inactive chip | `bg-muted text-muted-foreground` |
| Hover inactive | `hover:bg-muted/80` |

### MobileBottomNav

| State | Visual |
|-------|--------|
| Home active | Icon + label in `--primary` |
| Store active | Icon + label in `--primary` |
| Inactive tab | Icon + label in `--muted-foreground` |

---

## 9. Copywriting Contract

### Primary CTA

- Nav sign-in prompt (for guests, if added): **"Sign in"** (verb only — no noun needed in nav context)
- Dropdown sign-out: **"Sign out"**
- GuestBanner CTA (already built): **"Create account"**

### Empty States

| Component | Copy |
|-----------|------|
| PresencePanel (0 online) | "No players online right now" |
| Store tab placeholder (Phase 2 nav shell) | (no content needed — page is empty in Phase 2) |

### Error States

| Scenario | Copy |
|----------|------|
| Coin balance query fails | Do not show an error — hide CoinBalance silently (treat as loading). No toast. |
| Presence query fails | Do not show an error in the panel — show empty state copy instead. |
| Sign-out fails | `toast.error("Sign out failed. Try again.")` via Sonner |

### Destructive Action Confirmation

| Action | Confirmation approach |
|--------|----------------------|
| Sign out | No confirmation dialog — direct action. Destructive styling on menu item (red text) is sufficient signal. |

### Section Labels

- Solo section heading: **"Solo"**
- Multiplayer section heading: **"Multiplayer"**
- Presence panel heading: **"Online now"**
- Search placeholder: **"Search games..."**
- Filter chips: **"All"** / **"Multiplayer"** / **"Desktop"** / **"Mobile"**
- Mobile bottom nav: **"Home"** / **"Store"**

---

## 10. Accessibility Contract

- Semantic HTML: `<nav>` for AppNav + MobileBottomNav, `<main>` for page content, `<section>` per home section with `aria-label`
- Section aria-labels: `aria-label="Solo games"` and `aria-label="Multiplayer games"`
- PresencePanel: `role="list"` on the scroll container, `role="listitem"` on each player entry
- Avatar button (nav): `aria-label="Open profile menu"`
- Search input: `aria-label="Search games"` (label hidden, `sr-only` or Input `aria-label`)
- Filter chips: `role="radio"` + `aria-checked` on each chip, `role="radiogroup"` on container — even though visual-only, the radio pattern communicates single-selection
- Status dot: `aria-label="{name}, {status}"` on the avatar wrapper element in presence panel
- Coin balance: `aria-label="Coin balance: {balance} coins"`
- Mobile bottom nav: `aria-current="page"` on the active tab
- Focus rings: `focus-visible:ring-2 focus-visible:ring-ring` — never removed
- Color alone never indicates state: presence status uses dot + text label pair; active chip uses background change + text change together

---

## 11. Responsive Breakpoints

| Breakpoint | Layout change |
|-----------|--------------|
| 0px (mobile) | Mobile top bar + search row below; mobile bottom tab bar; single-column game grid |
| 640px (sm) | 2-column game card grid |
| 768px (md) | Desktop top nav replaces mobile nav; bottom tab bar hidden; 2-column grid |
| 1024px (lg) | 3-column game card grid; wider max-w container padding |
| 1280px (xl) | 4-column game card grid |

**Page body offset for fixed nav:**
- Desktop: `pt-16` (nav height)
- Mobile: `pt-[calc(56px+48px)]` (top bar 56px + search row 48px)

**Mobile body bottom padding:** `pb-16` (bottom nav height) — prevents content hiding behind bottom nav.

---

## 12. Loading Skeleton Pattern

Per CLAUDE.md: Convex `undefined` = loading. Always handle.

All skeletons use: `animate-pulse bg-muted rounded-{shape}`

| Component | Skeleton |
|-----------|---------|
| CoinBalance | `w-16 h-5 rounded` |
| PresencePanel players | 4x `size-10 rounded-full` arranged in flex row |
| (Game cards have hardcoded data — no loading state needed in Phase 2) |

---

## 13. Pre-Population Sources

| Decision | Source |
|----------|--------|
| Section colors `#f8f6f2` / `#f1f5fb` | PROJECT.md + CONTEXT.md D-08 |
| Nav layout (logo / search / balance / avatar) | CONTEXT.md D-01 |
| Coin balance hidden for guests | CONTEXT.md D-02 |
| Avatar dropdown items | CONTEXT.md D-03 |
| Mobile bottom tab bar (Home + Store) | CONTEXT.md D-04 |
| Mobile top nav simplification | CONTEXT.md D-05 |
| Search visual-only | CONTEXT.md D-06 |
| Filter chips visual-only | CONTEXT.md D-07 |
| Hardcoded game cards in Phase 2 | CONTEXT.md D-09 |
| Heartbeat 15s interval | CONTEXT.md D-10 |
| Idle detection 3min threshold | CONTEXT.md D-11 |
| Presence cron 5min stale threshold | CONTEXT.md D-12 |
| Presence panel: online + in-game only | CONTEXT.md D-13 |
| Status dot colors (green/blue/grey) | CONTEXT.md Specifics |
| 8px dot size | CONTEXT.md Specifics |
| Primary color oklch amber | globals.css `--primary` |
| Font: Geist Mono | globals.css `--font-sans` |
| Radius 0.75rem | globals.css `--radius` |
| Touch target 44px | CLAUDE.md WCAG 2.5.5 |
| max-w-7xl container | CLAUDE.md standard container |
| No useMemo/useCallback | CLAUDE.md React Compiler active |
| Coin balance real-time subscription | REQUIREMENTS.md ECON-04 |
| Presence panel in MP section | REQUIREMENTS.md HOME-04 |
| Presence status online/in-game/idle | REQUIREMENTS.md PRES-02 |
| Cron cleanup stale > 5min | REQUIREMENTS.md PRES-03 |
| Presence panel layout: compact horizontal | CONTEXT.md Claude's Discretion (resolved here) |
| Game card hover: shadow only (no scale) | Claude's Discretion — V2 Refined minimal aesthetic |
| Empty state copy | Claude's Discretion |
| Error state behavior (silent for balance/presence) | Claude's Discretion |

---

*Phase: 02-home-presence*
*UI-SPEC created: 2026-04-30*
*Status: draft — awaiting checker validation*
