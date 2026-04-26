---
phase: 01-foundation
plan: 03
subsystem: auth-ui
tags: [ui, auth, forms, sign-in, sign-up, guest]

dependency_graph:
  requires: [01-01, 01-02]
  provides: [sign-in-page, sign-up-page, guest-entry-point]
  affects: [proxy-gating-01-04, home-placeholder]

tech_stack:
  added: []
  patterns:
    - react-hook-form + zod (onBlur mode) for form validation
    - form.setError() for inline server error mapping (D-07)
    - authClient.signIn.anonymous() for guest flow (AUTH-03)
    - Better Auth onLinkAccount auto-handles guest conversion (AUTH-04, no extra UI)

key_files:
  created:
    - src/app/(unauth)/sign-in/page.tsx
    - src/app/(unauth)/sign-up/page.tsx
  modified: []

decisions:
  - name defaults to email on sign-up (no name field at registration in Phase 1 per plan spec)
  - ESLint pre-existing environment error (eslint-config-next class extends undefined) — not caused by these changes; TypeScript passes cleanly

metrics:
  duration_seconds: 166
  completed_date: 2026-04-26
  tasks_completed: 2
  files_created: 2
---

# Phase 1 Plan 03: Auth UI Pages Summary

Both auth pages built with email/password forms, inline error mapping, and Play as Guest guest entry — using GamiLogo + AuthCard structure from Plan 02 and Better Auth client from Plan 01.

## What Was Built

### Task 1: Sign-in page (`src/app/(unauth)/sign-in/page.tsx`) — 193 lines

- Calls `authClient.signIn.email({ email, password })`
- Calls `authClient.signIn.anonymous()` for Play as Guest
- Error mapping: `INVALID_EMAIL_OR_PASSWORD` + `USER_NOT_FOUND` → inline password field error "Incorrect email or password"
- Unknown errors → root error above submit button
- `mode: "onBlur"` on useForm (D-06: blur + submit validation)
- `autoFocus` on email input (UI-SPEC §7)
- No toasts — inline only (D-07)
- Touch targets: `min-h-[44px]` on button, sign-up link, Play as Guest button

### Task 2: Sign-up page (`src/app/(unauth)/sign-up/page.tsx`) — 198 lines

- Calls `authClient.signUp.email({ email, password, name: email })` (name defaulted, Phase 4 collects username)
- Calls `authClient.signIn.anonymous()` for Play as Guest
- Error mapping: `EMAIL_ALREADY_EXISTS` + `USER_ALREADY_EXISTS` → inline email field error
- Unknown errors → root error above submit button
- Password min(8) via zod — no strength meter (D-08)
- Identical structure to sign-in: same imports, same form layout, same guest button
- `autoComplete="new-password"` on password (vs `current-password` on sign-in)

## Better Auth Error Codes Covered

| Code | Page | Field | Message |
|------|------|-------|---------|
| `INVALID_EMAIL_OR_PASSWORD` | sign-in | password | "Incorrect email or password" |
| `USER_NOT_FOUND` | sign-in | password | "Incorrect email or password" |
| `EMAIL_ALREADY_EXISTS` | sign-up | email | "An account with this email already exists" |
| `USER_ALREADY_EXISTS` | sign-up | email | "An account with this email already exists" |
| (any other) | both | root | "Something went wrong. Please try again." |

Both INVALID_EMAIL_OR_PASSWORD and USER_NOT_FOUND collapse to the same message — prevents account enumeration (T-01-13).

## Requirements Delivered

- **AUTH-01**: Sign-up creates account with email + password (min 8 chars via zod)
- **AUTH-02**: Sign-in calls authClient.signIn.email; Better Auth handles session cookie persistence
- **AUTH-03**: Play as Guest button on both pages calls authClient.signIn.anonymous
- **AUTH-04**: No extra UI needed — Better Auth onLinkAccount (wired in Plan 01-01) auto-converts guest when sign-up form is submitted

## Design Decision Compliance

- **D-06**: `mode: "onBlur"` on useForm — validates on blur per field + all fields on submit
- **D-07**: Zero `toast.error` or `toast.success` calls in either file — all errors inline
- **D-08**: Password min(8) only — no strength indicator, no progress bar

## Deviations from Plan

None — plan executed exactly as written. The ESLint environment error (`eslint-config-next` class constructor issue) is pre-existing and unrelated to these files. TypeScript type-checks exit 0.

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | 9605052 | feat(01-03): create sign-in page with email/password and guest entry |
| 2 | 9e4d55b | feat(01-03): create sign-up page with email/password and guest entry |

## Self-Check: PASSED

- `src/app/(unauth)/sign-in/page.tsx` exists (193 lines)
- `src/app/(unauth)/sign-up/page.tsx` exists (198 lines)
- Commits 9605052 and 9e4d55b exist in git log
- TypeScript `pnpm tsc --noEmit` exits 0
- No toasts in either file
- No manual memoization in either file
- All error codes mapped to fixed user-facing strings (T-01-12, T-01-13, T-01-14 mitigated)
