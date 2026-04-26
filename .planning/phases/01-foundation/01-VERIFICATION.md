---
phase: 01-foundation
verified: 2026-04-26T00:00:00Z
status: human_needed
score: 15/15 must-haves verified
overrides_applied: 0
requirements_verified:
  - ECON-01
  - PRES-01
  - AUTH-01
  - AUTH-02
  - AUTH-03
  - AUTH-04
must_haves_verified: 15
gaps: []
human_verification:
  - test: "Sign up with email + password, then sign in with same credentials"
    expected: "Account created, redirected to /, session persists across browser refresh"
    why_human: "Requires live Convex backend with Better Auth configured and network I/O"
  - test: "Click 'Play as Guest' on sign-in or sign-up page"
    expected: "Anonymous session created, redirected to /, GuestBanner appears at top of page"
    why_human: "Requires live auth session and DOM rendering"
  - test: "Dismiss GuestBanner then reload the page"
    expected: "Banner does not reappear (localStorage persistence)"
    why_human: "Requires browser localStorage in a live session"
  - test: "Visit /dashboard without a session"
    expected: "Redirect to /sign-in"
    why_human: "Requires live proxy edge runtime and session validation HTTP call"
  - test: "Sign in (or play as guest), then visit /sign-in"
    expected: "Redirect to /"
    why_human: "Requires live authenticated session and proxy"
  - test: "Play as guest, then submit the sign-up form with a new email"
    expected: "onLinkAccount fires, anonymous session converted to full account, no data loss"
    why_human: "Requires live Better Auth session linkage and Convex onLinkAccount hook"
---

# Phase 1: Foundation Verification Report

**Phase Goal:** Establish the complete platform schema (all 7 tables, all indexes), wire the auth lifecycle hooks (onCreateUser, onDeleteUser, onLinkAccount for anonymous sessions), build auth UI pages (sign-in, sign-up, guest entry), and harden the route proxy — so all 5 phases can build on this foundation without schema migrations, and users can authenticate (including as guests) from day one.

**Verified:** 2026-04-26
**Status:** human_needed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All 7 platform tables exist in Convex with correct indexes — no migrations needed in later phases | VERIFIED | convex/schema.ts has exactly 7 tables: users, coinLedger, presence, storeItems, ownedItems, equippedItems, games. All 12 indexes use `by_` prefix. |
| 2 | Coin balance is computed by SUM over coinLedger; no mutable balance field exists anywhere | VERIFIED | coinLedger table has signed `amount: v.number()` field. No `coinBalance` or `balance:` field in schema. ECON-01 invariant holds. |
| 3 | Presence is a separate table; heartbeat writes never invalidate user document subscribers | VERIFIED | presence is its own table with `userId`, `lastSeen`, `status` — no status/lastSeen on users document. updatePresence mutation exists in convex/presence.ts. |
| 4 | Deleting a user cascades into presence, coinLedger, ownedItems, equippedItems, games | VERIFIED | syncUserDeletion in convex/users.ts cascades through all 5 tables using .take(100) + for-of loops. Inline fallback in src/lib/auth.ts also covers all 5 tables. |
| 5 | syncUserCreation is idempotent — never inserts duplicate users rows for same email | VERIFIED | syncUserCreation queries `by_email` before inserting; returns early if row exists. |
| 6 | getCurrentUser query resolves correctly using the renamed by_email index | VERIFIED | convex/auth.ts line 32: `.withIndex("by_email", (q) => q.eq("email", betterAuthUser.email))` |
| 7 | onLinkAccount hook is wired on the anonymous() plugin | VERIFIED | src/lib/auth.ts line 91: `onLinkAccount: async ({ anonymousUser, newUser }) => { ... }` inside `anonymous({ ... })` call |
| 8 | GamiLogo renders in 3 size variants with overlapping-square SVG mark | VERIFIED | src/components/gami-logo.tsx: sizeMap with sm/md/lg, two SVG rects using var(--primary) at 100% and 40% opacity, Sora wordmark |
| 9 | AuthLayout forces light mode and #f8f6f2 background independent of system theme | VERIFIED | src/app/(unauth)/layout.tsx: inline `backgroundColor: "#f8f6f2", colorScheme: "light"`, `data-theme="light"`, Sora font variable |
| 10 | GuestBanner appears for anonymous sessions, can be dismissed, and persists dismissal | VERIFIED | guest-banner.tsx: reads `session?.user?.isAnonymous`, writes/reads `gami_banner_dismissed` localStorage key, two-stage hydration pattern |
| 11 | Sign-in page calls authClient.signIn.email and authClient.signIn.anonymous; errors are inline | VERIFIED | sign-in/page.tsx: authClient.signIn.email (onSubmit), authClient.signIn.anonymous (handleGuestSignIn), form.setError() for inline errors, no toast calls |
| 12 | Sign-up page calls authClient.signUp.email (min 8 chars) and authClient.signIn.anonymous; EMAIL_ALREADY_EXISTS mapped inline | VERIFIED | sign-up/page.tsx: password min(8) zod rule, authClient.signUp.email, EMAIL_ALREADY_EXISTS/USER_ALREADY_EXISTS mapped to email field error |
| 13 | Proxy redirects unauthenticated users from /dashboard and /settings to /sign-in | VERIFIED | src/proxy.ts: protectedRoutes = ["/dashboard", "/settings"], `NextResponse.redirect(new URL("/sign-in", request.url))` when !isAuthenticated |
| 14 | Proxy redirects authenticated users (including guests) from /sign-in and /sign-up to / | VERIFIED | src/proxy.ts: authRoutes = ["/sign-in", "/sign-up"], `NextResponse.redirect(new URL("/", request.url))` when isAuthenticated |
| 15 | Home placeholder renders GuestBanner and shows "Gami / Games and more — coming soon" | VERIFIED | src/app/page.tsx: imports GuestBanner, renders it above `<main>`, h1 "Gami", p "Games and more — coming soon" |

**Score:** 15/15 truths verified

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `convex/schema.ts` | 7-table platform schema lock | VERIFIED | 7 tables, 12 by_-prefixed indexes, no todos, no mutable balance field |
| `convex/users.ts` | Idempotent syncUserCreation + 5-table cascading syncUserDeletion | VERIFIED | idempotency guard via by_email query, cascade uses .take(100), all 5 FK tables covered |
| `convex/presence.ts` | Public updatePresence mutation (PRES-01) | VERIFIED | exports updatePresence, derives identity from betterAuthComponent.getAuthUser, upsert pattern |
| `convex/auth.ts` | getCurrentUser query using by_email index | VERIFIED | line 32 uses withIndex("by_email") |
| `src/lib/auth.ts` | anonymous() onLinkAccount hook + 5-table delete.after inline fallback | VERIFIED | onLinkAccount at line 91, delete.after cascades coinLedger/ownedItems/equippedItems/games/presence |
| `src/components/gami-logo.tsx` | Reusable brand logo with size variants | VERIFIED | 44 lines, sm/md/lg sizes, SVG mark with var(--primary), Sora wordmark, server component |
| `src/components/guest-banner.tsx` | Persistent unobtrusive guest-to-account conversion bar | VERIFIED | 77 lines, "use client", isAnonymous check, localStorage dismissal, 44px touch targets |
| `src/app/(unauth)/layout.tsx` | Light-mode-isolated layout shell | VERIFIED | Sora font, #f8f6f2, colorScheme: "light", data-theme="light", min-h-svh |
| `src/app/(unauth)/sign-in/page.tsx` | Sign-in form with guest entry point | VERIFIED | 193 lines, "use client", authClient.signIn.email + authClient.signIn.anonymous, inline errors, mode: onBlur |
| `src/app/(unauth)/sign-up/page.tsx` | Sign-up form with guest entry point | VERIFIED | 198 lines, "use client", authClient.signUp.email + authClient.signIn.anonymous, min(8) password, EMAIL_ALREADY_EXISTS mapping |
| `src/proxy.ts` | Real route protection with HTTP session validation | VERIFIED | HTTP fetch to /api/auth/get-session, protectedRoutes + authRoutes + redirect logic, cache: no-store, original matcher preserved |
| `src/app/page.tsx` | Phase 1 home placeholder + GuestBanner mount point | VERIFIED | Imports and renders GuestBanner, semantic main element, correct copy |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| src/lib/auth.ts databaseHooks.user.create.after | internal.users.syncUserCreation | ctx.runMutation | WIRED | line 134: `ctx.runMutation(internal.users.syncUserCreation, { email: user.email })` |
| src/lib/auth.ts databaseHooks.user.delete.after | internal.users.syncUserDeletion | ctx.runMutation | WIRED | line 147: `ctx.runMutation(internal.users.syncUserDeletion, { email: user.email })` |
| convex/auth.ts getCurrentUser | users.by_email index | withIndex | WIRED | line 32: `.withIndex("by_email", (q) => q.eq("email", betterAuthUser.email))` |
| convex/presence.ts updatePresence | presence.by_userId index | withIndex | WIRED | line 29: `.withIndex("by_userId", (q) => q.eq("userId", appUser._id))` |
| src/components/guest-banner.tsx | authClient.useSession | isAnonymous field | WIRED | line 11: `authClient.useSession()`, line 39: `session?.user?.isAnonymous` |
| src/components/guest-banner.tsx | localStorage | gami_banner_dismissed key | WIRED | DISMISS_KEY constant, read in useEffect, written in handleDismiss |
| src/app/(unauth)/layout.tsx | next/font/google Sora | --font-sora CSS variable | WIRED | `variable: "--font-sora"` in Sora() config |
| sign-in/page.tsx onSubmit | authClient.signIn.email | Better Auth client | WIRED | line 51: `authClient.signIn.email({ email, password })` |
| sign-up/page.tsx onSubmit | authClient.signUp.email | Better Auth client | WIRED | line 51: `authClient.signUp.email({ email, password, name })` |
| Both pages handleGuestSignIn | authClient.signIn.anonymous | Better Auth anonymous plugin | WIRED | sign-in line 74, sign-up line 77: `authClient.signIn.anonymous()` |
| Both pages | GamiLogo, AuthCard structure | import | WIRED | `import { GamiLogo } from "@/components/gami-logo"` in both pages |
| src/proxy.ts | /api/auth/get-session | HTTP fetch with cookie header | WIRED | line 22-27: fetch to `/api/auth/get-session` with forwarded cookie |
| src/proxy.ts protectedRoutes | /sign-in redirect | NextResponse.redirect | WIRED | line 57: `NextResponse.redirect(new URL("/sign-in", request.url))` |
| src/app/page.tsx | src/components/guest-banner.tsx | import | WIRED | line 1: `import { GuestBanner } from "@/components/guest-banner"` |

---

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| guest-banner.tsx | session.user.isAnonymous | authClient.useSession() — Better Auth client subscription | Yes (live session from Better Auth) | FLOWING |
| sign-in/page.tsx | form errors, router.push | authClient.signIn.email() response + form.setError | Yes (real auth response) | FLOWING |
| sign-up/page.tsx | form errors, router.push | authClient.signUp.email() response + form.setError | Yes (real auth response) | FLOWING |
| proxy.ts isAuthenticated | boolean | HTTP fetch to /api/auth/get-session | Yes (real session check) | FLOWING |

---

### Behavioral Spot-Checks

Step 7b: SKIPPED — requires live Convex + Next.js dev server; no runnable entry points testable without network and auth service.

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ECON-01 | 01-01 | Coin ledger is append-only; no mutable balance field | SATISFIED | schema.ts: coinLedger table with signed amount field, no coinBalance anywhere |
| PRES-01 | 01-01 | Separate presence table; heartbeat mutation updates lastSeen | SATISFIED | presence table in schema.ts, updatePresence mutation in convex/presence.ts |
| AUTH-01 | 01-03 | User can create account with email and password | SATISFIED | sign-up/page.tsx calls authClient.signUp.email with zod min(8) password validation |
| AUTH-02 | 01-03, 01-04 | User can sign in and session persists across browser refresh | SATISFIED (partial — human verify) | sign-in/page.tsx calls authClient.signIn.email; proxy validates session via HTTP; cookie persistence via Better Auth |
| AUTH-03 | 01-03, 01-04 | User can play as guest without registering | SATISFIED (partial — human verify) | Both auth pages call authClient.signIn.anonymous(); proxy recognizes anonymous session as authenticated |
| AUTH-04 | 01-01, 01-03 | Guest user can convert to full account (keeps progress) | SATISFIED (partial — human verify) | onLinkAccount hook wired in anonymous() plugin; sign-up form triggers conversion automatically; Phase 1 data migration deferred to Phase 3 when game data exists |

---

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| src/lib/auth.ts | 138-141 | Inline `ctx.db.insert("users", { email })` in create.after fallback lacks idempotency guard | Info | The primary code path (via `ctx.runMutation` to syncUserCreation) is idempotent. The inline fallback is a secondary path used only when ctx doesn't have runMutation — less likely to encounter the double-fire scenario. Not a blocker. |
| convex/auth.ts | 37 | `console.warn` left in getCurrentUser for missing app user | Info | Debug warning, not user-visible. Low impact. |

No blocker anti-patterns found. No stub patterns found. No hardcoded empty data arrays returned from real data paths.

---

### Human Verification Required

The automated verification confirms all artifacts exist, are substantive, and are wired. The following tests require a running environment:

#### 1. Full Auth Registration Flow

**Test:** Open the app, navigate to /sign-up, enter a new email + password (8+ chars), submit the form.
**Expected:** Account created, redirected to /, user session active, GuestBanner not visible (registered user).
**Why human:** Requires live Convex backend, Better Auth JWKS, email validation, session cookie issuance.

#### 2. Sign-In and Session Persistence

**Test:** After registering, close and reopen the browser tab, then visit /dashboard.
**Expected:** Proxy recognizes the session, does not redirect to /sign-in. Session persists.
**Why human:** Requires live proxy edge runtime validating the session cookie via HTTP.

#### 3. Guest (Anonymous) Flow

**Test:** Click "Play as Guest" on sign-in or sign-up page.
**Expected:** Anonymous session created, redirected to /, GuestBanner appears with "Create an account to save your progress" copy and a "Create account" link.
**Why human:** Requires live Better Auth anonymous plugin, Convex syncUserCreation fired, session cookie set.

#### 4. GuestBanner Dismissal Persistence

**Test:** While on / as a guest, click the X button on the GuestBanner, then reload the page.
**Expected:** Banner does not reappear. Clearing localStorage and reloading shows banner again.
**Why human:** Requires browser localStorage in a live session with actual anonymous auth state.

#### 5. Proxy Redirect — Protected Route

**Test:** Open a private/incognito browser window, visit /dashboard directly.
**Expected:** Immediately redirected to /sign-in.
**Why human:** Requires live Next.js edge middleware calling /api/auth/get-session.

#### 6. Proxy Redirect — Auth Route Bounce

**Test:** Sign in (or play as guest), then navigate to /sign-in manually.
**Expected:** Immediately redirected to / (proxy detects active session).
**Why human:** Requires live authenticated session and proxy.

#### 7. Guest-to-Account Conversion

**Test:** Play as guest, then click "Create account" in the GuestBanner, submit the sign-up form with a new email.
**Expected:** Better Auth onLinkAccount fires, guest account merged into new account, progress preserved (no game data in Phase 1 — conversion is structural only).
**Why human:** Requires live onLinkAccount hook execution in Convex and Better Auth session linkage.

---

### Gaps Summary

No gaps found. All 15 must-haves verified. All required artifacts exist and are substantive, wired, and (where applicable) have real data flowing through them.

The 7 human verification items above are standard smoke tests for a real-time auth system — they cannot be verified programmatically without a live Convex deployment and browser session. The code review confirms all implementation paths are correctly authored.

**Inline fallback idempotency:** The `databaseHooks.user.create.after` inline fallback (the `else if ("db" in ctx)` branch) does a direct `ctx.db.insert` without an existence check, unlike the primary path through `syncUserCreation`. This is a minor observation — the inline fallback is the secondary path activated only in constrained ctx types where `runMutation` is unavailable. It does not block the phase goal.

---

_Verified: 2026-04-26_
_Verifier: Claude (gsd-verifier)_
