# Gami

## What This Is

Gami is a browser-based gaming platform that hosts solo and multiplayer mini-games. Players earn and spend virtual coins (⟟) on cosmetics — cursor skins, cursor trails, and UI themes — that apply globally across the entire platform and are visible to other players in multiplayer sessions. The platform is the product; individual games plug into it.

## Core Value

Players want to show off their cosmetics while playing with others — the social display of earned/bought identity is why they stay.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Home page: spotlight layout, solo section + multiplayer section (V2 Refined direction)
- [ ] Auth: sign up, sign in, session persistence (Better Auth already wired)
- [ ] In-game shell: fullscreen canvas, ESC/pause overlay (reusable across all games)
- [ ] Profile: avatar, username, coin balance, equip slots (cursor, trail, theme)
- [ ] Cosmetics system: equip cosmetics that apply globally across the platform
- [ ] Store: browse and purchase cosmetics with coins
- [ ] Virtual currency: earn coins in-game, buy coins with real money
- [ ] Multiplayer presence: online/in-game/idle status shown in MP section
- [ ] Game integration: platform API/shell that games embed into (not building game logic)

### Out of Scope

- Game logic for Pixel Rush or Mind Maze — platform shell only; games are separate
- Native mobile app — web responsive only
- User-generated cosmetics — store only sells curated items
- Real-time chat — presence indicators are sufficient for v1 social layer
- Leaderboards / stats — deferred, not core to cosmetics loop

## Context

**Existing codebase:** Next.js 16.2.4 (App Router, Turbopack) + Convex 1.36 real-time backend + Better Auth 1.6. Auth is fully configured (email/password, OAuth, 2FA, magic links, email verification). The existing "dashboard" and "settings" pages are template scaffolding — will be replaced/repurposed.

**Design direction:** V2 Refined chosen from wireframes (Gami Wireframes.html). Key characteristics:
- Home: spotlight rows — solo section neutral (#f8f6f2), MP section soft blue tint (#f1f5fb)
- Logo: geometric overlapping-squares wordmark + "gami" in Sora font
- Navigation: global search bar in nav, filter chips below, profile avatar top-right
- In-game: fullscreen canvas with zero chrome, ESC opens pause menu overlay (reusable component)
- Profile: one-screen — identity, equip slots (3 cosmetic types), owned cosmetics grid
- Mobile: bottom nav (Home + Store), compact versions of all screens

**Wireframe artifacts:** `Gami Wireframes.html` + `design-canvas.jsx` already in repo root.

## Constraints

- **Tech stack**: Next.js + Convex + TypeScript — no deviation; backend is Convex functions/queries/mutations only
- **Auth**: Better Auth is locked in — extend, don't replace
- **Games**: Platform must be game-agnostic; actual game logic lives outside this repo
- **Payments**: Real-money coin purchases require Stripe integration (or similar)
- **Performance**: React Compiler active — no manual useMemo/useCallback/React.memo

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Platform-only (no game logic) | Games are separate concerns; platform is the distribution layer | — Pending |
| V2 Refined layout | Chosen from 3 wireframe directions; spotlight rows + blue MP tint | — Pending |
| Cosmetics apply globally | Makes cosmetics valuable — you see your own trail everywhere, others see it in MP | — Pending |
| Coins = buy + earn | Earn hooks engagement; buy drives revenue | — Pending |
| Convex real-time for presence | Already in stack; real-time subscriptions are native | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-25 after initialization*
