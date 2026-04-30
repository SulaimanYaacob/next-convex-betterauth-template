# Phase 2: Home + Presence - Context

**Gathered:** 2026-04-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Replace the Phase 1 home placeholder with the real V2 Refined spotlight layout (solo + multiplayer sections). Build the global nav (desktop top nav + mobile bottom nav) with coin balance and search bar. Wire real-time presence (heartbeat, idle detection, cron cleanup) and display online/in-game/idle status in the Multiplayer section. Coin balance in nav updates via Convex real-time subscription.

No game logic, no store (nav shell only), no cosmetics. Phase 3 adds game shell; Phase 4 adds store.

</domain>

<decisions>
## Implementation Decisions

### Nav — Desktop Layout
- **D-01:** Top nav layout left-to-right: `[ gami logo ] [ Search... (centered, wide) ] [ ⟟ balance ] [ avatar ]`
- **D-02:** Coin balance (⟟) is on the right side of nav, hidden entirely for guests — no placeholder or ⟟ 0 shown to unauthenticated users.
- **D-03:** Avatar click opens a dropdown menu with: Profile, Settings, Sign out. Uses existing `Avatar` + `DropdownMenu` UI components.

### Nav — Mobile Layout
- **D-04:** Mobile bottom tab bar ships in Phase 2: Home tab + Store tab. Store tab links to `/store` which will be empty/placeholder in Phase 2 — the nav shell exists to avoid rework in Phase 4.
- **D-05:** On mobile, the top nav simplifies: logo + avatar only (search bar collapses or moves). Bottom nav handles Home/Store navigation.

### Search & Filters
- **D-06:** Search bar renders and accepts input in Phase 2 but is **visual-only** — no filtering behavior. Functional search wired in Phase 3+ when real game data exists in Convex.
- **D-07:** Filter chips (All / Multiplayer / Desktop / Mobile) render below the nav. Visual-only in Phase 2 — same reasoning as search.

### Home Layout
- **D-08:** V2 Refined spotlight layout: Solo section on `#f8f6f2` neutral background, Multiplayer section on `#f1f5fb` soft blue tint. Section headers with titles. Carried from Phase 1 design direction.
- **D-09:** Game cards in both sections use hardcoded placeholder data in Phase 2 — no Convex `games` table reads yet. Placeholder cards show name + genre tag as minimum. Real game data wired in Phase 3.

### Presence (PRES-02, PRES-03)
- **D-10:** Heartbeat: client writes `presence` mutation every 15s. Lives in root layout (or auth layout) so it runs on all authenticated pages. Guest users do NOT heartbeat.
- **D-11:** Idle detection: client-side, 3 minutes of no mouse/keyboard/scroll activity → status becomes `"idle"`. Uses `mousemove`, `keydown`, `scroll`, `click` event listeners with a debounced timer.
- **D-12:** Convex cron marks presence rows with `lastSeen > 5 minutes` as `"offline"`. Runs every minute.
- **D-13:** Presence panel in Multiplayer section shows online + in-game players (idle/offline not prominently shown). Visual design: Claude's discretion — compact list with avatar initials and colored status dot.

### Claude's Discretion
- Exact game card dimensions, hover effects, and information density — follow V2 Refined aesthetic (clean, minimal).
- Presence panel exact layout (horizontal scroll vs vertical list, max player count shown).
- Mobile search bar placement — could be a full-width row below the top nav bar on mobile if collapsing into top bar is too tight.
- Loading skeleton pattern for presence panel and coin balance (Convex `undefined` = loading).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Design Direction
- `.planning/PROJECT.md` — V2 Refined layout, color tokens (`#f8f6f2` solo, `#f1f5fb` MP blue), logo, nav description
- `.planning/REQUIREMENTS.md` — HOME-01 through HOME-04, PRES-02, PRES-03, ECON-04 acceptance criteria

### Existing Components
- `src/components/gami-logo.tsx` — Logo component (size sm/md/lg)
- `src/components/guest-banner.tsx` — Guest banner pattern (auth check, dismissible, sticky)
- `src/components/ui/avatar.tsx` — Avatar primitive for user avatar in nav
- `src/components/ui/dropdown-menu.tsx` — Nav avatar dropdown
- `src/components/ui/badge.tsx` — Could be used for status indicators or filter chips
- `src/components/ui/card.tsx` — Game card base

### Auth & Convex Patterns
- `convex/auth.ts` — `getCurrentUser` query, auth user check pattern
- `src/lib/auth-client.ts` — `authClient.useSession()` for client-side session/guest check
- `CLAUDE.md` — Convex patterns; `convex/_generated/ai/guidelines.md` must be read before writing Convex functions
- React Compiler active — no `useMemo`/`useCallback`/`React.memo`

### Schema (from Phase 1)
- `convex/schema.ts` — `presence` table (userId, lastSeen, status), `coinLedger` table (append-only, balance = SUM)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GamiLogo` — ready to use in nav, sizes sm/md/lg
- `GuestBanner` — existing pattern for guest-aware UI; nav coin display can follow same auth check pattern
- `Avatar`, `DropdownMenu`, `Badge`, `Card` — all available in `src/components/ui/`
- `authClient.useSession()` — how to detect guest vs authenticated; `isAnonymous` field on session user
- Sonner toast — already installed for mutation feedback

### Established Patterns
- Convex query returning `undefined` = loading; always handle with skeleton
- `useQuery(api.auth.getCurrentUser)` for current user in client components
- Route groups: `(auth)` = protected, `(unauth)` = public — new nav goes in root layout (wraps both)
- Colors `#f8f6f2` and `#f1f5fb` used in GuestBanner — reuse same hex values in home sections

### Integration Points
- Root `src/app/layout.tsx` — nav component goes here (wraps all routes)
- `src/app/page.tsx` — home page, currently placeholder; Phase 2 replaces it with real layout
- `convex/schema.ts` presence table — heartbeat mutation and cron query against this table
- `convex/http.ts` — if any new HTTP actions needed (unlikely for Phase 2)

</code_context>

<specifics>
## Specific Ideas

- Nav coin display: `⟟ 1,240` — monospaced number with the ⟟ glyph. Real-time via `useQuery(api.coinLedger.getBalance)`.
- Bottom mobile nav: fixed at bottom, `z-50`, `border-t`, two tabs — Home (house icon) + Store (shopping bag icon). Active tab highlighted with primary color.
- Presence status dots: green = online, blue = in-game, grey = idle. Small `8px` dot overlaid on avatar bottom-right.
- Filter chips: pill-shaped toggle buttons below nav. Only one active at a time. Visual-only for now.

</specifics>

<deferred>
## Deferred Ideas

- Game card exact design — discussed as Claude's discretion; real card design matters more in Phase 3 when actual games exist
- Functional search (filter/query games) — Phase 3+
- Functional filter chips — Phase 3+
- Store tab content — Phase 4
- OAuth/social sign-in in dropdown — v2

</deferred>

---

*Phase: 02-home-presence*
*Context gathered: 2026-04-30*
