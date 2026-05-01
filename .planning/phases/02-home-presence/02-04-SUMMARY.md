---
phase: 02-home-presence
plan: 04
subsystem: layout-wiring
tags: [react, layout, home, font, nav, heartbeat]
key-files:
  modified:
    - src/app/layout.tsx
    - src/app/page.tsx
---

## Summary

Wave 4 complete. Layout surgery done, V2 Refined home live. Build passes.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Tasks 1 & 2 | cc9b2cd | feat(02-04): wire Phase 2 — layout surgery + V2 Refined home page |

## What Was Built

**layout.tsx** — Full rewrite:
- `Inter` removed; `Geist_Mono` bound to `--font-sans` CSS variable
- `h-svh overflow-hidden` body → `min-h-svh` (no overflow trap)
- Old `flex flex-col h-full` wrapper + `grow flex flex-col overflow-hidden` main removed
- Provider tree: `ThemeProvider` → `ConvexClientProvider` → `HeartbeatProvider`
- `HeartbeatProvider` wraps all nav + main (inside ConvexClientProvider per D-10)
- Components mounted: `GuestBanner`, `AppNav`, `MobileNav`, `MobileBottomNav`, `Toaster`
- `<main>` responsive offset: `pt-16 md:pt-16 [@media(max-width:767px)]:pt-[104px] pb-16 md:pb-0`
- Metadata: title `"Gami"`, description `"Play. Earn. Show off."`

**page.tsx** — Full rewrite (V2 Refined home):
- Server Component (no `"use client"`)
- `GuestBanner` removed (now in layout)
- `FilterChips` above both sections
- Solo section: `aria-label="Solo games"`, `backgroundColor: "#f8f6f2"` inline style, 2 GameCards
- Multiplayer section: `aria-label="Multiplayer games"`, `backgroundColor: "#f1f5fb"` inline style, 2 GameCards + `PresencePanel` in `mt-8` wrapper

## Deviations

None. Both files match plan spec exactly.

## Self-Check: PASSED

- `Inter` removed, `Geist_Mono` bound to `--font-sans` ✓
- Body has `min-h-svh`, no `overflow-hidden` ✓
- `HeartbeatProvider` inside `ConvexClientProvider` ✓
- All 3 nav components mounted in layout ✓
- `GuestBanner` + `Toaster` in layout ✓
- `<main>` has correct responsive padding ✓
- page.tsx is Server Component ✓
- Section colors exact per UI-SPEC §4 ✓
- `PresencePanel` in Multiplayer section after game grid ✓
- `pnpm build` passes ✓
