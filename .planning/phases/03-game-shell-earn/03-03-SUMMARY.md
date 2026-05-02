---
phase: 03-game-shell-earn
plan: "03"
subsystem: game-shell
tags: [game-shell, iframe, postMessage, esc-overlay, floating-pause, scroll-lock]
dependency_graph:
  requires:
    - "03-01"  # Convex games mutations + gameCatalog query
    - "03-02"  # GameCard with slug + gameCatalog query
  provides:
    - fullscreen game shell route at /play/[slug]
    - SESSION_INIT postMessage contract
    - EscOverlay (pause menu)
    - FloatingPauseButton (mobile tap target)
    - RewardScreen stub (replaced in 03-04)
  affects:
    - "03-04"  # RewardScreen replaces stub in page.tsx
tech_stack:
  added: []
  patterns:
    - "Radix DialogPrimitive for focus trap + aria-modal without importing Shadcn Dialog"
    - "Module-level Set for origin validation — stable across renders, no React Compiler issue"
    - "useRef for sessionId (no re-render needed); useState for escOpen/rewardOpen/rewardCoins"
    - "sessionInitSentRef guard prevents duplicate SESSION_INIT on remount"
    - "Body scroll lock: save/restore html+body overflow on mount/unmount"
key_files:
  created:
    - src/app/play/[slug]/page.tsx
    - src/components/game-iframe.tsx
    - src/components/esc-overlay.tsx
    - src/components/floating-pause-button.tsx
  modified: []
decisions:
  - "Relative imports for convex/_generated/ use 4 levels (../../../../) from src/app/play/[slug]/ — plan spec said 3 levels but directory depth requires 4"
  - "handleGameOver is a plain async function inside component (not useCallback) — React Compiler is active"
  - "ALLOWED_ORIGINS declared at module level outside component — avoids per-render Set construction and React Compiler issues"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 0
---

# Phase 3 Plan 03: Game Shell Summary

**One-liner:** Fullscreen game shell at /play/[slug] with origin-validated postMessage contract, Radix ESC overlay, mobile pause button, and scroll lock.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | EscOverlay and FloatingPauseButton | 2a3e5ec | esc-overlay.tsx, floating-pause-button.tsx |
| 2 | GameIframe and GameShell page | 18651e9 | game-iframe.tsx, play/[slug]/page.tsx |

## What Was Built

**EscOverlay** (`src/components/esc-overlay.tsx`): Pause menu using Radix `DialogPrimitive` directly (not Shadcn Dialog wrapper) — provides focus trap, ESC dismiss, and aria-modal. Animated overlay (`bg-black/75 backdrop-blur-sm`) and panel (`zoom-in-95`) via tw-animate-css. Resume, disabled Settings, and Back to Lobby buttons all meet WCAG 44px touch target.

**FloatingPauseButton** (`src/components/floating-pause-button.tsx`): 44px fixed circle, `md:hidden` (mobile-only), `z-40`, individual `Pause` icon import, `aria-label="Pause game"`.

**GameIframe** (`src/components/game-iframe.tsx`): Fullscreen iframe with `sandbox="allow-scripts allow-same-origin"`, Loader2 spinner until `onLoad` fires, SESSION_INIT postMessage sent once via `sessionInitSentRef` guard. Target origin derived from `new URL(iframeUrl).origin` — never `"*"`. Malformed URLs caught silently (dev placeholders).

**GameShell page** (`src/app/play/[slug]/page.tsx`):
- Body scroll lock: saves and restores `html` + `body` `overflow` on mount/unmount
- Keyboard ESC listener: toggles `escOpen`, blocked when `rewardOpen` is true
- Origin-validated postMessage handler: `ALLOWED_ORIGINS` Set parsed at module level from `NEXT_PUBLIC_ALLOWED_GAME_ORIGINS`; unlisted origins silently ignored
- GAME_STARTED → `updatePresence("in-game")` + `startSession` → stores ID in `sessionIdRef`
- SCORE_UPDATE → `setLastScore` + `updateScore`
- GAME_OVER → close ESC overlay → `handleGameOver`
- Back to Lobby → `handleGameOver(lastScore)` (synthetic GAME_OVER flow)
- Loading state (game === undefined): spinner on black bg
- Error state (game === null): "Game not found." with Back to Home link
- Inline RewardScreen stub (replaced in Plan 04)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed relative import path depth**
- **Found during:** Task 2 (TypeScript error TS2307)
- **Issue:** Plan spec specified `../../../convex/_generated/api` (3 levels) but the actual file at `src/app/play/[slug]/page.tsx` is 4 directory levels from the project root, requiring `../../../../convex/_generated/api`
- **Fix:** Changed both `api` and `dataModel` imports to use 4 levels (`../../../../`)
- **Files modified:** `src/app/play/[slug]/page.tsx`
- **Commit:** 18651e9

## Known Stubs

| Stub | File | Line | Reason |
|------|------|------|--------|
| Inline RewardScreen div | src/app/play/[slug]/page.tsx | ~155 | Plan 03-04 replaces this block with `<RewardScreen>` component |

The stub displays `rewardCoins` and "Back to Home" correctly — it is functional for testing but will be replaced by the full-featured RewardScreen in Plan 04.

## Threat Surface Scan

All threat mitigations from the plan's `<threat_model>` are implemented:

| Threat ID | Mitigation | Implemented |
|-----------|------------|-------------|
| T-03-12 | ALLOWED_ORIGINS Set validated before any message acted on | Yes — line 70 |
| T-03-13 | `new URL(iframeUrl).origin` as targetOrigin, never `"*"` | Yes — game-iframe.tsx line 26 |
| T-03-14 | Score passed to server-side `endSession`; formula is internalMutation | Yes — endSession call in handleGameOver |
| T-03-15 | sandbox="allow-scripts allow-same-origin" | Yes — game-iframe.tsx line 52 |

## Self-Check: PASSED

| Check | Result |
|-------|--------|
| src/app/play/[slug]/page.tsx exists | FOUND |
| src/components/game-iframe.tsx exists | FOUND |
| src/components/esc-overlay.tsx exists | FOUND |
| src/components/floating-pause-button.tsx exists | FOUND |
| Commit 2a3e5ec (Task 1) exists | FOUND |
| Commit 18651e9 (Task 2) exists | FOUND |
| TypeScript compiles without errors | PASSED |
