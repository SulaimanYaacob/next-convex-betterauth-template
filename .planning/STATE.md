# Project State: Gami

## Status
Active — Phase 3 planned (4 plans), ready to execute

## Project Reference
See: .planning/PROJECT.md

**Core value:** Players want to show off their cosmetics while playing with others — the social display of earned/bought identity is why they stay.
**Current focus:** Phase 1 — Foundation

## Phase Progress
| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation | Complete |
| 2 | Home + Presence | Complete |
| 3 | Game Shell + Earn | Not Started |
| 4 | Cosmetics + Store + Profile | Not Started |
| 5 | Payments | Not Started |

## Current Position
- **Phase:** 3
- **Plan:** 2 of 4 complete
- **Status:** Phase 3 in progress — 03-02 complete, 03-03 next
- **Progress:** 2/5 phases complete (Phase 3 in progress)

```
[====      ] 40%
```

## Performance Metrics
- Plans completed: 10
- Requirements delivered: 20/30 (AUTH-01..04 + schema + UI primitives + proxy hardening + home placeholder + HOME-01..04 + PRES-02 + PRES-03 + ECON-04 + GAME-01 + GAME-02 + GAME-03 + ECON-02)
- Phases completed: 2/5

## Accumulated Context

### Key Decisions Locked
- Coin ledger is append-only (coinTransactions table); balance = SUM — never a mutable counter
- Presence is a separate table from users — heartbeat writes must never invalidate user document subscribers
- All coin-affecting mutations are internalMutation — never callable from public api.*
- Games report score events; server derives coin amounts — client never supplies coin values
- Stripe webhook goes to Convex httpAction (raw body via req.bytes()); never a Next.js API route
- CosmeticsApplicator lives in root layout; writes via document.documentElement — no React Context
- CSS theme applied via data-theme attribute + CSS custom properties to avoid FOUC
- Sign-up name field defaults to email — username collection deferred to Phase 4
- Auth server errors mapped to fixed user-facing strings only — raw error codes never rendered to DOM

### Architecture Constraints (Phase 1 must get right)
- Schema must be locked before feature work: coinTransactions, presence, storeItems, ownedItems, equippedItems, games tables
- Indexes required on all foreign key fields from day one
- Better Auth onCreateUser hook must create full user row in application users table
- Presence table is separate — never add status/lastSeen fields to the users document

### Key Decisions Locked (Plan 04)
- Session validated via HTTP fetch to /api/auth/get-session (not local cookie parsing) — per CLAUDE.md and RESEARCH Assumption A1
- cache: no-store on session fetch to prevent edge cache serving stale auth state
- Anonymous (guest) sessions count as authenticated for proxy — bounce from /sign-in but blocked from /dashboard in Phase 1
- Early-return skips HTTP roundtrip for routes not in protectedRoutes or authRoutes

### Pending Decisions
- Cursor asset format: .cur vs SVG cursor:url() vs base64 data URL (browser support varies — needs spike in Phase 4)
- Coin earn formula constants: RESOLVED in Phase 3 context — score ÷ 100, 100 coin session cap, no daily cap yet
- Cursor trail: DOM node pool vs canvas approach (performance spike needed before Phase 4 implementation)
- Multiplayer cosmetics broadcast: presence table with cosmetic slug fields vs dedicated real-time session-state table

### Blockers
None

## Session Continuity
- Last action: Executed 03-02-PLAN.md — GameCard extended with slug/Link/thumbnailUrl; home page wired to live api.gameCatalog.list
- Next action: Execute 03-03-PLAN.md — Game shell iframe page with ESC overlay and floating pause button

## Last Updated
2026-05-02 — 03-02 complete
