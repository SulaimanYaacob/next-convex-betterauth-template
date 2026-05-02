---
status: testing
phase: 03-game-shell-earn
source: 03-01-SUMMARY.md, 03-02-SUMMARY.md, 03-03-SUMMARY.md, 03-04-SUMMARY.md
started: 2026-05-02T00:00:00Z
updated: 2026-05-02T00:00:00Z
---

## Current Test

number: 1
name: Home page loads game cards from Convex
expected: |
  Open http://localhost:3000. The Solo Games section briefly shows 4 skeleton
  (gray pulsing) cards, then loads to show Pixel Rush (Arcade) and Mind Maze
  (Puzzle) as real clickable cards. The hardcoded placeholder data is gone.
awaiting: user response

## Tests

### 1. Home page loads game cards from Convex
expected: Open http://localhost:3000. Solo section briefly shows 4 gray skeleton cards while Convex data loads, then renders Pixel Rush (Arcade) and Mind Maze (Puzzle) as real cards. No hardcoded/placeholder game names.
result: [pending]

### 2. Multiplayer section shows empty state
expected: The Multiplayer section on the home page shows "No multiplayer games available yet." (since all seeded games are solo-only). No skeleton or broken layout.
result: [pending]

### 3. GameCard click navigates to game page
expected: Clicking the Pixel Rush card navigates the browser to /play/pixel-rush. The URL changes to /play/pixel-rush and the page is not the home page anymore.
result: [pending]

### 4. Game shell renders fullscreen with no chrome
expected: At /play/pixel-rush the page is full viewport, black background, no nav bar, no footer, no sidebar — zero UI chrome from the rest of the app. Just the iframe area.
result: [pending]

### 5. Loading spinner shows while iframe loads
expected: On arriving at /play/pixel-rush, a spinner (Loader2 animation) appears centered on the black background while the iframe loads. It disappears after the iframe finishes loading (even if the iframe content is blank/placeholder).
result: [pending]

### 6. ESC overlay opens and closes correctly
expected: While on /play/pixel-rush, press the ESC key. A "Paused" overlay appears with three buttons: Resume (primary), Settings (grayed out, not clickable), and Back to Lobby (ghost). Pressing ESC again or clicking Resume closes the overlay and returns to the game.
result: [pending]

### 7. Mobile pause button visibility
expected: In browser DevTools, switch to a mobile viewport (< 768px width). A circular pause button (floating, bottom-right corner) appears. Switch back to desktop (> 768px) — the button is hidden. Desktop uses keyboard ESC instead.
result: [pending]

### 8. Back to Lobby triggers reward screen
expected: Open ESC overlay (press ESC), click "Back to Lobby". The overlay closes and a full-screen reward overlay appears showing "Game Over" and a coin count (⟟ 0 since no real game session).
result: [pending]

### 9. Reward screen content and zero-coins subtitle
expected: The reward screen shows: "Game Over" label at top, "Coins Earned" section with a large ⟟ 0, a "No coins this round" subtitle (since coins = 0 with no active session), a separator, "Total Balance" label with the live CoinBalance component, and a "Back to Home" button.
result: [pending]

### 10. Back to Home from reward screen
expected: Click "Back to Home" on the reward screen. The browser navigates to the home page at /. The home page loads normally and scroll works (scroll lock is fully restored after leaving the game page).
result: [pending]

### 11. Unknown slug shows error state
expected: Navigate to /play/nonexistent-slug. The page renders a "Game not found." message with a subtitle and a "Back to Home" link. No crash, no white screen.
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
pending: 11
skipped: 0
blocked: 0

## Gaps

[none yet]
