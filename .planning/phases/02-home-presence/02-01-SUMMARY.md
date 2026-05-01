---
phase: 02-home-presence
plan: "01"
subsystem: convex-backend
tags: [convex, schema, cron, presence, ledger, backend]
one-liner: "Convex backend surface for Phase 2: presence schema patch, coinLedger.getBalance SUM query, presence.getOnlinePlayers query, and markStalePresence 1-minute cron job"

dependency-graph:
  requires:
    - 01-foundation (convex/schema.ts presence + coinLedger tables, convex/presence.ts updatePresence mutation, convex/auth.ts betterAuthComponent)
  provides:
    - api.coinLedger.getBalance — real-time coin balance for nav (Plan 02-02)
    - api.presence.getOnlinePlayers — active player list for PresencePanel (Plan 02-03)
    - internal.crons.markStalePresence — 1-min cron, stale rows patched to "offline"
    - schema presence.status union now includes "offline" (required for cron write)
  affects:
    - convex/schema.ts (presence table status union)
    - convex/coinLedger.ts (new file)
    - convex/presence.ts (new query appended)
    - convex/crons.ts (new file)

tech-stack:
  added: []
  patterns:
    - "betterAuthComponent.getAuthUser(ctx) for server-derived identity (no userId arg)"
    - ".take(N) instead of .collect() on all queries"
    - "internalMutation for cron handler (not callable from public api.*)"
    - "crons.interval with FunctionReference (not function directly)"

key-files:
  created:
    - convex/coinLedger.ts
    - convex/crons.ts
  modified:
    - convex/schema.ts
    - convex/presence.ts

decisions:
  - "Used .take(1000) in getBalance instead of .collect() per Convex guideline; acceptable for Phase 2 ledger size"
  - "Used in-memory .filter() in getOnlinePlayers after .take(50) since presence table has no by_status index; documented as Phase 3+ optimization"
  - "markStalePresence uses .take(100) + loop (not .filter()) to avoid unindexed full-table filter at scale"
  - "Cron name string is 'mark-stale-presence' (matches plan key_links spec)"

metrics:
  duration: "~2 minutes"
  completed: "2026-05-01"
  tasks-completed: 4
  tasks-total: 4
  files-created: 2
  files-modified: 2
---

# Phase 2 Plan 01: Convex Backend Surface Summary

## What Was Built

Convex backend surface for Phase 2: schema patch (presence `"offline"` literal), `coinLedger.getBalance` SUM query, `presence.getOnlinePlayers` query, and `crons.ts` with the `markStalePresence` internalMutation on a 1-minute interval.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Patch presence schema to include "offline" literal | af41130 | convex/schema.ts |
| 2 | Create coinLedger.getBalance query (SUM pattern) | 2a416d9 | convex/coinLedger.ts |
| 3 | Add getOnlinePlayers query to presence.ts | 1c3f932 | convex/presence.ts |
| 4 | Create crons.ts with markStalePresence cron job | 5173250 | convex/crons.ts |

## Key Artifacts

### convex/schema.ts
Presence table `status` union now includes `v.literal("offline")` as the fourth literal. No other tables modified. This was required before the cron could write `"offline"` without a runtime validation error.

### convex/coinLedger.ts
New file. Single `getBalance` public query. Server-derived identity via `betterAuthComponent.getAuthUser(ctx)` — no `userId` argument accepted. Returns `null` for guests and unauthenticated users, `number` (SUM of all ledger rows) for authenticated users. Uses `.take(1000)` not `.collect()`.

### convex/presence.ts
`updatePresence` mutation left completely untouched. Added `query` to imports. Appended `getOnlinePlayers` public query: takes first 50 presence rows, filters to `"online"` and `"in-game"` in-memory, joins users table for display name and initials. Returns `{ userId, name, initials, status }` shape.

### convex/crons.ts
New file. `markStalePresence` registered as `internalMutation` (not public). Runs every 1 minute via `crons.interval`. Fetches up to 100 presence rows with `.take(100)`, patches any with `lastSeen < Date.now() - 5min` and `status !== "offline"` to `"offline"`. Passes `internal.crons.markStalePresence` FunctionReference (not the function directly). Exports `default crons`.

## Deviations from Plan

None — plan executed exactly as written.

The plan specified `.take(1000)` for `getBalance` (not `.collect()`); this was implemented as specified. The research doc's Pattern 2 showed `.collect()` but the plan's action spec overrides that with `.take(1000)` — plan takes precedence.

## Threat Surface Scan

All new surface is accounted for in the plan's `<threat_model>`:

- `coinLedger.getBalance` — T-02-01 (spoofing mitigated: server-derived identity), T-02-02 (tampering: read-only)
- `presence.getOnlinePlayers` — T-02-03 (info disclosure: accepted, low PII), T-02-04 (mitigated: raw email not returned)
- `markStalePresence` — T-02-05 (elevation: internalMutation only, not in public api.*)
- All queries — T-02-06 (DoS: bounded by .take())
- Schema status validator — T-02-07 (tampering: union limits to 4 literals only)

No unplanned threat surface introduced.

## Self-Check: PASSED

Files exist:
- convex/coinLedger.ts: FOUND
- convex/crons.ts: FOUND
- convex/schema.ts (modified): FOUND
- convex/presence.ts (modified): FOUND

Commits exist:
- af41130: schema patch
- 2a416d9: coinLedger.ts
- 1c3f932: presence.ts
- 5173250: crons.ts
