# Project State: Gami

## Status
Active — Phase 1 ready to execute

## Project Reference
See: .planning/PROJECT.md

**Core value:** Players want to show off their cosmetics while playing with others — the social display of earned/bought identity is why they stay.
**Current focus:** Phase 1 — Foundation

## Phase Progress
| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation | Ready to Execute |
| 2 | Home + Presence | Not Started |
| 3 | Game Shell + Earn | Not Started |
| 4 | Cosmetics + Store + Profile | Not Started |
| 5 | Payments | Not Started |

## Current Position
- **Phase:** 1
- **Plan:** 3 of 4 complete (Wave 2: plan 03 done, plan 04 pending)
- **Status:** Executing — plan 04 next
- **Progress:** 0/5 phases complete (Phase 1 in progress)

```
[=         ] 10%
```

## Performance Metrics
- Plans completed: 3
- Requirements delivered: 7/30 (AUTH-01, AUTH-02, AUTH-03, AUTH-04 + schema + UI primitives)
- Phases completed: 0/5

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

### Pending Decisions
- Cursor asset format: .cur vs SVG cursor:url() vs base64 data URL (browser support varies — needs spike in Phase 4)
- Coin earn formula constants: score divisor, per-session cap, daily cap (product decision, must be set before Phase 3)
- Cursor trail: DOM node pool vs canvas approach (performance spike needed before Phase 4 implementation)
- Multiplayer cosmetics broadcast: presence table with cosmetic slug fields vs dedicated real-time session-state table

### Blockers
None — ready to start Phase 1

## Session Continuity
- Last action: Completed 01-03-PLAN.md — sign-in and sign-up auth pages built
- Next action: Execute 01-04-PLAN.md — proxy hardening and home placeholder

## Last Updated
2026-04-26 — plan 03 complete
