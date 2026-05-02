---
status: partial
phase: 04-cosmetics-store-profile
source: [direct Phase 4 implementation from Product Direction plan]
started: 2026-05-02T12:42:51.2758291+08:00
updated: 2026-05-02T12:42:51.2758291+08:00
---

## Current Test

number: 4
name: Authenticated Purchase + Equip Loop
expected: |
  Sign in as a real user with enough earned coins, open /store, choose an unowned purchasable common cosmetic, confirm purchase, then equip it. The item should become Owned/Equipped, the coin balance should debit once, and the cosmetic should apply globally without refresh.
awaiting: user response

## Tests

### 1. Store Catalog Renders
expected: Visiting /store shows a minimal cosmetics catalog with type filters, readable rarity/price labels, and seeded cursor, trail, and theme items.
result: pass
method: automated Playwright smoke test, desktop and mobile

### 2. Store Filters Work
expected: Clicking Cursor, Trail, or Theme narrows the visible catalog to that cosmetic type without errors or layout breakage.
result: pass
method: automated Playwright smoke test

### 3. Guest Profile State
expected: Visiting /profile while signed out shows a focused sign-in prompt and no broken authenticated-only controls.
result: pass
method: automated Playwright smoke test

### 4. Authenticated Purchase + Equip Loop
expected: Sign in as a real user with enough earned coins, open /store, choose an unowned purchasable common cosmetic, confirm purchase, then equip it. The item should become Owned/Equipped, the coin balance should debit once, and the cosmetic should apply globally without refresh.
result: blocked
blocked_by: third-party
reason: "Requires an authenticated browser session with a user that has coin ledger balance; not available to the agent's Playwright session."

### 5. Username Edit
expected: On /profile while signed in, changing the username and saving updates the profile display and presence display without refresh.
result: blocked
blocked_by: third-party
reason: "Requires an authenticated browser session; not available to the agent's Playwright session."

### 6. Global Cosmetic Application
expected: Equipped cursor skins change the platform cursor, equipped cursor trails follow pointer movement with pointer-events:none, and equipped themes update global CSS variables without a flash or reload.
result: blocked
blocked_by: third-party
reason: "Requires purchased/equipped items in an authenticated user session; not available to the agent's Playwright session."

### 7. Presence Cosmetic Indicators
expected: Online/in-game players in the multiplayer presence panel show small equipped cosmetic indicators when they have equipped cosmetics.
result: blocked
blocked_by: third-party
reason: "Requires at least one authenticated active presence row with equipped cosmetics."

## Summary

total: 7
passed: 3
issues: 0
pending: 0
skipped: 0
blocked: 4

## Gaps

[none yet]
