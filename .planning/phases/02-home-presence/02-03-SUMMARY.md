---
phase: 02-home-presence
plan: 03
subsystem: nav-assemblies
tags: [react, nav, presence, convex-client, mobile, desktop]
key-files:
  created:
    - src/components/app-nav.tsx
    - src/components/mobile-nav.tsx
    - src/components/mobile-bottom-nav.tsx
    - src/components/presence-panel.tsx
---

## Summary

Wave 3 nav assemblies shipped. All 4 components created, build passes.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| All tasks | 2831fa6 | feat(02-03): add nav assemblies — AppNav, MobileNav, MobileBottomNav, PresencePanel |

## What Was Built

**AppNav** (`src/components/app-nav.tsx`) — Desktop nav (hidden md:flex, fixed top-0 z-50, h-16). Layout: GamiLogo(md) | centered search (flex-1 max-w-xl, visual-only) | CoinBalance (auth-only gate) | Avatar dropdown. Dropdown: Profile → Settings → Separator → Sign out (text-destructive). signOut() → toast.error on failure, router.push("/sign-in") on success.

**MobileNav** (`src/components/mobile-nav.tsx`) — Mobile top bar (flex md:hidden, fixed top-0 z-50, h-14) + search row (fixed top-14 z-40). Top bar: GamiLogo(sm) + Avatar dropdown only (no CoinBalance per D-05). Search row below. Same signOut wiring as AppNav.

**MobileBottomNav** (`src/components/mobile-bottom-nav.tsx`) — Fixed bottom tab bar (md:hidden, z-50, h-16). Two tabs: Home (/) and Store (/store). Active detection via usePathname(). text-primary active / text-muted-foreground inactive. aria-current="page" on active tab. env(safe-area-inset-bottom) inline style for iOS notch.

**PresencePanel** (`src/components/presence-panel.tsx`) — Convex subscription to api.presence.getOnlinePlayers. Three branches: loading skeleton (4 circles), empty ("No players online right now"), populated (horizontal scroll list with avatar + status dot). Status colors: online #22c55e, in-game oklch(0.5360 0.0398 196.0280). role="list" / role="listitem" a11y.

## Deviations

None. All components match plan spec exactly. Convex import in presence-panel.tsx uses relative path `../../convex/_generated/api` (consistent with Wave 2 fix; `@/` alias only resolves src/).

## Self-Check: PASSED

- All 4 files exist ✓
- Build passes ✓
- React Compiler compliant ✓
- Auth gating in AppNav (isAuthenticated && CoinBalance) ✓
- No CoinBalance in MobileNav ✓
- safe-area-inset-bottom inline style in MobileBottomNav ✓
- Status dot colors exact per UI-SPEC §4 ✓
