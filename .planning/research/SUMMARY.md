# Research Summary: Gami Gaming Platform

**Synthesized:** 2026-04-25
**Sources:** STACK.md (HIGH), FEATURES.md (MEDIUM), ARCHITECTURE.md (HIGH), PITFALLS.md (HIGH)
**Overall confidence:** HIGH for technical decisions; MEDIUM for feature prioritization

---

## Executive Summary

Gami is a browser gaming platform whose core value proposition is a social cosmetics economy. Players earn and display cursor skins, cursor trails, and UI themes that are visible to others in multiplayer. The platform hosts games via iframe embedding; it does not own game logic. Research confirms the stack additions needed are minimal: `stripe` (server SDK for Convex actions) and `motion` (cursor trail animation). `next-themes` is already installed and supports arbitrary named themes via the `data-theme` attribute. Everything else -- real-time presence, store UI, cosmetics application -- is achievable with the existing Convex + Next.js + Radix stack.

The recommended architecture centers on five independent subsystems -- Coin Ledger, Cosmetics System, Presence, Game Shell, and Store -- wired together through Convex reactive queries and internal mutations. The single most important architectural constraint is that all coin-affecting operations must live in `internalMutation` functions, never in public mutations or actions. This prevents both client-side cheating and race conditions endemic to split read-write flows in Convex actions. The second most important constraint is that Stripe webhooks must be received by a Convex `httpAction` (not a Next.js route) and must read the raw request body via `req.bytes()` before calling `stripe.webhooks.constructEvent`.

The core feature loop -- guest play, coin earn on game completion, store browse, cosmetic preview, purchase, equip, global render -- is the v1 critical path. Missing any one step breaks the economy loop. Features research confirms that 60-80% of new users abandon browser platforms that require registration before play, and that cosmetics stores without live animated previews convert at roughly 40% of the rate of stores that show items in motion.

---

## Key Findings

### Stack (STACK.md -- HIGH confidence)

**Add to the locked stack:**

| Package | Version | Purpose |
|---------|---------|---------|
| stripe | v19.1.0 | Server-side Stripe SDK; used inside Convex actions and httpActions only |
| motion | current stable | Cursor trail animation via useMotionValue + useSpring; replaces framer-motion (package renamed) |

**Already installed -- no action needed:**

| Package | How it is used |
|---------|---------------|
| next-themes | Arbitrary named themes via themes prop + data-theme on html element |
| convex-helpers | Session-scoped queries for presence (anonymous + authenticated users) |
| Radix UI | Store grid, item modals, all store UI -- no e-commerce library needed |

**Do NOT add:** Pusher/Ably/Socket.io (Convex WebSocket replaces them), Redux/Zustand/Jotai (Convex reactive queries are the state layer; React Compiler handles memoization), @stripe/react-stripe-js (use hosted Checkout, not embedded Elements), React Query/SWR (fights Convex optimistic update system).

**Stripe integration pattern (verified):**
Client calls Convex action to create Checkout Session. User redirects to Stripe hosted page. Stripe fires checkout.session.completed webhook. Convex httpAction reads raw body via req.bytes(), verifies signature, calls internal.ledger.creditCoins with stripeSessionId as idempotency key.

---

### Features (FEATURES.md -- MEDIUM confidence)

**Table stakes -- missing any of these causes users to leave:**

1. Guest play -- no registration before first game; 60-80% abandonment rate if auth is gated before play
2. Single-click game launch -- no interstitial forms before game loads
3. Coin balance always visible in navbar
4. Store accessible from nav in one click; not buried in profile settings
5. Live animated cosmetic preview before purchase -- static thumbnails convert at approx 40% the rate of animated previews
6. Owned items labeled "Owned" in store; prevents duplicate purchase confusion
7. Fullscreen + ESC pause overlay (no page reload required to exit a game)
8. Volume/mute toggle in-game
9. Active player count visible in multiplayer section
10. Equip immediately from purchase confirmation screen

**Key differentiators for v1:**

- End-of-game coin reward screen ("you earned 47 coins") closes the play loop; most browser platforms skip this entirely
- 100 coins gifted on first login reduces cold-start friction; players feel invested before earning anything
- Default cursor trail equipped on signup demonstrates the cosmetics system on the very first visit
- Cosmetics visible to other players in multiplayer -- the social proof loop that makes the economy self-reinforcing
- Rarity tiers (Common/Rare/Epic/Legendary with coin price bands) create aspiration at zero extra code cost once catalog exists

**Economy calibration targets:**
- 10-30 coins per game session (score-based, not time-based)
- Common item (50-150 coins) reachable in 2-3 days of regular play
- Legendary item (1000-2000 coins) reachable in 2-5 weeks -- long enough to retain, short enough not to despair
- 15-20% of catalog as earned-only items (never purchasable) -- preserves prestige for grinders and drives advocacy

**Anti-features -- explicitly exclude:** Pay-to-win items, countdown timers on store items, loot boxes/random-result purchases, energy/stamina gates, mid-game interstitial ads, forced social sharing gates, account required to browse store.

**Defer to v2:** Hoverable player badge, daily login reward, set completion UI, coin gifting to friends.

---

### Architecture (ARCHITECTURE.md -- HIGH confidence)

**Five subsystems and their key tables:**

| Subsystem | Key tables | Core constraint |
|-----------|-----------|----------------|
| Coin Ledger | coinTransactions | Append-only; balance = SUM(amount); never a mutable counter field |
| Cosmetics | storeItems, ownedItems, equippedItems | CSS custom properties via single root-layout component |
| Presence | presence | Separate table from users; heartbeat + cron TTL cleanup |
| Game Shell | games | iframe + postMessage; server derives coin award amounts |
| Store | reads all above | Single atomic purchase mutation |

**Six critical design decisions:**

1. Append-only coin ledger. Every coin change is an INSERT into coinTransactions, never an UPDATE on a balance field. Balance = SUM(amount) per user. For scale: cache coinBalance field updated atomically with each ledger insert. Never call .collect() on unbounded transaction history.

2. Separate presence table. Never put status or lastSeen on the users document. Heartbeat writes every 30 seconds would invalidate ALL Convex queries reading the user document platform-wide -- profile, balance, settings, everything.

3. CSS custom properties for cosmetics. Single CosmeticsApplicator client component lives in root layout, subscribes to api.cosmetics.getEquipped, and writes document.documentElement.style.setProperty(...) and dataset.theme. No React Context (avoids full-tree re-renders on equip change). Cursor trail renders as pointer-events:none, position:fixed, z-index:9999 portal.

4. internalMutation for all coin operations. Coin credit/debit mutations are internalMutation -- not callable from outside the Convex deployment. Stripe webhook and postMessage handler route through ctx.runMutation(internal.ledger.*) only. Never expose financial mutations as public api.* functions.

5. Games report events; server derives coin amounts. Games send { type: "GAME_OVER", score: 142 }. Platform computes coins = Math.min(Math.floor(score / 10), MAX_PER_SESSION). Games never report coin amounts -- that would allow DevTools manipulation.

6. Single atomic purchase mutation. purchaseItem: check unique ownership index, sum ledger for current balance, insert debit row, insert ownedItems row -- all in one Convex mutation. Convex OCC handles concurrent double-click races automatically.

**Build order (dependency-driven critical path):**

Schema + Auth wiring
  -> Coin Ledger (coinTransactions table + queries)
    -> Store Items catalog (storeItems seed data)
      -> Owned Items + Purchase mutation (ownedItems table + purchaseItem)
        -> Equipped Items + equip mutations (equippedItems table)
          -> CosmeticsApplicator, Store UI, Profile page (can be built in parallel)

Presence system (parallel track -- only depends on users table)
  -> Game Shell (depends on Presence + Coin Ledger)
    -> Stripe integration (can be last -- earn-only coins work for early testing)

---

### Pitfalls (PITFALLS.md -- HIGH confidence)

**Top 5 that will cause rewrites if ignored:**

**1. Non-atomic coin credit in Convex actions (CRIT-1)**
Convex actions are not transactions and cannot access ctx.db directly. Never read balance in an action then pass it as newBalance to a mutation. One internalMutation must read AND write balance atomically. Warning sign: any mutation that accepts currentBalance or newBalance as an argument from its caller.

**2. Stripe double-credit on webhook replay (CRIT-2)**
Stripe guarantees at-least-once webhook delivery, not exactly-once. Store stripeSessionId in coinTransactions.referenceId. The creditCoins mutation queries for existing rows with that session ID first; if found, returns early. The idempotency check and the new insert must be in the same mutation (atomic).

**3. Client-controlled coin awards via postMessage (CRIT-3)**
Game iframes can be manipulated from browser DevTools. The server must derive coin amounts from the reported score using a server-side formula, never from a client-supplied coin amount. Enforce MAX_COINS_PER_SESSION and maxCoinsPerDay server-side in the internalMutation.

**4. postMessage origin spoofing (CRIT-4)**
Every window.addEventListener("message", handler) must validate event.origin against an allowlist before processing any message. Never use targetOrigin "*" when posting session data or capabilities to the iframe. Even same-origin games must be explicitly listed.

**5. Presence fields on the users document (PRES-3)**
This violates Convex official guidelines. Heartbeat writes invalidate all subscribers to the user document. A dedicated presence table provides scoped invalidation. This is a schema decision that cannot be refactored cheaply after queries are written -- get it right on day one.

**Additional must-avoid pitfalls:**

| Pitfall | Prevention |
|---------|-----------|
| Fulfill coins from Stripe success URL redirect (PAY-1) | Fulfill only from webhook after signature verification; success page shows "coins arriving shortly" |
| Stripe webhook in a Next.js API route (PAY-2) | Must be a Convex httpAction; use await req.bytes() before calling stripe.webhooks.constructEvent |
| .collect() on unbounded coin transaction history (CVX-3) | Maintain a cached coinBalance field updated atomically with each ledger insert |
| userId from mutation arguments for authorization (CVX-6) | Always ctx.auth.getUserIdentity(); never accept userId as a function argument |
| Cursor trail mousemove without requestAnimationFrame throttle (COSM-1) | Pool DOM nodes; throttle to rAF; use CSS transform not top/left properties |
| Theme flash of unstyled content on page load (COSM-2) | Sync active theme to a cookie; read cookie synchronously in root layout server component |

---

## Implications for Roadmap

### Recommended Phase Structure (7 phases)

**Phase 1 -- Foundation: Schema + Data Model**
Lock the data model before any UI is built. Wrong schema is the most expensive rewrite.
- Deliverables: users table extended, coinTransactions table (append-only, indexed), presence table (separate from users), storeItems, ownedItems, equippedItems, games tables; indexes on all foreign key fields; Better Auth onCreateUser hook creating full user row
- Pitfalls to avoid: PRES-3 (presence on user doc), CVX-5 (missing indexes), CVX-6 (userId from args)
- Research flag: STANDARD PATTERNS

**Phase 2 -- Game Shell + Presence**
The iframe embedding contract and postMessage security must be locked before any game integration. Presence is independent and can be built in parallel.
- Deliverables: /play/[slug] route, GameShell component with sandbox attribute and origin allowlist, fullscreen toggle and ESC overlay, presence heartbeat mutation + cron cleanup, active player count displayed on home page
- Pitfalls to avoid: CRIT-3, CRIT-4, CRIT-5 (iframe sandbox), EMBED-1 (CSP frame-src), PRES-1 (ghost sessions)
- Research flag: STANDARD PATTERNS

**Phase 3 -- Coin Economy (Earn Side)**
Close the left side of the economy loop before building the spend side.
- Deliverables: internalMutation coin award (server-derived formula, session-capped, daily-capped), end-of-game reward screen, coin balance display in navbar, 100-coin first-login gift
- Pitfalls to avoid: CRIT-1 (non-atomic), CRIT-3 (client coin amounts), CVX-2 (public mutation for financial ops), CVX-3 (unbounded collect), ECON-3 (session farming)
- Research flag: STANDARD PATTERNS

**Phase 4 -- Store + Cosmetics (Spend Side)**
Largest phase. Closes the earn-spend loop. This is where the product becomes real.
- Deliverables: store catalog seeded, atomic purchaseItem mutation, CosmeticsApplicator in root layout, cursor trail via motion portal, CSS custom properties for cursor skins and themes, live animated store preview, rarity tier visual treatment
- Pitfalls to avoid: ECON-4 (double purchase race), COSM-1 (trail performance), COSM-2 (theme FOUC), CVX-5 (indexes)
- Research flag: NEEDS RESEARCH PHASE -- cursor trail DOM pool vs canvas approach, live animated preview mechanic, and cookie-sync theme pattern all have implementation complexity worth spiking before committing

**Phase 5 -- Profile Page**
Identity anchor page. Consumes existing subsystems with no new data layer needed.
- Deliverables: username and avatar display, 3 equip slots labeled with rarity color, owned cosmetics grid, coin balance, "Owned" labels in store
- Research flag: STANDARD PATTERNS

**Phase 6 -- Stripe Payments (Real-Money Coins)**
Can be built last; earn-only coins support all early testing. Real-money unlocks the full economy loop.
- Deliverables: Convex httpAction for Stripe webhook, createCheckoutSession Convex action, coin bundle UI, idempotency guard in creditCoins mutation, success page with async coin delivery messaging
- Pitfalls to avoid: CRIT-2 (double-credit), PAY-1 (fulfill on redirect), PAY-2 (wrong runtime for signature), CVX-2 (public mutation for financial ops)
- Research flag: NEEDS RESEARCH PHASE -- Stripe Checkout + Convex httpAction wiring (raw body, internal mutation routing, metadata passing, env var setup) has enough sharp edges to justify a pre-implementation spike

**Phase 7 -- Multiplayer Cosmetics Visibility**
The social proof loop that makes the economy self-reinforcing. Players see others' cosmetics and want them.
- Deliverables: equipped cosmetic slugs broadcast via presence query, other players' cursor skins and trails rendered in the multiplayer view
- Research flag: NEEDS RESEARCH PHASE -- whether cosmetic slugs should live in the presence table (simple, one query) vs a dedicated real-time session-state table (flexible, more complex) is the key open architectural question; validate before building

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack additions | HIGH | Verified against Context7 official docs for stripe-node, motion, next-themes, convex-helpers |
| Convex patterns (ledger, presence, internalMutation) | HIGH | Cross-referenced against Convex official guidelines in convex/_generated/ai/guidelines.md |
| Stripe integration flow | MEDIUM-HIGH | Pattern confirmed in Convex action docs; Convex httpAction wiring not live-verified end-to-end |
| Feature prioritization | MEDIUM | Based on training knowledge of live platforms pre-August 2025; not live-scraped |
| Economy calibration (earn rates, price tiers) | MEDIUM | Based on GDC talks and Naavik analysis; requires live validation after launch |
| Cursor trail rendering approach | MEDIUM | motion library approach is sound; canvas vs DOM pool tradeoff needs a performance spike |
| Multiplayer cosmetics visibility | MEDIUM | Architecture direction is clear; implementation complexity is non-trivial |

**Gaps to address during planning:**

1. Coin earn formula constants (score divisor, per-session cap, daily cap) are product decisions, not technical ones. Placeholder values must be set before Phase 3 and revisited before v1 launch.
2. Game origin allowlist requires an admin-controlled server-side registry in the games table. Dynamic third-party game submissions are v2; v1 only uses games added by the team.
3. Cursor asset format (.cur vs SVG cursor: url() vs base64 data URL) has inconsistent browser support. Needs a spike before CosmeticsApplicator is built.
4. Multiplayer cosmetics broadcast: presence table with added cosmetic slug fields vs a dedicated real-time session-state table. This is the key open question for Phase 7.

---

## Sources (aggregated)

- Convex official docs: functions, HTTP actions, OCC, scheduled functions, best practices
- Convex convex/_generated/ai/guidelines.md (project file -- HIGH confidence)
- Stripe docs: Checkout Session API, webhook verification, idempotency (HIGH)
- Context7: motion library, next-themes v0.4.6, convex-helpers v0.1.115, stripe-node v19.1.0 (HIGH)
- Platform knowledge (training, pre-August 2025): Miniclip, Armor Games, Coolmath Games, Krunker.io, Slither.io, Agar.io, Roblox, Fortnite
- Virtual economy: GDC "Balancing F2P Economies" corpus; Naavik F2P analysis (MEDIUM)
- Security: MDN iframe sandbox and postMessage; OWASP API security; NNG dark patterns
