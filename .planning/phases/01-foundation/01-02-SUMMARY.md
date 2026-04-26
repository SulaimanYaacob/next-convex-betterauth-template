---
phase: 01-foundation
plan: "02"
subsystem: ui
tags: [react, next.js, tailwind, lucide, better-auth, next-font, sora]

# Dependency graph
requires: []
provides:
  - GamiLogo component — three size variants (sm/md/lg), SVG overlapping-squares mark, Sora wordmark
  - GuestBanner component — sticky anonymous-user conversion bar with localStorage dismissal
  - (unauth) route group layout — Sora font, #f8f6f2 bg, dark-mode isolation via inline colorScheme
affects:
  - 01-03 (auth pages) — imports GamiLogo and uses (unauth) layout, renders GuestBanner on /

# Tech tracking
tech-stack:
  added:
    - next/font/google Sora (weight 600, --font-sora CSS variable)
  patterns:
    - Two-stage hydration pattern for localStorage-dependent client components (hydrated + dismissed state)
    - Inline style for auth page background/colorScheme to bypass CSS-var dark-mode resolution
    - SVG mark using var(--primary) with fillOpacity=0.4 for secondary shape

key-files:
  created:
    - src/components/gami-logo.tsx
    - src/components/guest-banner.tsx
    - src/app/(unauth)/layout.tsx
  modified: []

key-decisions:
  - "GamiLogo is a server component (no use client) — no hooks needed, purely presentational"
  - "GuestBanner uses two-stage hydration (hydrated flag) to prevent SSR/CSR mismatch on localStorage read"
  - "(unauth) layout uses inline backgroundColor/colorScheme to avoid dark-mode bleed-through via CSS custom properties"
  - "isAnonymous cast through {isAnonymous?: boolean} avoids breaking TypeScript while handling inferAdditionalFields runtime behavior"

patterns-established:
  - "Two-stage hydration: set hydrated=true in useEffect before reading localStorage to avoid mismatch"
  - "Auth layout isolation: backgroundColor + colorScheme as inline styles, not Tailwind bg-background"
  - "Font variable pattern: next/font/google object .variable className on wrapper div, consumed via CSS var(--font-name)"

requirements-completed: [AUTH-04]

# Metrics
duration: 15min
completed: 2026-04-26
---

# Phase 1 Plan 02: UI Primitives Summary

**Brand GamiLogo (SVG mark + Sora wordmark), anonymous GuestBanner with two-stage localStorage dismissal, and (unauth) route group layout enforcing light-mode isolation via inline colorScheme**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-04-26T12:13:00Z
- **Completed:** 2026-04-26T12:28:44Z
- **Tasks:** 3
- **Files modified:** 3 created, 0 modified

## Accomplishments

- GamiLogo server component with sm/md/lg size variants, overlapping-squares SVG mark using var(--primary) at 100%/40% opacity, Sora wordmark
- GuestBanner client component reads isAnonymous from authClient.useSession(), two-stage hydration prevents SSR/CSR mismatch, localStorage dismissal persists across reloads, 44px touch targets on both interactive elements
- (unauth) route group layout with Sora font (weight 600, --font-sora variable), inline #f8f6f2 background, colorScheme: "light" and data-theme="light" to prevent dark-mode CSS-var bleed-through (Pitfall 4)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/components/gami-logo.tsx** - `36d10fa` (feat)
2. **Task 2: Create src/components/guest-banner.tsx** - `17668b7` (feat)
3. **Task 3: Create src/app/(unauth)/layout.tsx** - `9347afe` (feat)

## Files Created/Modified

- `src/components/gami-logo.tsx` (43 lines) — Brand logo component: SVG overlapping-squares mark + "gami" Sora wordmark, three size variants, server-renderable
- `src/components/guest-banner.tsx` (76 lines) — Sticky anonymous-user conversion banner with two-stage hydration, localStorage dismissal, 44px touch targets
- `src/app/(unauth)/layout.tsx` (21 lines) — Route group layout: Sora font setup, #f8f6f2 background, colorScheme light, data-theme light

## Decisions Made

- GamiLogo is a pure server component — no `"use client"` needed since it has no hooks or event handlers. This allows it to be rendered in RSC contexts without client bundle bloat.
- Two-stage hydration pattern chosen for GuestBanner (hydrated + dismissed states) rather than suppressHydrationWarning to be explicit about when localStorage is available.
- (unauth) layout uses inline style for backgroundColor and colorScheme rather than Tailwind `bg-background` class — avoids CSS custom property resolution that would pick up dark mode from `.dark` on `<html>`.
- isAnonymous typed via `{ isAnonymous?: boolean }` cast instead of extending the session type — minimal change that satisfies TypeScript while handling the inferAdditionalFields runtime behavior without breaking the existing auth-client module.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `pnpm lint` command failed in the worktree due to missing node_modules (worktree uses symlinks to the main project). Running lint from the main project root also failed with a pre-existing ESLint 10 + eslint-config-next compatibility error (`Class extends value undefined is not a constructor or null`). This is a pre-existing project-level issue unrelated to the changes in this plan. TypeScript (`npx tsc --noEmit`) passed cleanly for all three files.

## Threat Surface Scan

T-01-10 (XSS via wordmark/banner text): All copy is static literal strings in GamiLogo and GuestBanner. No `dangerouslySetInnerHTML`. Lucide X icon renders inert SVG. React escapes dynamic content by default. No new threat surface.

T-01-11 (dark mode bleed): Mitigated as planned — (unauth) layout uses inline `colorScheme: "light"` and explicit hex `#f8f6f2`. Verified by acceptance criteria grep.

No new threat surface beyond the plan's threat register.

## Known Stubs

None — GamiLogo, GuestBanner, and UnAuthLayout are complete implementations, not stubs. Auth pages (Plan 03) will compose these.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 03 (auth pages: sign-in, sign-up) can now import `<GamiLogo />` and render inside the `(unauth)` route group layout
- `<GuestBanner />` can be placed in the home page (`/`) for anonymous user conversion
- Sora font variable `--font-sora` will resolve correctly for any component rendered inside the (unauth) layout

## Self-Check

Files exist:
- `src/components/gami-logo.tsx`: FOUND
- `src/components/guest-banner.tsx`: FOUND
- `src/app/(unauth)/layout.tsx`: FOUND

Commits exist:
- `36d10fa`: FOUND (feat(01-02): create GamiLogo component)
- `17668b7`: FOUND (feat(01-02): create GuestBanner component)
- `9347afe`: FOUND (feat(01-02): create (unauth) route group layout)

## Self-Check: PASSED

---
*Phase: 01-foundation*
*Completed: 2026-04-26*
