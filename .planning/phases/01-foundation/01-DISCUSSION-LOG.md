# Phase 1: Foundation - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-26
**Phase:** 01-foundation
**Areas discussed:** Guest entry point, Auth page style, Validation feedback

---

## Guest Entry Point

| Option | Description | Selected |
|--------|-------------|----------|
| On sign-in page | "Play as Guest" link below the form; guest session created immediately | ✓ |
| Skip until Phase 2 | Phase 1 only builds sign-in/sign-up; guest entry added with home page | |
| Standalone /guest route | Dedicated page that creates anonymous session | |

**User's choice:** On sign-in page  
**Notes:** After guest click, land on home (`/`). Phase 1 placeholder is fine.

---

## Guest-to-Account Conversion

| Option | Description | Selected |
|--------|-------------|----------|
| Banner/prompt in nav | Persistent unobtrusive banner for guest users; dismissible | ✓ |
| Modal on game end | Post-session modal prompting account creation | |
| Claude's discretion | Decide during planning | |

**User's choice:** Banner/prompt in nav

---

## Auth Page Visual Style

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal centered card | Clean card on neutral background; matches V2 Refined | ✓ |
| Full-screen dark gaming | Dark background; card floats center; gaming-platform feel | |

**Background color:**

| Option | Description | Selected |
|--------|-------------|----------|
| Same neutral as home (#f8f6f2) | Unified with V2 Refined | ✓ |
| Pure white | Even more minimal | |
| Subtle geometric pattern | Faint dots/grid on neutral | |

**User's choice:** Minimal centered card on `#f8f6f2`

---

## Validation Feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Inline under each field | Error text below input on submit/blur; uses form.tsx | ✓ |
| Toast only | Errors via Sonner toasts | |
| Both | Inline for field errors, toast for server errors | |

**Password strength:**

| Option | Description | Selected |
|--------|-------------|----------|
| None — just min length | Minimal; error only if too short | ✓ |
| Strength bar | Weak/fair/strong indicator | |

**User's choice:** Inline errors, no strength indicator

---

## Claude's Discretion

- Sign-up form fields: email + password only (username optional, set from Profile page later)

## Deferred Ideas

- OAuth sign-in UI (Google/GitHub) — v2
- 2FA and magic link UI — v2
- Password reset flow — v2 or Phase 2
- Avatar upload at sign-up — Phase 4
