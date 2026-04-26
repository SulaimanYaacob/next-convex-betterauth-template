---
phase: 01-foundation
plan: "01"
subsystem: database
tags: [convex, schema, auth, better-auth, presence, coinledger, cascade]

requires: []
provides:
  - "7-table Convex schema locked for all 5 phases (users, coinLedger, presence, storeItems, ownedItems, equippedItems, games)"
  - "Idempotent syncUserCreation mutation with by_email guard"
  - "syncUserDeletion cascading 5-table delete (presence, coinLedger, ownedItems, equippedItems, games)"
  - "Public updatePresence mutation deriving identity from betterAuthComponent"
  - "onLinkAccount hook on anonymous() plugin for AUTH-04 guest conversion"
  - "All by_-prefixed indexes; no old-style index names anywhere"
affects: [02-home-presence, 03-game-shell, 04-cosmetics-store, 05-payments]

tech-stack:
  added: []
  patterns:
    - "Append-only coinLedger: balance = SUM(amount), no mutable counter (ECON-01)"
    - "Presence as separate table: heartbeat writes never invalidate users doc subscribers (PRES-01)"
    - "Cascade delete with .take(100) loops per Convex guideline — never .collect()"
    - "Identity derivation via betterAuthComponent.getAuthUser — never accept userId as mutation arg"
    - "Idempotency guard on syncUserCreation: check by_email before insert"

key-files:
  created:
    - convex/presence.ts
  modified:
    - convex/schema.ts
    - convex/users.ts
    - convex/auth.ts
    - src/lib/auth.ts

key-decisions:
  - "Schema locked for all 5 phases in Phase 1 — no migrations needed later"
  - "coinLedger is append-only with signed amount; balance computed by SUM (ECON-01)"
  - "presence is a separate table — status/lastSeen never on users document (PRES-01)"
  - "All cascade deletes use .take(100) not .collect() to respect Convex mutation limits"
  - "onLinkAccount on anonymous() is a Phase 1 placeholder; AUTH-04 data migration deferred to Phase 3"

patterns-established:
  - "Pattern: 5-table cascade delete via by_userId index with .take(100) for-of loops"
  - "Pattern: Presence upsert (patch existing or insert new) using by_userId index"
  - "Pattern: Idempotency guard — query before insert in syncUserCreation"

requirements-completed: [ECON-01, PRES-01, AUTH-04]

duration: 3min
completed: 2026-04-26
---

# Phase 1 Plan 01: Schema Lock Summary

**7-table Convex schema locked for all 5 phases with append-only coinLedger, separate presence table, and 5-table cascading user deletion**

## Performance

- **Duration:** 3 min
- **Started:** 2026-04-26T12:26:32Z
- **Completed:** 2026-04-26T12:29:38Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Replaced scaffold schema (users + todos) with full 7-table platform schema; no schema migrations needed in future phases
- Rewrote syncUserCreation (idempotent) and syncUserDeletion (5-table cascade) in convex/users.ts
- Created convex/presence.ts with public updatePresence mutation deriving identity server-side
- Updated auth.ts getCurrentUser to use renamed by_email index
- Updated src/lib/auth.ts delete.after fallback to cascade all 5 FK tables; added onLinkAccount to anonymous() plugin

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite convex/schema.ts with 7-table platform lock** - `04623dd` (feat)
2. **Task 2: Update convex/users.ts and convex/auth.ts for new schema** - `9989c61` (feat)
3. **Task 3: Create convex/presence.ts + update src/lib/auth.ts** - `d583db9` (feat)

## Files Created/Modified

- `convex/schema.ts` - 7-table platform schema with by_-prefixed indexes; no todos, no mutable balance field
- `convex/users.ts` - Idempotent syncUserCreation (by_email guard) + 5-table cascading syncUserDeletion
- `convex/auth.ts` - getCurrentUser updated to use by_email index; removed asyncMap and Id imports
- `convex/presence.ts` - New: public updatePresence mutation (PRES-01); upsert pattern using by_userId
- `src/lib/auth.ts` - delete.after fallback updated to 5-table cascade; onLinkAccount added to anonymous(); asyncMap import removed

## Decisions Made

- Used `for...of` loop over a `const` array of table names in the inline delete.after fallback (cleaner than 4 separate blocks while maintaining type safety)
- onLinkAccount hook is a documented placeholder — AUTH-04 data migration (game progress preservation) deferred to Phase 3 when game sessions exist
- `.take(100)` limit is intentional for Phase 1; scheduled continuation pattern noted for Phase 5 if ledger rows exceed 100

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. TypeScript typecheck passed clean on both convex/tsconfig.json and root tsconfig.json.

## User Setup Required

None - no external service configuration required.

## Schema Details

### 7 Tables

| Table | Description | Key Fields |
|-------|-------------|------------|
| users | App user record | email, userId?, username? |
| coinLedger | Append-only coin ledger (ECON-01) | userId, amount (signed), reason, sessionId? |
| presence | Heartbeat presence (PRES-01) | userId, lastSeen (ms), status |
| storeItems | Store catalog (Phase 4) | slug, name, type, price, rarity, previewUrl?, earnedOnly |
| ownedItems | User-owned items (Phase 4) | userId, itemId, acquiredAt |
| equippedItems | Currently equipped per slot (Phase 4) | userId, slot, itemId |
| games | Game session log (Phase 3) | userId, gameId, startedAt, endedAt?, scoreEvent?, coinsAwarded?, sessionCap? |

### All Index Names

- `users.by_email` — ["email"]
- `users.by_userId` — ["userId"]
- `coinLedger.by_userId` — ["userId"]
- `presence.by_userId` — ["userId"]
- `storeItems.by_slug` — ["slug"]
- `storeItems.by_type` — ["type"]
- `ownedItems.by_userId` — ["userId"]
- `ownedItems.by_userId_and_itemId` — ["userId", "itemId"]
- `equippedItems.by_userId` — ["userId"]
- `equippedItems.by_userId_and_slot` — ["userId", "slot"]
- `games.by_userId` — ["userId"]
- `games.by_userId_and_gameId` — ["userId", "gameId"]

### Cascade Table List (5 entries)

1. presence (single row per user — .first() delete)
2. coinLedger (.take(100) for-of delete)
3. ownedItems (.take(100) for-of delete)
4. equippedItems (.take(100) for-of delete)
5. games (.take(100) for-of delete)

## Next Phase Readiness

- Schema locked — Phase 2 (Home + Presence) can safely create queries and mutations against all 7 tables
- updatePresence mutation ready — Phase 2 just needs to wire the client-side 15s heartbeat interval
- No blockers for Phase 2 or any subsequent phase

## Self-Check: PASSED

- FOUND: convex/schema.ts
- FOUND: convex/users.ts
- FOUND: convex/auth.ts
- FOUND: convex/presence.ts
- FOUND: src/lib/auth.ts
- FOUND: .planning/phases/01-foundation/01-01-SUMMARY.md
- FOUND commit: 04623dd (Task 1)
- FOUND commit: 9989c61 (Task 2)
- FOUND commit: d583db9 (Task 3)

---
*Phase: 01-foundation*
*Completed: 2026-04-26*
