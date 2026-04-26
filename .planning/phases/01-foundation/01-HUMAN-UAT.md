---
status: partial
phase: 01-foundation
source: [01-VERIFICATION.md]
started: 2026-04-26T00:00:00Z
updated: 2026-04-26T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Sign up + sign in + session persistence
expected: Account created with email+password, redirected to /, session persists across browser refresh (cookie survives reload)
result: [pending]

### 2. Guest play (Play as Guest button)
expected: Click "Play as Guest" on sign-in or sign-up → anonymous session created → redirected to / → GuestBanner appears at top
result: [pending]

### 3. GuestBanner localStorage dismissal
expected: Dismiss banner, reload page → banner does not reappear
result: [pending]

### 4. Proxy protection: unauthenticated → /dashboard
expected: Visit /dashboard without session → redirect to /sign-in
result: [pending]

### 5. Proxy protection: authenticated → /sign-in
expected: Sign in (or play as guest), then visit /sign-in → redirect to /
result: [pending]

### 6. GuestBanner not shown for registered user
expected: Sign in as registered user → home page shows NO GuestBanner
result: [pending]

### 7. Guest-to-account conversion (AUTH-04)
expected: Play as Guest → visit /sign-up → create account → session converts from anonymous to registered, no progress lost
result: [pending]

## Summary

total: 7
passed: 0
issues: 0
pending: 7
skipped: 0
blocked: 0

## Gaps
