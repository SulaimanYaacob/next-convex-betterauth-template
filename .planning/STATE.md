# Project State: Gami

## Status
Active — Phase 3 context captured, ready to plan

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
- **Plan:** 0 of ? (Phase 3 not yet planned)
- **Status:** Phase 3 context captured — ready to plan
- **Progress:** 2/5 phases complete

```
[====      ] 40%
```

## Performance Metrics
- Plans completed: 8
- Requirements delivered: 16/30 (AUTH-01..04 + schema + UI primitives + proxy hardening + home placeholder + HOME-01..04 + PRES-02 + PRES-03 + ECON-04)
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
- Last action: Phase 3 context gathered — 6 areas discussed, CONTEXT.md committed
- Next action: Plan Phase 3 — `/gsd-plan-phase 3`

## Last Updated
2026-05-01 — Phase 3 context captured
