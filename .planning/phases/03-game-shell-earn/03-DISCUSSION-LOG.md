# Phase 3: Game Shell + Earn - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-01
**Phase:** 03-game-shell-earn
**Areas discussed:** Game Routing, ESC Overlay, postMessage Contract, Coin Earn Formula, Maintainability/Extensibility, Reward Screen, Schema Split

---

## Game Routing

| Option | Description | Selected |
|--------|-------------|----------|
| Full-page route `/play/[gameId]` | Dedicated page, fullscreen iframe, browser back goes to home | ✓ |
| Overlay modal | Game opens in Dialog over home page, no URL change | |

**User's choice:** Full-page route  
**Notes:** Clean URL, shareable, best for mobile fullscreen.

---

## Game Data (hardcoded vs Convex)

| Option | Description | Selected |
|--------|-------------|----------|
| Wire to Convex games table | Seed real records, GameCard reads from Convex | ✓ |
| Keep hardcoded | Stay with hardcoded arrays, defer to later phase | |

**User's choice:** Wire to Convex  
**Notes:** Foundation for adding future games without code changes.

---

## Game URL Scheme

| Option | Description | Selected |
|--------|-------------|----------|
| Slug-based `/play/pixel-rush` | Human-readable, stable, slug in DB | ✓ |
| Convex doc ID | Opaque, breaks if record re-seeded | |

**User's choice:** Slug-based

---

## Game Source URL

| Option | Description | Selected |
|--------|-------------|----------|
| URL stored in Convex games table | iframeUrl field, add game = seed record | ✓ |
| Hardcoded map in code | slug→URL map in config file, requires code deploy | |

**User's choice:** Convex-stored URL

---

## ESC Overlay Visual

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen dim | Semi-transparent dark overlay, game pauses behind | ✓ |
| Slide-in panel | Panel from edge, game partially visible | |

**User's choice:** Full-screen dim

---

## Settings Scope (ESC Overlay)

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder only | Button exists, shows "coming soon" | ✓ |
| Audio toggle only | Single mute/unmute stored in localStorage | |

**User's choice:** Placeholder only  
**Notes:** Avoids scope creep, real settings in Phase 4+.

---

## Back to Lobby Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Trigger GAME_OVER + reward | Synthetic session end, coins credited, reward screen shown | ✓ |
| Just navigate away | Unmounts game, coins not credited for abandoned sessions | |

**User's choice:** Trigger GAME_OVER + reward  
**Notes:** Players don't lose progress when pausing and quitting.

---

## Mobile Pause Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Floating pause button | Icon overlaid in corner, outside iframe | ✓ |
| Swipe gesture | Swipe from edge, conflicts with scroll gestures | |

**User's choice:** Floating pause button

---

## postMessage Types (platform receives)

| Option | Description | Selected |
|--------|-------------|----------|
| GAME_OVER | Required — triggers coin earn | ✓ |
| GAME_STARTED | Platform creates session + sets presence "in-game" | ✓ |
| SCORE_UPDATE | Live score stored on session record | ✓ |

**User's choice:** All three

---

## Origin Validation

| Option | Description | Selected |
|--------|-------------|----------|
| Allowlist in env var | ALLOWED_GAME_ORIGINS comma-separated | ✓ |
| Same-origin only | Only accepts same domain | |
| No validation | Dev only, not production-safe | |

**User's choice:** Allowlist in env var

---

## Platform→Game Messages

| Option | Description | Selected |
|--------|-------------|----------|
| SESSION_INIT on load | `{ type, userId, sessionId }` posted after iframe load | ✓ |
| No messages back | One-way only | |

**User's choice:** SESSION_INIT on load

---

## Coin Earn Formula

| Option | Description | Selected |
|--------|-------------|----------|
| score ÷ divisor | `Math.floor(score / 100)`, divisor in env var | ✓ |
| Fixed per session | Same amount regardless of score | |
| Tiered brackets | Score ranges map to fixed amounts | |

**User's choice:** score ÷ divisor  
**Notes:** Divisor = 100, stored as `COIN_SCORE_DIVISOR` env var for tuning.

---

## Per-Session Cap

| Option | Description | Selected |
|--------|-------------|----------|
| 100 coins | Stored as `COIN_SESSION_CAP` env var | ✓ |
| 50 coins | Tighter economy | |
| No cap yet | Defer | |

**User's choice:** 100 coins

---

## Daily Earn Cap

| Option | Description | Selected |
|--------|-------------|----------|
| 500 coins/day | Track via coinLedger SUM for today | |
| No daily cap yet | Defer to Phase 4/5 after real data | ✓ |

**User's choice:** No daily cap in Phase 3

---

## Extensibility (no-code-change additions)

**User selected all options:**
- Adding the game itself (Convex record)
- Coin earn tuning (env vars)
- Allowed origins (env var)
- Game category/tags (gameCatalog fields, real filter data)

---

## Schema Split

| Option | Description | Selected |
|--------|-------------|----------|
| Add `gameCatalog` table | Separate catalog from session log `games` table | ✓ |
| Reuse `games` table dual-purpose | Add catalog fields with flag for catalog records | |

**User's choice:** Add gameCatalog table  
**Notes:** Clean separation — `games` = session history, `gameCatalog` = game registry.

---

## Post-Game Reward Screen

| Option | Description | Selected |
|--------|-------------|----------|
| Full-screen overlay | Coins earned + total, Back to Home button, player controls timing | ✓ |
| Toast + auto-navigate | Toast shows coins, auto-redirects in 2–3s | |
| Dedicated /results route | Shareable URL, more work | |

**User's choice:** Full-screen overlay

---

## Claude's Discretion

- Pause button position, opacity, and icon on mobile
- Reward screen visual design and animation
- ESC overlay animation (fade/blur)
- `/play/[slug]` loading state
- Presence reset to "online" on lobby return

## Deferred Ideas

- Functional filter chips wired to `isMultiplayer` (left to planner discretion)
- Daily earn cap (Phase 4/5)
- Multiplayer game variants (Phase 4+)
- Admin UI for game catalog (PLAT-V2-01)
- Shareable results URL (Phase 4)
- Real settings in ESC overlay (Phase 4+)
