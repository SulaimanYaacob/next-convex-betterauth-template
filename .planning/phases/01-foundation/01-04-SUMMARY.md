---
phase: 01-foundation
plan: "04"
subsystem: auth
tags: [middleware, routing, next.js, better-auth, session, proxy, home]

# Dependency graph
requires:
  - phase: 01-foundation/01-01
    provides: Convex schema, auth setup, Better Auth configuration
  - phase: 01-foundation/01-02
    provides: GuestBanner component (sticky top banner for anonymous sessions)

provides:
  - Real session-validated route protection in src/proxy.ts (replaces non-redirecting stub)
  - Redirect of unauthenticated users from /dashboard and /settings to /sign-in
  - Redirect of authenticated users (including guests) from /sign-in and /sign-up to /
  - Phase 1 home placeholder at src/app/page.tsx with GuestBanner mount point

affects:
  - All future phases that add protected routes (extend protectedRoutes array)
  - Phase 2 (Home + Presence) which will replace the home placeholder with real content
  - AUTH-02 session persistence (proxy now enforces it)
  - AUTH-03 guest play (proxy recognizes anonymous sessions as authenticated)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Edge proxy session validation via HTTP fetch to /api/auth/get-session with forwarded cookie header"
    - "Fail-closed session check: errors return false, sending unauthenticated users to /sign-in"
    - "Early-return optimization: only protectedRoutes and authRoutes pay the HTTP roundtrip cost"
    - "Server component home page imports client component (GuestBanner) without use client directive"

key-files:
  created: []
  modified:
    - src/proxy.ts
    - src/app/page.tsx

key-decisions:
  - "Session validated via HTTP fetch to /api/auth/get-session (not local cookie parsing) — per CLAUDE.md guidance and RESEARCH Assumption A1"
  - "cache: no-store on session fetch to prevent edge cache serving stale auth state"
  - "Anonymous (guest) sessions count as authenticated for proxy — guests bounce from /sign-in but are blocked from /dashboard in Phase 1"
  - "Early-return pattern skips HTTP roundtrip for all routes not in protectedRoutes or authRoutes"

patterns-established:
  - "Pattern: proxy session check is raw fetch to /api/auth/get-session, never local cookie parsing"
  - "Pattern: home page is a server component — client boundary lives inside GuestBanner"

requirements-completed: [AUTH-02, AUTH-03]

# Metrics
duration: 2min
completed: 2026-04-26
---

# Phase 1 Plan 04: Proxy Hardening + Home Placeholder Summary

**Real route protection via HTTP session fetch replacing non-redirecting stub, plus Phase 1 home placeholder with GuestBanner for anonymous users**

## Performance

- **Duration:** 2 min
- **Started:** 2026-04-26T12:42:19Z
- **Completed:** 2026-04-26T12:44:25Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Replaced the no-op proxy stub (called `getSessionCookie` but never redirected) with a hardened proxy that validates sessions via HTTP fetch to `/api/auth/get-session`
- Unauthenticated visitors hitting `/dashboard` or `/settings` are now redirected to `/sign-in`
- Authenticated users (including anonymous guests) hitting `/sign-in` or `/sign-up` are redirected to `/`
- Replaced `"Fresh Start"` scaffold home page with a centered "Gami / Games and more — coming soon" placeholder that mounts `<GuestBanner />` for anonymous sessions

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite src/proxy.ts with real session-based route protection** - `ddeaac2` (feat)
2. **Task 2: Replace src/app/page.tsx with Phase 1 home placeholder + GuestBanner** - `ad8e973` (feat)

**Plan metadata:** (docs commit — created below)

## Files Created/Modified

- `src/proxy.ts` — Real route protection: fetches session via HTTP, redirects protected/auth routes, preserves original matcher byte-for-byte, fail-closed on errors
- `src/app/page.tsx` — Server component home placeholder; imports GuestBanner, renders centered "Gami / Games and more — coming soon" copy

## Decisions Made

- Session validated via HTTP fetch to `/api/auth/get-session` (not local cookie parsing) — per CLAUDE.md architecture guidance and RESEARCH.md Assumption A1 noting import path unreliability at edge runtime
- `cache: "no-store"` on session fetch to prevent edge cache serving stale auth state across requests
- Anonymous (guest) sessions recognized as authenticated — guests bounce from `/sign-in`/`/sign-up` but remain blocked from `/dashboard`/`/settings` in Phase 1
- Early-return skips HTTP roundtrip for all routes not in `protectedRoutes` or `authRoutes` (performance optimization per T-01-22)

## Deviations from Plan

None — plan executed exactly as written.

The pre-existing ESLint environment breakage (eslint-config-next incompatibility with @typescript-eslint version) was confirmed as out-of-scope — it affected the entire project before these changes. TypeScript (`pnpm tsc --noEmit`) passed cleanly for both tasks.

## Proxy Session Validation Details

- **protectedRoutes:** `/dashboard`, `/settings` — unauthenticated users redirected to `/sign-in`
- **authRoutes:** `/sign-in`, `/sign-up` — authenticated users (including guests) redirected to `/`
- **Session check:** `GET /api/auth/get-session` with forwarded `cookie` header, `cache: "no-store"`
- **Matcher (preserved byte-for-byte):** `["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"]`
- **Fail behavior:** Any fetch error or missing cookie → returns `false` (fail-closed for protected, fail-open for auth)

## Issues Encountered

None.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Auth enforcement is now active — visiting `/dashboard` without a session correctly redirects to `/sign-in`
- Guest sessions recognized by proxy — AUTH-03 guest play flow is gated correctly
- Home page ready to receive Phase 2 nav scaffolding (replace placeholder with real layout)
- ESLint environment issue should be investigated before Phase 2 (pre-existing, not caused by this plan)

## Known Stubs

None — the home placeholder is intentional per the plan spec. Phase 2 will replace it with real content.

## Threat Flags

No new security surface introduced beyond what the plan's threat model covers. The proxy replaces a stub — it does not add new network endpoints or auth paths.

---
*Phase: 01-foundation*
*Completed: 2026-04-26*
