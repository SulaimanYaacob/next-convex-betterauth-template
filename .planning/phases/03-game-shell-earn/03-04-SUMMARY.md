---
phase: "03-game-shell-earn"
plan: "04"
subsystem: "game-shell"
tags: ["reward-screen", "coin-balance", "presence", "ui-component"]

dependency_graph:
  requires:
    - "03-03"  # GameShell page with inline stub
    - "03-01"  # Convex endSession/updatePresence mutations
  provides:
    - "src/components/reward-screen.tsx"
    - "RewardScreen component replacing GameShell inline stub"
  affects:
    - "src/app/play/[slug]/page.tsx"

tech_stack:
  added: []
  patterns:
    - "if (!open) return null — conditional render without portal"
    - "fire-and-forget void mutation before navigation"
    - "z-[60] arbitrary Tailwind value for layering above z-50 overlays"
    - "CoinBalance component composed into RewardScreen (no props — self-managed subscription)"

key_files:
  created:
    - "src/components/reward-screen.tsx"
  modified:
    - "src/app/play/[slug]/page.tsx"

decisions:
  - "onClose sets rewardOpen=false in GameShell; navigation inside RewardScreen.handleBackToHome — clear separation of concerns"
  - "updatePresence retained in GameShell for GAME_STARTED handler; RewardScreen gets its own useMutation instance for the back-to-home reset"
  - "z-[60] arbitrary value (not z-60 class) ensures RewardScreen sits above EscOverlay at z-50 across Tailwind v4"

metrics:
  duration: "~4 minutes"
  completed: "2026-05-02T00:56:34Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 1
---

# Phase 3 Plan 04: RewardScreen Component Summary

**One-liner:** Full-screen post-game reward overlay extracted from GameShell inline stub into RewardScreen component with coins earned hero, CoinBalance live subscription, and presence-resetting Back to Home.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create RewardScreen component | 0661eaa | src/components/reward-screen.tsx |
| 2 | Replace GameShell inline stub with RewardScreen | 8e05512 | src/app/play/[slug]/page.tsx |

## What Was Built

**RewardScreen component** (`src/components/reward-screen.tsx`):
- Props: `open: boolean`, `earned: number`, `onClose: () => void`
- Renders nothing when `open === false` (`if (!open) return null`)
- Full-screen overlay at `z-[60]` (above EscOverlay `z-50`) with `bg-black/90`
- Panel centered via `absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2`
- "Game Over" label + "Coins Earned" hero (`text-5xl` with `⟟` in `text-primary`)
- "No coins this round" subtitle shown when `earned === 0`
- Separator div + "Total Balance" label + `<CoinBalance />` (self-managed Convex subscription)
- "Back to Home" Button: fires `void updatePresence({ status: "online" })`, calls `onClose()`, then `router.push("/")`
- `role="dialog"` + `aria-modal="true"` for screen reader accessibility
- Entry animation: overlay `fade-in duration-200`, panel `fade-in zoom-in-95 duration-200 delay-75`
- No `useMemo`/`useCallback` — React Compiler active

**GameShell page** (`src/app/play/[slug]/page.tsx`):
- Added `import { RewardScreen } from "@/components/reward-screen"`
- Replaced 22-line inline stub with 4-line `<RewardScreen open={rewardOpen} earned={rewardCoins} onClose={() => setRewardOpen(false)} />`
- `updatePresence` useMutation retained (still used for GAME_STARTED → "in-game")
- `router` retained (used in error state "Back to Home" button)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — RewardScreen is fully wired. `earned` flows from `endSession` server return value; `CoinBalance` has live Convex subscription.

## Threat Flags

None — no new network endpoints, auth paths, or trust boundaries beyond those already covered in the plan's threat model (T-03-19 through T-03-22).

## Self-Check: PASSED

- `src/components/reward-screen.tsx` exists: FOUND
- `src/app/play/[slug]/page.tsx` updated: FOUND
- Commit 0661eaa (Task 1): FOUND
- Commit 8e05512 (Task 2): FOUND
- TypeScript: zero errors (`npx tsc --noEmit` passes)
- Acceptance criteria: all green (stub removed, "Game Over" 0 matches in page.tsx, "Back to Home" 1 match in page.tsx)
