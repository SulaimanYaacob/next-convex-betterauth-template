# Roadmap: Gami

**Project:** Gami gaming platform
**Total phases:** 5
**v1 requirements:** 30
**Granularity:** Coarse

---

## Phases

- [x] **Phase 1: Foundation** — Schema lock, auth UI with guest mode, coin ledger table
- [ ] **Phase 2: Home + Presence** — V2 Refined home layout, real-time presence, nav coin balance
- [ ] **Phase 3: Game Shell + Earn** — iframe embedding, ESC overlay, coin earn via postMessage
- [ ] **Phase 4: Cosmetics + Store + Profile** — Full earn-spend-equip loop
- [ ] **Phase 5: Payments** — Stripe coin purchases, real-money economy

---

## Phase Details

### Phase 1: Foundation
**Goal:** The data model is locked and users can authenticate (or play as guest) with all schema constraints correct from day one
**Depends on:** Nothing (first phase)
**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, ECON-01, PRES-01
**Success Criteria** (what must be TRUE):
  1. A new user can create an account with email and password and stay signed in across browser refresh
  2. A returning user can sign in and their session persists without re-entering credentials
  3. A visitor can click "Play as Guest" and enter a game without any registration step
  4. A guest who later registers keeps their session continuity (no progress reset)
  5. The Convex schema has coinTransactions, presence, storeItems, ownedItems, equippedItems, and games tables with correct indexes — no schema migrations needed in later phases
**Plans**: 4 plans
- [x] 01-01-PLAN.md — Convex schema lock (7 tables) + sync hooks + presence mutation + onLinkAccount
- [x] 01-02-PLAN.md — UI primitives: GamiLogo, GuestBanner, (unauth) layout
- [x] 01-03-PLAN.md — Auth pages: sign-in + sign-up with Play as Guest
- [x] 01-04-PLAN.md — Proxy hardening + home placeholder

**UI hint**: yes

---

### Phase 2: Home + Presence
**Goal:** Players land on a home page that looks like Gami, see who is online in multiplayer, and can always see their coin balance in the nav
**Depends on:** Phase 1
**Requirements:** HOME-01, HOME-02, HOME-03, HOME-04, PRES-02, PRES-03, ECON-04
**Success Criteria** (what must be TRUE):
  1. Home page renders the V2 Refined spotlight layout: Solo section with neutral background, Multiplayer section with soft blue tint
  2. The nav shows a global search bar, filter chips (All / Multiplayer / Desktop / Mobile), and the authenticated user's coin balance (⟟) that updates in real time
  3. The Multiplayer section shows a live presence panel with player online/in-game/idle status
  4. Idle status triggers client-side after 3 minutes of inactivity; a Convex cron marks stale rows offline after 5 minutes to handle tab crashes
**Plans**: TBD
**UI hint**: yes

---

### Phase 3: Game Shell + Earn
**Goal:** Players can launch any game into fullscreen, pause and return to lobby via ESC, and earn coins when they finish a session
**Depends on:** Phase 1, Phase 2
**Requirements:** GAME-01, GAME-02, GAME-03, GAME-04, ECON-02, ECON-03
**Success Criteria** (what must be TRUE):
  1. Clicking a game card loads the game in a fullscreen iframe with correct sandbox attributes; no platform chrome is visible during play
  2. Pressing ESC (or tapping pause on mobile) opens an overlay with Resume, Settings, and Back to Lobby; the game canvas fills the viewport on mobile
  3. When a game session ends, the platform receives a GAME_OVER postMessage, validates the origin, derives coin award server-side (score-based formula, per-session cap), and credits the player's ledger via internalMutation — the client never supplies a coin amount
  4. A post-game reward screen shows coins earned this session and the updated total balance
**Plans**: TBD
**UI hint**: yes

---

### Phase 4: Cosmetics + Store + Profile
**Goal:** Players can browse the store, buy cosmetics with earned coins, equip them, and see their identity expressed globally across the platform — including visible to others in multiplayer
**Depends on:** Phase 1, Phase 3
**Requirements:** COSM-01, COSM-02, COSM-03, COSM-04, STOR-01, STOR-02, STOR-03, PROF-01, PROF-02, PROF-03
**Success Criteria** (what must be TRUE):
  1. The store page shows a browseable catalog filterable by type (cursor skin, cursor trail, UI theme) with rarity indicators; items already owned are labeled "Owned"
  2. Hovering or selecting a cosmetic plays a live animated preview — cursor trail animates, theme previews in-context — before any purchase is made
  3. Purchasing a cosmetic with coins is atomic: balance debits and the item appears in the player's owned collection in the same mutation; double-click races do not produce duplicate charges
  4. The profile page shows avatar, username, coin balance, three equip slots, and the owned cosmetics grid; equipping a cosmetic from any screen applies it globally across the entire platform instantly
  5. Equipped cursor trails animate following the cursor via a pointer-events:none fixed portal; equipped cursor skins apply via CSS cursor property on the html element; equipped themes apply via data-theme and CSS custom properties with no flash of unstyled content
  6. In multiplayer sessions, other players' equipped cosmetics are visible in real time — their cursor skin and trail render on screen
**Plans**: TBD
**UI hint**: yes

---

### Phase 5: Payments
**Goal:** Players can purchase coin packs with real money via Stripe Checkout; coins are credited exactly once even if the webhook fires multiple times
**Depends on:** Phase 4
**Requirements:** STOR-04
**Success Criteria** (what must be TRUE):
  1. Clicking "Buy Coins" opens a Stripe hosted Checkout page with the selected coin bundle; no payment data touches Next.js or Convex directly
  2. After a successful payment, coins appear in the player's balance within seconds; the success page shows "coins arriving shortly" rather than fulfilling from the redirect
  3. If Stripe replays the webhook, the second call is a no-op (idempotency guard using stripeSessionId); the player's balance is never double-credited
  4. The Stripe webhook is received by a Convex httpAction reading the raw request body via req.bytes() before signature verification; it never routes through a Next.js API route
**Plans**: TBD
**UI hint**: no

---

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-04-26 |
| 2. Home + Presence | 0/? | Not started | - |
| 3. Game Shell + Earn | 0/? | Not started | - |
| 4. Cosmetics + Store + Profile | 0/? | Not started | - |
| 5. Payments | 0/? | Not started | - |

---

## Coverage

| Requirement | Phase |
|-------------|-------|
| AUTH-01 | 1 |
| AUTH-02 | 1 |
| AUTH-03 | 1 |
| AUTH-04 | 1 |
| ECON-01 | 1 |
| PRES-01 | 1 |
| HOME-01 | 2 |
| HOME-02 | 2 |
| HOME-03 | 2 |
| HOME-04 | 2 |
| PRES-02 | 2 |
| PRES-03 | 2 |
| ECON-04 | 2 |
| GAME-01 | 3 |
| GAME-02 | 3 |
| GAME-03 | 3 |
| GAME-04 | 3 |
| ECON-02 | 3 |
| ECON-03 | 3 |
| COSM-01 | 4 |
| COSM-02 | 4 |
| COSM-03 | 4 |
| COSM-04 | 4 |
| STOR-01 | 4 |
| STOR-02 | 4 |
| STOR-03 | 4 |
| PROF-01 | 4 |
| PROF-02 | 4 |
| PROF-03 | 4 |
| STOR-04 | 5 |

**Mapped: 30/30** — no orphaned requirements.

---

*Roadmap created: 2026-04-25*
