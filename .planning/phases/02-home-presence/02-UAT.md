---
status: complete
phase: 02-home-presence
source: [02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md]
started: 2026-05-01T00:00:00Z
updated: 2026-05-01T00:00:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Home Page — Two Sections Visible
expected: Visiting / shows two stacked content sections. Top section has warm off-white background (#f8f6f2) with heading "Solo" and 2 placeholder game cards. Bottom section has light blue-grey background (#f1f5fb) with heading "Multiplayer" and 2 placeholder game cards.
result: pass

### 2. FilterChips Strip
expected: Directly below the nav (before the Solo section), a horizontal strip of 4 chips is visible: "All", "Multiplayer", "Desktop", "Mobile". "All" appears visually selected/active by default. Clicking other chips updates visual selection but does not filter any content (visual-only in Phase 2).
result: issue
reported: "Yes correct, the only issue right now the header doesn't feel centered (it has empty spaces on the right side)"
severity: cosmetic

### 3. PresencePanel in Multiplayer Section
expected: Inside the Multiplayer section, below the game cards, a "Online now" panel is visible. It shows either a loading skeleton (4 pulsing circles) if the Convex backend hasn't responded yet, "No players online right now" if no one is active, or a horizontal list of player avatars with status dots if players are online.
result: pass

### 4. Desktop Nav (AppNav) — md+ viewports
expected: On a desktop-width viewport (≥768px), a fixed top nav bar is visible with: Gami logo on the left, a search input in the center, and an avatar button on the right. The nav is 64px tall and stays fixed during scroll. (If signed in, a coin balance with ⟟ glyph appears between search and avatar.)
result: pass

### 5. Mobile Nav — <md viewports
expected: On a mobile-width viewport (<768px), two fixed bars appear at the top: (1) a 56px top bar with Gami logo left and avatar button right, (2) a full-width search bar immediately below it. The desktop nav is hidden. Total top offset before content is ~104px.
result: pass

### 6. Mobile Bottom Nav — <md viewports
expected: On mobile, a fixed bottom tab bar is visible with two tabs: "Home" (house icon) and "Store" (bag icon). The Home tab is highlighted in primary color when on /. Tapping Store navigates to /store and the Store tab becomes active/highlighted.
result: pass

### 7. Page Scroll
expected: The home page scrolls normally top-to-bottom. Content is not clipped or trapped — you can reach the Multiplayer section and PresencePanel by scrolling down. No white space or overflow issues.
result: pass

### 8. Avatar Dropdown — Sign Out Flow
expected: Clicking the avatar button (desktop or mobile) opens a dropdown with "Profile", "Settings", and "Sign out". Clicking "Sign out" logs the session out and redirects to /sign-in. A toast error appears if sign-out fails.
result: pass

### 9. CoinBalance — Authenticated User
expected: When signed in as a non-guest user, the desktop nav shows a coin balance display (e.g. "⟟ 0") between the search bar and avatar. Guests and unauthenticated users do not see this element. It shows a loading skeleton briefly while the Convex query resolves.
result: pass

### 10. Store Route
expected: Navigating to /store (via URL or bottom-nav Store tab) loads a page without a 404. The page may be a placeholder — that's expected in Phase 2.
result: pass

## Summary

total: 10
passed: 9
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "FilterChips strip and nav header feel visually centered with no empty space on one side"
  status: failed
  reason: "User reported: header doesn't feel centered, empty spaces on the right side"
  severity: cosmetic
  test: 2
  artifacts: []
  missing: []
