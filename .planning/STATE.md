# Project State: Zentro

## Status
Active — Phase 1 not started

## Project Reference
See: .planning/PROJECT.md

**Core value:** Players want to show off their cosmetics while playing with others — the social display of earned/bought identity is why they stay.
**Current focus:** Phase 1 — Foundation

## Phase Progress
| Phase | Name | Status |
|-------|------|--------|
| 1 | Foundation | Not Started |
| 2 | Home + Presence | Not Started |
| 3 | Game Shell + Earn | Not Started |
| 4 | Cosmetics + Store + Profile | Not Started |
| 5 | Payments | Not Started |

## Current Position
- **Phase:** 1
- **Plan:** None started
- **Status:** Not started
- **Progress:** 0/5 phases complete

```
[          ] 0%
```

## Performance Metrics
- Plans completed: 0
- Requirements delivered: 0/30
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
- Last action: Roadmap created
- Next action: Run `/gsd-plan-phase 1` to plan Phase 1 — Foundation

## Last Updated
2026-04-25 — initialized from roadmap creation
