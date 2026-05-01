---
phase: 02-home-presence
plan: 02
subsystem: leaf-components
tags: [react, components, convex-client, presence, heartbeat, coin-balance]
key-files:
  created:
    - src/components/heartbeat-provider.tsx
    - src/components/coin-balance.tsx
    - src/components/game-card.tsx
    - src/components/filter-chips.tsx
    - src/app/store/page.tsx
  modified:
    - convex/_generated/api.d.ts
---

## Summary

Wave 2 leaf components shipped. All 5 files created and build passes (7 routes including /store).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| All tasks | 5c06826 | feat(02-02): add leaf components — HeartbeatProvider, CoinBalance, GameCard, FilterChips, /store |

## What Was Built

**HeartbeatProvider** (`src/components/heartbeat-provider.tsx`) — Client wrapper that sends `api.presence.updatePresence` every 15s for authenticated non-guest users. Idle detection triggers after 3min of no mousemove/keydown/scroll/click. Uses `useRef` for interval/timer (React Compiler compliant — no useCallback). Guest gate via `authClient.useSession()` + `isAnonymous` cast.

**CoinBalance** (`src/components/coin-balance.tsx`) — Real-time coin balance via `useQuery(api.coinLedger.getBalance)`. Returns null for guests (D-02). Skeleton during loading. Formats balance with `.toLocaleString()`. Renders `⟟` glyph in `text-primary`.

**GameCard** (`src/components/game-card.tsx`) — Server component. 16:9 muted placeholder thumbnail + name (text-sm font-semibold) + outline genre badge. No real images per D-09.

**FilterChips** (`src/components/filter-chips.tsx`) — Visual-only chip strip with `["All", "Multiplayer", "Desktop", "Mobile"]`. Local useState only — no data filtering per D-07. ARIA radiogroup pattern. min-h-[44px] touch targets.

**/store page** (`src/app/store/page.tsx`) — Minimal placeholder server component. Route /store returns 200 for mobile bottom-nav Store tab target (Phase 4 fills content).

## Deviations

**Import path fix:** Plan specified `@/convex/_generated/api` but tsconfig `@/*` maps to `./src/*` only — convex generated files live at project root. Fixed to relative `../../convex/_generated/api` to match existing pattern in `src/lib/auth.ts`. Also committed updated `convex/_generated/api.d.ts` which the local Convex dev server had regenerated to include coinLedger and crons.

## Self-Check: PASSED

- All 5 files exist at correct paths ✓
- Build passes with /store in route table ✓
- React Compiler compliant (no useMemo/useCallback/React.memo) ✓
- Guest gating present in HeartbeatProvider and CoinBalance ✓
- Convex imports use relative paths matching project convention ✓
