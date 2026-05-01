---
phase: 03
phase_name: game-shell-earn
status: approved
created: 2026-05-01
tool: manual (Radix UI + Tailwind CSS v4 — no shadcn components.json)
---

# UI-SPEC: Phase 03 — Game Shell + Earn

## 1. Design System State

**Tool:** None (no shadcn). Project uses Radix UI primitives with Tailwind CSS v4 `@theme inline` pattern defined in `src/app/globals.css`. Identical to Phase 02.

**Registry:** Not applicable — no shadcn, no third-party block registry in use.

**Existing tokens (from globals.css — unchanged from Phase 02):**
- `--primary`: `oklch(0.6716 0.1368 48.5130)` — amber/orange
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

**Phase 03 overlay-specific surfaces:**
- ESC overlay dim: `rgba(0, 0, 0, 0.75)` — semi-transparent black, covers full viewport
- Reward screen overlay: `rgba(0, 0, 0, 0.90)` — heavier dim, game is done; full-screen
- Overlay panel (ESC menu card): `--background` white with `border border-border shadow-xl rounded-2xl`
- Reward panel: `--background` white with `border border-border shadow-2xl rounded-2xl`

---

## 2. Spacing Scale

8-point scale. Identical to Phase 02. All spacing uses multiples of 4px only.

| Token | Value | Use |
|-------|-------|-----|
| 4px | `p-1`, `gap-1` | Icon + label micro-gaps |
| 8px | `p-2`, `gap-2` | Button internal padding (compact), badge padding |
| 16px | `px-4`, `gap-4` | Standard content padding, overlay panel horizontal padding |
| 24px | `p-6`, `gap-6` | Overlay panel internal padding, reward screen section gaps |
| 32px | `py-8` | Reward screen vertical breathing room |
| 48px | `py-12` | Reward screen top/bottom padding |
| 64px | `py-16` | Not used in this phase |

**Touch targets:** All interactive elements must be `min-h-[44px] min-w-[44px]` (WCAG 2.5.5). Critical for:
- ESC overlay buttons (Resume, Settings, Back to Lobby)
- Mobile floating pause button
- Reward screen "Back to Home" button

**Floating pause button size:** 44px × 44px minimum touch target. Rendered as a `size-11` (44px) rounded circle.

**Overlay panel width:**
- Mobile: `w-[calc(100vw-32px)]` max `max-w-sm`
- Desktop: `w-80` (320px) fixed

---

## 3. Typography

**Font family:** Geist Mono for all UI text. Consistent with Phase 02. No new font families in this phase.

**Sizes — exactly 4 in use this phase:**

| Role | Size | Weight | Line Height | Tailwind |
|------|------|--------|-------------|---------|
| Reward coins earned (hero) | 48px | 600 (semibold) | 1.1 | `text-5xl font-semibold tabular-nums` |
| Overlay heading / reward label | 20px | 600 (semibold) | 1.2 | `text-xl font-semibold tracking-tight` |
| Button / body | 16px | 400 (regular) | 1.5 | `text-base` |
| Small / metadata / balance | 14px | 400 (regular) | 1.5 | `text-sm` |

**Weights — exactly 2 (same as Phase 02):**
- Regular: 400 (`font-normal`)
- Semibold: 600 (`font-semibold`)

**Coin display in reward screen:** `text-5xl font-semibold tabular-nums` for the session-earned amount. `text-sm font-semibold tabular-nums` for the updated total balance (reuses CoinBalance component).

**Reward coin glyph:** ⟟ rendered in `--primary` color, same as nav coin balance convention from Phase 02.

---

## 4. Color Contract

### 60/30/10 Split (game shell context)

| Role | % | Value | Elements |
|------|---|-------|---------|
| Dominant surface | 60% | `rgba(0,0,0,0.75–0.90)` | Full-screen overlay dim behind ESC panel and reward panel |
| Secondary surfaces | 30% | `--background` (white) | ESC overlay card, reward screen card |
| Accent (primary) | 10% | `--primary` (oklch amber/orange) | Coin ⟟ glyph in reward screen, "Back to Home" CTA button, focus rings |

### Semantic Colors Reserved For

| Color | Variable | Reserved For |
|-------|----------|-------------|
| Primary (orange) | `--primary` | Coin ⟟ glyph, "Back to Home" CTA only |
| Secondary (teal) | `--secondary` | "In-game" presence status dot (inherited from Phase 02 — not new UI in this phase) |
| Destructive (red) | `--destructive` | NOT used in Phase 03 (no destructive actions in game shell) |
| Muted | `--muted` | Settings button disabled state, iframe loading skeleton, floating pause button background |
| Muted-foreground | `--muted-foreground` | "Settings" disabled label, metadata text in overlay |

### Floating Pause Button

- Background: `bg-black/40` (semi-transparent black) with `backdrop-blur-sm`
- Icon: white (`text-white`) — `lucide-react Pause` icon
- Hover: `bg-black/60`
- Position: overlaid on top of viewport, NOT inside iframe

### ESC Overlay Panel Buttons

| Button | Visual Treatment |
|--------|-----------------|
| Resume | `variant="default"` — primary filled button (`bg-primary text-primary-foreground`) |
| Settings (disabled) | `variant="outline"` + `disabled` attribute — `opacity-50 cursor-not-allowed` |
| Back to Lobby | `variant="ghost"` — text-only, `text-muted-foreground hover:text-foreground` |

### Reward Screen

- Dim: `rgba(0,0,0,0.90)` — heavier than ESC overlay (game is over, not paused)
- Card: `bg-background rounded-2xl border border-border shadow-2xl`
- Coins earned: `--primary` color for ⟟ glyph, `--foreground` for number
- Updated balance row: reuses `CoinBalance` component styles from Phase 02

---

## 5. Component Inventory

### Phase 3 New Components

| Component | Path | Reuses |
|-----------|------|--------|
| `GameShell` (page container) | `src/app/play/[slug]/page.tsx` | none (new route) |
| `GameIframe` (fullscreen iframe) | `src/components/game-iframe.tsx` | none |
| `EscOverlay` (pause overlay) | `src/components/esc-overlay.tsx` | Button, Dialog or portal |
| `FloatingPauseButton` (mobile) | `src/components/floating-pause-button.tsx` | lucide Pause |
| `RewardScreen` (post-game overlay) | `src/components/reward-screen.tsx` | CoinBalance, Button |

### Existing Components Reused in Phase 3

| Component | Location | Phase 3 Use |
|-----------|----------|-------------|
| `CoinBalance` | `src/components/coin-balance.tsx` | Reward screen — updated total balance display |
| `Button` | `src/components/ui/button.tsx` | ESC overlay actions + reward CTA |
| `Dialog` | `src/components/ui/dialog.tsx` | Optional base for ESC overlay portal management |
| `GameCard` | `src/components/game-card.tsx` | Wired to real Convex data; add `slug` prop + click navigation |

---

## 6. Layout Specifications

### `/play/[slug]` — Game Page

Full-page route. No nav bar. No footer. Zero chrome.

```
[ Viewport: 100vw × 100vh ]
  ├── [ GameIframe: position:absolute inset-0 w-full h-full ]
  ├── [ EscOverlay: position:fixed inset-0 z-50 — hidden unless active ]
  └── [ FloatingPauseButton: position:fixed bottom-6 right-4 z-40 — mobile only (md:hidden) ]
```

- Page wrapper: `relative w-screen h-screen overflow-hidden bg-black` — black base handles iframe letterboxing on unusual aspect ratios
- Body scroll locked on this page: `overflow: hidden` on `<html>` and `<body>` — applied via `useEffect` on mount, cleaned up on unmount
- Page-level `pt-0` — no nav offset; this route has no nav

### GameIframe

```html
<iframe
  src="{iframeUrl}"
  sandbox="allow-scripts allow-same-origin"
  allow="fullscreen"
  className="absolute inset-0 w-full h-full border-0"
  title="{gameName}"
/>
```

- `sandbox="allow-scripts allow-same-origin"` — GAME-01 requirement
- `border-0` — remove default iframe border
- Loading state: while `iframeLoaded === false`, render a full-screen skeleton overlay: `absolute inset-0 bg-black flex items-center justify-center` with a centered spinner (`animate-spin` lucide `Loader2` icon, `size-8 text-muted-foreground`)
- `onLoad` fires → set `iframeLoaded = true` → remove skeleton overlay → send `SESSION_INIT` postMessage

### EscOverlay

Triggered by: keyboard ESC key (`keydown` listener on `window`) OR tap of FloatingPauseButton.

```
[ Full-screen dim: fixed inset-0 z-50 bg-black/75 backdrop-blur-sm ]
  └── [ Panel: absolute centered, w-80 max-w-[calc(100vw-32px)] ]
        ├── [ Heading: "Paused" ]
        ├── [ Resume button — full width ]
        ├── [ Settings button — full width, disabled ]
        └── [ Back to Lobby button — full width ]
```

- Panel centering: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
- Panel: `bg-background rounded-2xl border border-border shadow-xl p-6 flex flex-col gap-4`
- Heading: `text-xl font-semibold tracking-tight text-center mb-2`
- Each button: `w-full min-h-[44px]`
- Entry animation: panel fades in from scale 95% → 100% + opacity 0 → 1, `duration-150 ease-out`
- Exit animation: reverse — scale 100% → 95% + opacity 1 → 0, `duration-100 ease-in`
- Dim fades: opacity 0 → 1 on enter, 1 → 0 on exit, same duration as panel
- Use `tw-animate-css` classes already in project: `animate-in fade-in zoom-in-95 duration-150` / `animate-out fade-out zoom-out-95 duration-100`

### FloatingPauseButton

Mobile only. Visible outside the iframe, overlaid on top of the viewport corner.

```
[ position: fixed, bottom: 24px (6), right: 16px (4) ]
[ size: 44px × 44px (size-11) ]
[ shape: rounded-full ]
[ bg: bg-black/40 backdrop-blur-sm ]
[ icon: lucide Pause, size-5, text-white ]
[ hover: bg-black/60 ]
[ touch: min-h-[44px] min-w-[44px] — already satisfied by size-11 ]
```

- `className="md:hidden fixed bottom-6 right-4 z-40 flex items-center justify-center size-11 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"`
- `aria-label="Pause game"`
- Tap triggers `setEscOpen(true)` — same state as keyboard ESC
- Pointer events pass through to game ONLY when button is not rendered (it is rendered absolutely outside the iframe, so there is no overlap concern)

### RewardScreen

Full-screen overlay. Replaces the game view after `GAME_OVER` postMessage is received. Game is done — heavier dim.

```
[ Full-screen overlay: fixed inset-0 z-60 bg-black/90 ]
  └── [ Panel: absolute centered ]
        ├── [ "Game Over" label — small muted text ]
        ├── [ Coins earned hero: ⟟ {earned} ]
        ├── [ Separator ]
        ├── [ "Total balance" label ]
        ├── [ CoinBalance component — updated live ]
        └── [ "Back to Home" button ]
```

- Overlay z-index: `z-60` — above EscOverlay (`z-50`) since reward screen terminates the session
- Panel: `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 max-w-[calc(100vw-32px)] bg-background rounded-2xl border border-border shadow-2xl p-8 flex flex-col items-center gap-4 text-center`
- "Game Over" label: `text-sm text-muted-foreground uppercase tracking-wider`
- Coins earned: `text-5xl font-semibold tabular-nums` — ⟟ in `text-primary`, number in `text-foreground`
- Separator: `w-full border-t border-border my-2`
- "Total balance" label: `text-sm text-muted-foreground`
- CoinBalance component: reused as-is (shows live updated balance from Convex subscription)
- "Back to Home" button: `variant="default"` full-width, `min-h-[44px]`, navigates to `/`
- Entry animation: `animate-in fade-in zoom-in-95 duration-200`
- No auto-redirect — D-18 locks this. Player taps "Back to Home" when ready.
- Coins earned display: if `earned === 0`, show `⟟ 0` with muted copy "No coins this round" — do not hide the earned row.

---

## 7. Interaction Contracts

### Keyboard ESC

- `window.addEventListener('keydown', handleKeyDown)` in `GameShell` component
- `handleKeyDown`: if `event.key === 'Escape'` → toggle `escOpen` state
- ESC while overlay open → closes overlay (Resume behavior)
- ESC while overlay closed → opens overlay
- React Compiler active — no `useCallback` on handler. Attach directly in `useEffect`.
- Cleanup: `removeEventListener` on unmount

### ESC Overlay Actions

| Button | Action |
|--------|--------|
| Resume | `setEscOpen(false)` — dismiss overlay, game continues behind it |
| Settings | Disabled button — `disabled` attribute prevents click. No action. Shows tooltip or "Coming soon" on hover if desired (optional). |
| Back to Lobby | Triggers synthetic GAME_OVER: calls `handleGameOver({ score: lastScore ?? 0, gameId: slug })` — this is the same handler as postMessage GAME_OVER. Reward screen shows before navigation. |

### postMessage Handling

All event handling lives in `GameShell` via a single `window.addEventListener('message', handleMessage)` in `useEffect`.

```
message event received →
  1. Validate origin against NEXT_PUBLIC_ALLOWED_GAME_ORIGINS
  2. If invalid origin → ignore (no error thrown)
  3. Parse event.data.type:
     GAME_STARTED → call presenceMutation to set status "in-game"
     SCORE_UPDATE → store score in local state (for "Back to Lobby" synthetic GAME_OVER)
     GAME_OVER    → setEscOpen(false), call awardCoins mutation, setRewardData, setRewardOpen(true)
```

- `NEXT_PUBLIC_ALLOWED_GAME_ORIGINS` is comma-split, trimmed, stored in a `Set` — O(1) lookup per message
- Invalid origin: silently ignored. No console warning in production (prevents origin fingerprinting).
- Cleanup: `removeEventListener` on unmount

### SESSION_INIT Dispatch

- Triggered in `onLoad` callback of the `<iframe>` element
- `iframeRef.current.contentWindow.postMessage({ type: 'SESSION_INIT', userId, sessionId }, targetOrigin)`
- `targetOrigin`: set to the game's specific origin (parsed from `iframeUrl`) — not `'*'`
- Only dispatched once per mount. Guard with a `sessionInitSent` ref.

### Floating Pause Button

- Tap: `setEscOpen(true)` — opens ESC overlay
- No long-press behavior
- Does not interfere with game pointer events (positioned outside iframe DOM)

### Back to Home Navigation

- Triggered by "Back to Home" button in `RewardScreen`
- Uses `router.push('/')` (Next.js App Router)
- Presence status reset to `"online"` triggered here — call presence mutation before or after navigation (fire-and-forget; no await needed)

### GameCard Click (Home Page — Phase 3 wiring)

- Each `GameCard` receives `slug` prop from Convex `gameCatalog` data
- Click handler: `router.push('/play/${slug}')`
- Card is a `<div>` with `role="button"` OR wraps content in a `<Link href="/play/${slug}">` — prefer `<Link>` for semantic correctness and prefetching
- Keyboard: `<Link>` handles Enter/Space natively via browser

---

## 8. States Required Per Component

### GameShell / GameIframe

| State | Visual |
|-------|--------|
| Loading (iframe not yet loaded) | Full-screen black bg + centered `animate-spin Loader2` icon, `size-8 text-muted-foreground` |
| Active (game running) | iframe fills viewport, floating pause button visible on mobile |
| Paused (ESC overlay open) | iframe visible but dimmed behind overlay (dim is the overlay background — iframe not actually paused; game must handle pause internally on receiving no input) |
| Game over (reward screen open) | RewardScreen overlay covers everything |
| Error (slug not found in gameCatalog) | Centered error message: "Game not found." + "Back to Home" link — see §9 copywriting |

### EscOverlay

| State | Visual |
|-------|--------|
| Hidden | `display: none` or conditional render (not in DOM) |
| Open | Full-screen dim + panel, entry animation |
| Settings hover (disabled) | Optional: Radix `Tooltip` "Coming soon" — if not implemented, leave as silent disabled |

### FloatingPauseButton

| State | Visual |
|-------|--------|
| Idle | `bg-black/40 backdrop-blur-sm` |
| Hover / pressed | `bg-black/60` |
| ESC overlay open | Button remains visible (user may tap it again to close — acts as toggle) |

### RewardScreen

| State | Visual |
|-------|--------|
| Hidden | Not in DOM |
| Open — coins earned > 0 | Hero: `⟟ {earned}` in `text-5xl text-primary/foreground`. CoinBalance shows live total. |
| Open — coins earned = 0 | Hero: `⟟ 0` (muted), subtitle: "No coins this round" in `text-sm text-muted-foreground` |
| CoinBalance loading (Convex undefined) | Skeleton `w-16 h-5 bg-muted animate-pulse rounded` (inherited from CoinBalance component) |

### GameCard (updated in Phase 3)

| State | Visual |
|-------|--------|
| Loading (gameCatalog undefined) | Skeleton cards: `aspect-video bg-muted animate-pulse rounded-xl` — render 4 skeleton cards in same grid layout |
| Empty (0 games returned) | Empty state per section — see §9 copywriting |
| Default | Card with thumbnailUrl image (or muted placeholder if `thumbnailUrl` null) + name + genre Badge |
| Hover | `hover:shadow-md transition-shadow duration-200` |
| Focus-visible | `focus-visible:ring-2 focus-visible:ring-ring` |

---

## 9. Copywriting Contract

### Primary CTAs

| Action | Label |
|--------|-------|
| Return from reward screen | **"Back to Home"** |
| ESC overlay dismiss | **"Resume"** |
| ESC overlay quit | **"Back to Lobby"** |
| ESC overlay settings | **"Settings"** (disabled state) |

### Empty States

| Component | Copy |
|-----------|------|
| Game card section (0 solo games) | "No games available yet." |
| Game card section (0 multiplayer games) | "No multiplayer games available yet." |
| Reward screen earned = 0 | "No coins this round" (subtitle under `⟟ 0`) |

### Error States

| Scenario | Copy |
|----------|------|
| `/play/[slug]` — slug not found in gameCatalog | "Game not found." + `text-sm text-muted-foreground` below: "This game doesn't exist or has been removed." + "Back to Home" link |
| `/play/[slug]` — gameCatalog query loading | Show iframe loading skeleton (no error state — not yet confirmed absent) |
| Coin award mutation fails | `toast.error("Couldn't save your coins. Your progress is not lost — contact support.")` via Sonner. Show reward screen anyway with earned display (optimistic). |
| postMessage from unknown origin | Silent ignore — no visible error to player |

### Informational Labels

| Element | Copy |
|---------|------|
| EscOverlay heading | **"Paused"** |
| RewardScreen game-over label | **"Game Over"** |
| RewardScreen coins earned label | **"Coins Earned"** |
| RewardScreen total balance label | **"Total Balance"** |
| Settings disabled tooltip (optional) | **"Coming soon"** |
| Iframe loading indicator (sr-only) | **"Loading game..."** |

### Destructive Actions

No destructive actions in this phase. "Back to Lobby" is not destructive in Phase 3 — by D-09, coins are credited before navigation so no progress is lost. No confirmation dialog needed.

---

## 10. Accessibility Contract

- `/play/[slug]` page: `<main>` wraps the game shell; `aria-label="Game: {gameName}"`
- GameIframe: `title="{gameName}"` attribute on `<iframe>` element (required for accessibility)
- FloatingPauseButton: `aria-label="Pause game"` — icon-only button must have explicit label
- EscOverlay: when open, trap focus inside panel (Resume button receives focus on open). `role="dialog"` + `aria-modal="true"` + `aria-label="Game paused"` on panel. Keyboard ESC closes.
- EscOverlay buttons: standard `<button>` elements — full keyboard support via browser defaults
- Settings disabled button: `disabled` attribute + `aria-disabled="true"` (redundant but explicit for AT)
- RewardScreen: `role="dialog"` + `aria-modal="true"` + `aria-label="Game over — reward summary"`. Focus trapped inside. "Back to Home" button receives focus on open.
- Coin earned display: `aria-label="Coins earned this session: {earned}"` on the hero element
- CoinBalance (reused): `aria-label="Coin balance: {balance} coins"` — inherited from Phase 02 contract
- Focus rings: `focus-visible:ring-2 focus-visible:ring-ring` — never removed
- Color alone never indicates state: disabled Settings button uses `opacity-50` visual + `disabled` semantic together
- Keyboard-only path: ESC key opens overlay → Tab to Resume → Enter to resume OR Tab to Back to Lobby → Enter to quit. Full keyboard game exit flow works without mouse.

---

## 11. Responsive Breakpoints

This phase introduces a new route (`/play/[slug]`) that is fullscreen-only. No multi-column grid layouts.

| Breakpoint | Layout change |
|-----------|--------------|
| 0px (mobile) | FloatingPauseButton visible (`md:hidden`). ESC overlay panel full-width minus 32px margin. |
| 768px (md) | FloatingPauseButton hidden (`hidden md:hidden` — but ESC keyboard still works). Overlay panel fixed 320px width. |

**Home page game card grid breakpoints** (unchanged from Phase 02 spec — Phase 3 wires real data but grid layout is identical):
- 0px: 1-column
- 640px (sm): 2-column
- 1024px (lg): 3-column
- 1280px (xl): 4-column

**Overlay z-index stack:**
- FloatingPauseButton: `z-40`
- EscOverlay: `z-50`
- RewardScreen: `z-60`

---

## 12. Loading Skeleton Pattern

Per CLAUDE.md: Convex `undefined` = loading. Always handle.

All skeletons use: `animate-pulse bg-muted rounded-{shape}`

| Component | Skeleton |
|-----------|---------|
| GameIframe (iframe not yet loaded) | `absolute inset-0 bg-black flex items-center justify-center` with `animate-spin Loader2 size-8 text-muted-foreground` |
| GameCard (gameCatalog loading) | 4× card skeletons: `rounded-xl overflow-hidden` with `aspect-video bg-muted animate-pulse` + content area `p-4 space-y-2` with `h-4 w-2/3 bg-muted rounded` and `h-3 w-1/3 bg-muted rounded` |
| CoinBalance in RewardScreen | `w-16 h-5 bg-muted animate-pulse rounded` (inherited from Phase 02 CoinBalance behavior) |

---

## 13. Animation Contract

Use `tw-animate-css` classes already available in project (imported in globals.css as `@import "tw-animate-css"`).

| Element | Enter | Exit |
|---------|-------|------|
| EscOverlay dim | `animate-in fade-in duration-150` | `animate-out fade-out duration-100` |
| EscOverlay panel | `animate-in fade-in zoom-in-95 duration-150` | `animate-out fade-out zoom-out-95 duration-100` |
| RewardScreen overlay | `animate-in fade-in duration-200` | not animated on exit (page navigates away) |
| RewardScreen panel | `animate-in fade-in zoom-in-95 duration-200 delay-75` | not animated on exit |
| iframe loading → loaded | Skeleton fades out: `animate-out fade-out duration-300` then `display: none` |

No coin animation (no flying coins, no counter increment animation) in Phase 03. Display the final earned number directly. Animations for coin earn deferred to Phase 4+ cosmetics layer.

---

## 14. Pre-Population Sources

| Decision | Source |
|----------|--------|
| Fullscreen iframe, zero chrome | CONTEXT.md D-01 |
| ESC overlay: full-screen dim, 3 actions | CONTEXT.md D-07 |
| Settings = placeholder, disabled | CONTEXT.md D-08 |
| Back to Lobby → GAME_OVER → reward screen | CONTEXT.md D-09 |
| Mobile pause button: corner, outside iframe | CONTEXT.md D-10 |
| postMessage contract (GAME_OVER, GAME_STARTED, SCORE_UPDATE, SESSION_INIT) | CONTEXT.md D-11, D-12 |
| Origin validation via env var | CONTEXT.md D-13 |
| Reward screen: coins earned + total balance, no auto-redirect | CONTEXT.md D-18 |
| Coin ⟟ glyph in primary color | Phase 02 UI-SPEC §3 + §4 |
| CoinBalance component reuse | CONTEXT.md code_context |
| Touch target 44px | CLAUDE.md WCAG 2.5.5 |
| No useMemo/useCallback | CLAUDE.md React Compiler active |
| sandbox="allow-scripts allow-same-origin" | REQUIREMENTS.md GAME-01 |
| Floating pause button (mobile) | REQUIREMENTS.md GAME-04 |
| Server-derived coins, never client | REQUIREMENTS.md GAME-03, CONTEXT.md D-14 |
| ECON-03: reward screen with earned + balance | REQUIREMENTS.md ECON-03 |
| Overlay panel width, animations, dim opacity | Claude's Discretion (locked in this spec) |
| Pause button position (fixed bottom-6 right-4) | Claude's Discretion — reachable thumb zone on mobile |
| Pause button visual (bg-black/40 backdrop-blur-sm) | Claude's Discretion — visible over any game color scheme |
| Error state for bad slug | Claude's Discretion |
| coin award toast on mutation failure | Claude's Discretion — per CLAUDE.md Sonner toast.error convention |
| Reward screen entry animation | Claude's Discretion — consistent with ESC overlay pattern |
| No coin counter animation in Phase 03 | Claude's Discretion — deferred to Phase 4 cosmetics layer |

---

*Phase: 03-game-shell-earn*
*UI-SPEC created: 2026-05-01*
*Status: draft — awaiting checker validation*
