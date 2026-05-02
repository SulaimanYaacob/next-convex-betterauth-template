---
phase: 03-game-shell-earn
plan: "01"
subsystem: convex-backend
tags: [convex, schema, mutations, coin-economy, game-session, internal-mutation]
dependency_graph:
  requires:
    - convex/schema.ts (games table, coinLedger table — pre-existing)
    - convex/auth.ts (betterAuthComponent)
    - convex/util.ts (requireEnv)
  provides:
    - convex/gameCatalog.ts (list, getBySlug, seed)
    - convex/games.ts (startSession, updateScore, endSession, awardSessionCoins)
    - gameCatalog table in schema
  affects:
    - convex/_generated/api.d.ts (added gameCatalog + games modules)
    - Coin ledger balance (awardSessionCoins inserts into coinLedger)
tech_stack:
  added: []
  patterns:
    - internalMutation for coin award (not reachable from public API)
    - betterAuthComponent.getAuthUser identity resolution (copied from presence.ts)
    - Idempotency guard on endSession (endedAt check before runMutation)
    - ctx.runMutation with type annotation to resolve TypeScript circularity
    - take(100) over collect() for catalog queries
key_files:
  created:
    - convex/gameCatalog.ts
    - convex/games.ts
  modified:
    - convex/schema.ts
    - convex/_generated/api.d.ts
decisions:
  - "awardSessionCoins is internalMutation — cannot be called by client (T-03-05)"
  - "sessionId in coinLedger stored as .toString() because schema uses v.optional(v.string())"
  - "Coin formula: Math.min(Math.floor(score / divisor), cap) with divisor/cap from Convex env"
  - "gameCatalog seed is idempotent: checks pixel-rush slug before inserting either record"
  - "api.d.ts manually updated to include games + gameCatalog so tsc passes before convex dev regenerates"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 2
  files_modified: 2
---

# Phase 3 Plan 01: Convex Backend Surface Summary

gameCatalog table + queries, games session mutations, and env-var-driven awardSessionCoins internalMutation — full server surface for Phase 3 frontend plans.

## What Was Built

### Task 1: gameCatalog schema + queries

- Added `gameCatalog` table to `convex/schema.ts` after the `games` table
- Fields: `slug`, `name`, `iframeUrl`, `isMultiplayer`, `thumbnailUrl` (optional), `genre`
- Indexes: `by_slug` and `by_isMultiplayer`
- Created `convex/gameCatalog.ts` with:
  - `list` — public query, `.take(100)` (never `.collect()`)
  - `getBySlug` — public query, uses `by_slug` index, `.unique()`
  - `seed` — `internalMutation`, idempotent (checks `pixel-rush` slug before inserting either record), inserts Pixel Rush (Arcade) and Mind Maze (Puzzle)

### Task 2: games session mutations

Created `convex/games.ts` with four exports:

- `startSession` (public mutation) — inserts games row, returns `Id<"games"> | null`
- `updateScore` (public mutation) — patches `scoreEvent` with ownership check
- `endSession` (public mutation) — idempotency guard (returns cached `coinsAwarded` if `endedAt` already set), calls `awardSessionCoins` via `ctx.runMutation` with `const coins: number` type annotation
- `awardSessionCoins` (internalMutation) — reads `COIN_SCORE_DIVISOR` and `COIN_SESSION_CAP` from Convex env via `requireEnv`, computes `Math.min(Math.floor(score / divisor), cap)`, inserts into `coinLedger` if `coins > 0`, patches games row with `endedAt`/`coinsAwarded`/`sessionCap`

All three public mutations use the canonical identity pattern from `presence.ts`: `betterAuthComponent.getAuthUser(ctx)` → `by_email` index lookup.

Updated `convex/_generated/api.d.ts` to include `gameCatalog` and `games` modules so `tsc --noEmit` passes before `convex dev` regenerates the file.

## Security / STRIDE Mitigations Implemented

| Threat ID | Status | Implementation |
|-----------|--------|----------------|
| T-03-01 | Mitigated | Score only influences coin formula server-side; client cannot inflate coin amount beyond formula |
| T-03-02 | Mitigated | Ownership check: `session.userId !== appUser._id` → return null |
| T-03-03 | Mitigated | `endSession` idempotency guard: `if (session.endedAt !== undefined) return session.coinsAwarded ?? 0` |
| T-03-04 | Mitigated | `userId` in `awardSessionCoins` always comes from server-side auth resolution in `endSession` |
| T-03-05 | Mitigated | `awardSessionCoins` is `internalMutation` — not in public `api.*` surface |
| T-03-06 | Accepted | Missing env vars throw on first call — documented in `user_setup` |
| T-03-07 | Accepted | `gameCatalog.list` intentionally public — no PII, home page reads it unauthenticated |

## Deviations from Plan

None — plan executed exactly as written.

## User Setup Required

Before `endSession` will work in any environment, set these Convex env vars:

```bash
pnpm convex env set COIN_SCORE_DIVISOR 100
pnpm convex env set COIN_SESSION_CAP 100
```

And add to `.env.local`:

```
NEXT_PUBLIC_ALLOWED_GAME_ORIGINS=http://localhost:3001
```

## Known Stubs

- `gameCatalog` iframeUrls are placeholders (`https://placeholder.game/pixel-rush`, `https://placeholder.game/mind-maze`) per RESEARCH.md Assumption A2. The iframe will render blank in dev until real game URLs are configured. This does not affect schema, coin logic, or session mutations.

## Threat Flags

None — no new network endpoints, auth paths, or file access patterns beyond what the plan's threat model covers.

## Self-Check: PASSED

- convex/schema.ts — FOUND, contains gameCatalog: defineTable
- convex/gameCatalog.ts — FOUND, exports list, getBySlug, seed
- convex/games.ts — FOUND, exports startSession, updateScore, endSession, awardSessionCoins
- convex/_generated/api.d.ts — FOUND, includes gameCatalog and games modules
- Commit 606bf2f — Task 1
- Commit 1a7d91a — Task 2
- TypeScript: zero errors (`npx tsc --noEmit -p convex/tsconfig.json`)
