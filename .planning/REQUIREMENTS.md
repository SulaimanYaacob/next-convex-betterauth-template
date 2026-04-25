# Requirements: Zentro

**Defined:** 2026-04-25
**Core Value:** Players want to show off their cosmetics while playing with others — the social display of earned/bought identity is why they stay.

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can create account with email and password
- [ ] **AUTH-02**: User can sign in and session persists across browser refresh
- [ ] **AUTH-03**: User can play as guest without registering (no friction before first game)
- [ ] **AUTH-04**: Guest user can convert to full account (keeps progress)

### Home & Navigation

- [ ] **HOME-01**: Home page shows Solo section and Multiplayer section in V2 Refined spotlight layout (solo neutral, MP soft blue tint)
- [ ] **HOME-02**: Coin balance (⟟) visible in nav bar at all times for authenticated users
- [ ] **HOME-03**: Search bar in nav and filter chip strip (All / Multiplayer / Desktop / Mobile) below nav
- [ ] **HOME-04**: Real-time presence panel in Multiplayer section showing online/in-game/idle players

### Game Shell

- [ ] **GAME-01**: Game loads in fullscreen iframe with `sandbox="allow-scripts allow-same-origin"` attributes
- [ ] **GAME-02**: ESC/pause overlay with Resume, Settings, and Back to Lobby actions (reusable across solo and multiplayer games)
- [ ] **GAME-03**: Game can emit COINS_EARNED events via postMessage; platform validates origin, derives award server-side, and credits via internalMutation
- [ ] **GAME-04**: Mobile in-game layout with tap-friendly pause button; game canvas fills viewport

### Cosmetics System

- [ ] **COSM-01**: Cursor trail cosmetic type — animated trail dots follow cursor via motion library; `pointer-events: none` overlay at root layout level
- [ ] **COSM-02**: Cursor skin cosmetic type — custom cursor image applied via CSS `cursor` property set on `<html>` element
- [ ] **COSM-03**: UI theme cosmetic type — color theme applied globally via CSS custom properties (`data-theme` attribute on `<html>`)
- [ ] **COSM-04**: Equipped cosmetics are broadcast to other players in multiplayer sessions and visible in real-time

### Store

- [ ] **STOR-01**: Store page shows cosmetics catalog browseable by type (cursor, trail, theme) with rarity indicators
- [ ] **STOR-02**: Live animated preview of cosmetic before purchase (trail animates, theme previews in-context)
- [ ] **STOR-03**: User can purchase cosmetic with coins; purchased item immediately appears in owned collection
- [ ] **STOR-04**: User can purchase coin packs with real money via Stripe Checkout; coins credited atomically via Convex httpAction webhook with idempotency guard

### Virtual Economy

- [ ] **ECON-01**: Coin ledger is append-only (`coinLedger` table with signed amount entries; balance = SUM); no mutable balance field
- [ ] **ECON-02**: User earns coins by completing game sessions; award is server-derived from game event, not client-reported; per-session cap enforced
- [ ] **ECON-03**: Post-game reward screen shows coins earned and updated balance
- [ ] **ECON-04**: Coin balance in nav updates in real-time via Convex subscription

### Profile

- [ ] **PROF-01**: Profile page shows avatar, username, and coin balance (minimal one-screen layout)
- [ ] **PROF-02**: Three equip slots (cursor skin, cursor trail, UI theme); equipped cosmetics apply globally across entire platform via CosmeticsApplicator in root layout
- [ ] **PROF-03**: Owned cosmetics grid shows all purchased and earned items with equip/unequip action

### Presence

- [ ] **PRES-01**: Separate `presence` table (not fields on `users`); heartbeat mutation updates `lastSeen` every 15s
- [ ] **PRES-02**: User status: online / in-game / idle; idle detected client-side after 3min inactivity
- [ ] **PRES-03**: Convex cron marks stale presence rows offline (lastSeen > 5min) to handle tab crashes

## v2 Requirements

### Authentication

- **AUTH-V2-01**: OAuth sign-in with Google and GitHub (already configured in Better Auth; defer UI)
- **AUTH-V2-02**: 2FA and magic link sign-in (already in Better Auth; defer UI exposure)

### Economy

- **ECON-V2-01**: Rarity tiers (Common / Rare / Epic / Legendary) with different earn rates and prices
- **ECON-V2-02**: Exclusive earned-only cosmetics (15-20% of catalog; not purchasable with real money)
- **ECON-V2-03**: New player gift coins on first account creation
- **ECON-V2-04**: Set completion bonus (equip all items from a themed set)

### Social

- **SOCL-V2-01**: Friends list and friend invites for multiplayer
- **SOCL-V2-02**: Player profiles viewable by other users

### Platform

- **PLAT-V2-01**: Admin panel for managing store catalog (add/edit/remove cosmetics)
- **PLAT-V2-02**: Multiple games beyond Pixel Rush and Mind Maze
- **PLAT-V2-03**: Leaderboards and session statistics

## Out of Scope

| Feature | Reason |
|---------|--------|
| Building game logic (Pixel Rush, Mind Maze) | Platform shell only — games are external; game logic lives outside this repo |
| Native mobile app | Web responsive only; mobile browser is sufficient for v1 |
| User-generated cosmetics | Curated store only; UGC adds moderation complexity not in scope |
| Real-time chat | Presence indicators are sufficient social layer for v1 |
| Loot boxes / randomized purchases | Anti-feature — gambling mechanic, increasingly regulated, erodes trust |
| Countdown timers on store items | Dark pattern — explicitly banned by design |
| Energy / stamina gates | Antithetical to core play loop |
| Embedded game payments (in-game IAP) | Coin earn from gameplay only; in-game stores handled at platform level |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 1 | Pending |
| AUTH-04 | Phase 1 | Pending |
| HOME-01 | Phase 2 | Pending |
| HOME-02 | Phase 2 | Pending |
| HOME-03 | Phase 2 | Pending |
| HOME-04 | Phase 2 | Pending |
| GAME-01 | Phase 3 | Pending |
| GAME-02 | Phase 3 | Pending |
| GAME-03 | Phase 3 | Pending |
| GAME-04 | Phase 3 | Pending |
| COSM-01 | Phase 4 | Pending |
| COSM-02 | Phase 4 | Pending |
| COSM-03 | Phase 4 | Pending |
| COSM-04 | Phase 4 | Pending |
| STOR-01 | Phase 4 | Pending |
| STOR-02 | Phase 4 | Pending |
| STOR-03 | Phase 4 | Pending |
| STOR-04 | Phase 5 | Pending |
| ECON-01 | Phase 1 | Pending |
| ECON-02 | Phase 3 | Pending |
| ECON-03 | Phase 3 | Pending |
| ECON-04 | Phase 2 | Pending |
| PROF-01 | Phase 4 | Pending |
| PROF-02 | Phase 4 | Pending |
| PROF-03 | Phase 4 | Pending |
| PRES-01 | Phase 1 | Pending |
| PRES-02 | Phase 2 | Pending |
| PRES-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 30 total
- Mapped to phases: 30
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-25*
*Last updated: 2026-04-25 after initial definition*
