# Project State: Gami

## Status
Active - Phase 4 context ready, ready to plan

## Project Reference
See: .planning/PROJECT.md

**Core value:** Players want to show off their cosmetics while playing with others - the social display of earned/bought identity is why they stay.
**Current focus:** Phase 4 - Cosmetics + Store + Profile

## Phase Progress
| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation | Complete |
| 2 | Home + Presence | Complete |
| 3 | Game Shell + Earn | Complete |
| 4 | Cosmetics + Store + Profile | Context Ready |
| 5 | Payments | Not Started |

## Current Position
- **Phase:** 4
- **Plan:** 0 of TBD
- **Status:** Phase 4 context gathered - ready for planning
- **Progress:** 3/5 phases complete through Phase 3; Phase 4 requires formal planning and reconciliation against direct implementation work already in the repo

```
[======    ] 60%
```

## Performance Metrics
- Plans completed: 11
- Requirements delivered: 22/30 through formal Phase 3 plans; direct Phase 4 implementation exists and needs formal verification
- Phases completed: 3/5 through Phase 3; Phase 4 context ready

## Accumulated Context

### Key Decisions Locked
- Coin ledger is append-only (coinTransactions table); balance = SUM - never a mutable counter
- Presence is a separate table from users - heartbeat writes must never invalidate user document subscribers
- All coin-affecting mutations are internalMutation - never callable from public api.*
- Games report score events; server derives coin amounts - client never supplies coin values
- Stripe webhook goes to Convex httpAction (raw body via req.bytes()); never a Next.js API route
- CosmeticsApplicator lives in root layout; writes via document.documentElement - no React Context
- CSS theme applied via data-theme attribute + CSS custom properties to avoid FOUC
- Sign-up name field defaults to email - username collection deferred to Phase 4
- Auth server errors mapped to fixed user-facing strings only - raw error codes never rendered to DOM
- Pixel Rush and Mind Maze should be Next.js game routes embedded by the platform shell
- Games only emit lifecycle/score events; the platform owns the single post-game reward popup
- Player avatar cosmetics are visual identity only and must not affect hitbox, speed, score, or collision rules
- Convex is durable backend state, not the high-frequency movement transport for multiplayer games
- Signal Clash realtime movement should use Cloudflare Durable Objects/WebSockets; Convex remains for auth, users, cosmetics, coins, catalog, presence metadata, and final results

### Architecture Constraints
- Schema must preserve coinTransactions, presence, storeItems, ownedItems, equippedItems, and games tables with correct indexes
- Better Auth onCreateUser hook must create full user row in application users table
- Presence table is separate - never add status/lastSeen fields to the users document
- Store purchases must be atomic: debit coins and create ownership in one mutation, with duplicate purchase protection
- Store/profile UIs must handle loading, unauthenticated, empty, owned, equipped, and mutation feedback states
- Mind Maze must lock input until sequence playback finishes
- Mind Maze board geometry must be verified on desktop and mobile; critical board sizing may use explicit inline dimensions if utility CSS collapses

### Pending Decisions
- Cursor asset format: .cur vs SVG cursor:url() vs base64 data URL
- Cursor trail implementation: DOM node pool vs canvas approach
- Exact Phase 4 plan split and reconciliation strategy for direct store/profile/game work already present
- Exact Cloudflare Durable Object message schema for Signal Clash

### Blockers
None

## Session Continuity
- Last action: `/gsd next` created Phase 4 context from current product decisions and direct implementation drift.
- Next action: Run `/gsd-plan-phase 4` to reconcile Phase 4 plans around existing store/profile/cosmetics code, Mind Maze stability, and Signal Clash Durable Object migration.

## Last Updated
2026-05-02 - Phase 4 context ready
