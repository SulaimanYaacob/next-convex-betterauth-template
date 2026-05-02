---
phase: 03-game-shell-earn
plan: "02"
subsystem: frontend-home
tags: [next.js, convex, useQuery, game-card, home-page, client-component]
dependency_graph:
  requires:
    - convex/gameCatalog.ts (list query — created in 03-01)
    - convex/_generated/api.d.ts (gameCatalog module)
    - src/components/ui/card.tsx
    - src/components/ui/badge.tsx
    - src/components/filter-chips.tsx
    - src/components/presence-panel.tsx
  provides:
    - src/components/game-card.tsx (slug prop, Link wrapper, optional thumbnailUrl image)
    - src/app/page.tsx (client component reading live Convex gameCatalog.list)
  affects:
    - Home page game grid (now live data from Convex instead of hardcoded arrays)
    - next.config.ts (T-03-11 threat note for future thumbnailUrl remotePatterns)
tech_stack:
  added: []
  patterns:
    - useQuery(api.gameCatalog.list) with undefined guard for skeleton loading state
    - Inline GameCardSkeleton component for loading UX (no separate file needed)
    - next/image with fill + sizes for responsive game thumbnails
    - Link wrapper on Card for keyboard-navigable game navigation
decisions:
  - "page.tsx converted to client component — useQuery requires client context (Pitfall 6)"
  - "GameCard does not take priority prop — generic grid component, not always above-the-fold"
  - "Static muted placeholder (no animate-pulse) when thumbnailUrl absent — pulse was dev artifact"
  - "focus-visible ring moves from Card to Link wrapper — semantically correct focus indicator"
  - "T-03-11 note added to next.config.ts — remotePatterns must be extended when real thumbnails added"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 0
  files_modified: 3
---

# Phase 3 Plan 02: Home Page Wired to Live Convex gameCatalog Summary

Home page converted from server component with hardcoded arrays to client component reading live `api.gameCatalog.list`; GameCard extended with slug-based Link navigation and optional next/image thumbnail rendering.

## What Was Built

### Task 1: Extend GameCard

Rewrote `src/components/game-card.tsx` completely:

- Added `slug: string` and `thumbnailUrl?: string` to `GameCardProps` interface
- Wrapped entire Card in `<Link href={/play/${slug}}>` with `focus-visible:ring-2 focus-visible:ring-ring` on the Link wrapper (removed from Card)
- Thumbnail area uses `<div className="aspect-video bg-muted relative overflow-hidden">`:
  - When `thumbnailUrl` present: renders `<Image src={thumbnailUrl} alt={name} fill sizes="..." className="object-cover" />`
  - When absent: renders `<div className="absolute inset-0 bg-muted" aria-hidden="true" />` (static, no animate-pulse)
- Card body unchanged: name and genre Badge

### Task 2: Refactor Home Page

Rewrote `src/app/page.tsx` as a client component:

- Added `"use client"` directive at line 1
- Replaced `SOLO_GAMES` and `MP_GAMES` const arrays with `useQuery(api.gameCatalog.list)`
- Derives `soloGames` and `mpGames` via `.filter()` on `isMultiplayer`
- Added inline `GameCardSkeleton` component for loading state
- Both section grids follow the three-state pattern:
  - `allGames === undefined` → 4 skeleton cards
  - `length === 0` → empty state paragraph
  - loaded → `GameCard` map with `g._id` as key
- All section structure, FilterChips, PresencePanel, grid classNames preserved unchanged

### Deviation: T-03-11 Threat Mitigation Note (Rule 2 — missing critical note)

Added a comment to `next.config.ts` under `remotePatterns` documenting that game thumbnail CDN domains must be added when real thumbnailUrls are configured in gameCatalog records. This is the mitigation required by threat T-03-11 (Information Disclosure / DoS via uncontrolled external image sources).

## Deviations from Plan

### Auto-added (Rule 2 — missing critical functionality)

**1. [Rule 2 - Security] Added T-03-11 note to next.config.ts**
- **Found during:** Task 1 review (threat_model scan)
- **Issue:** Threat T-03-11 requires documenting that `remotePatterns` must be extended when real thumbnailUrls are added. The plan mentioned "Add note to next.config.ts" but it was not in the task action steps.
- **Fix:** Added comment block in `next.config.ts` remotePatterns array referencing T-03-11
- **Files modified:** `next.config.ts`
- **Commit:** 2be1936

## Known Stubs

None — all GameCard props are wired to real Convex data. The `thumbnailUrl` field will be `undefined` for all current gameCatalog records (seeded with no thumbnail), so the static muted placeholder renders. This is expected behavior, not a stub — the placeholder is the correct fallback per the plan spec.

## Threat Flags

None — no new network endpoints or auth paths introduced beyond what the plan's threat model covers.

## Self-Check: PASSED

- src/components/game-card.tsx — FOUND (slug prop, Link wrapper, next/image)
- src/app/page.tsx — FOUND ("use client", useQuery, no SOLO_GAMES/MP_GAMES)
- next.config.ts — FOUND (T-03-11 note present)
- Commit 44ff4eb — Task 1 (GameCard)
- Commit 86a86e9 — Task 2 (home page)
- Commit 2be1936 — T-03-11 threat note
- TypeScript: zero errors (npx tsc --noEmit)
