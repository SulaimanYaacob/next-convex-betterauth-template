# Phase 4: Cosmetics + Store + Profile - Context

**Gathered:** 2026-05-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 4 delivers the full earn-spend-equip identity loop: players browse a small curated cosmetics store, buy cosmetics with earned coins, equip cosmetics from store/profile, edit username, and see equipped identity applied globally across the platform and inside supported games.

This phase also reconciles recent direct implementation work already present in the repo: store/profile pages, seeded cosmetics, player avatar cosmetics, Pixel Rush and Mind Maze framework game routes, and the Signal Clash prototype.

</domain>

<decisions>
## Implementation Decisions

### Product Direction
- **D-01:** Gami should feel minimal, fast, and enjoyable rather than dashboard-heavy or merchandised.
- **D-02:** Store/profile should feel like focused game menus: compact catalog, strong preview, clear owned/equipped states, no clutter.
- **D-03:** The grind should be light: common cosmetics reachable after a few normal sessions; rare cosmetics after repeated play, without timers, loot boxes, stamina, randomized purchases, or pressure mechanics.

### Cosmetics Scope
- **D-04:** Existing cosmetic slots remain in scope: `cursor_skin`, `cursor_trail`, and `ui_theme`.
- **D-05:** Add gameplay avatar identity slots inside the same store/profile flow: `player_shape`, `player_color`, and `player_effect`.
- **D-06:** Player avatar cosmetics are visual only. They may change shape silhouette, palette, glow, trail, or particle effect, but never hitbox size, speed, score, collision, or competitive rules.
- **D-07:** Mind Maze does not need avatar cosmetics because it has no player token.
- **D-08:** Pixel Rush and Signal Clash should render equipped player avatar cosmetics.

### Store and Profile
- **D-09:** Use the existing Convex-backed buy/equip flow; do not create a separate store for avatar cosmetics.
- **D-10:** Confirm-before-buy is required, but browsing and previewing should stay fast.
- **D-11:** Profile is a one-screen identity hub: username, coin balance, equipped slots, owned grid, and immediate global cosmetic application.
- **D-12:** Store remains browsable even when purchase/equip requires auth.

### Game Integration
- **D-13:** Games must only report lifecycle/score events to the platform; the platform owns the single post-game reward popup.
- **D-14:** Pixel Rush and Mind Maze should live as Next.js `/games/*` routes, not static HTML files.
- **D-15:** Mind Maze must keep input locked until sequence playback finishes.
- **D-16:** Mind Maze board geometry must be explicitly verified in desktop and mobile viewports; critical game board layout may use explicit inline sizing if Tailwind arbitrary sizing collapses in iframe/dev CSS.

### Multiplayer Realtime
- **D-17:** Convex is not the transport for high-frequency game movement. Use Convex for durable data: auth, users, cosmetics, coins, sessions, catalog, presence metadata, and final match results.
- **D-18:** Use Cloudflare Durable Objects/WebSockets for live multiplayer movement in Signal Clash. This is the preferred free-tier path.
- **D-19:** Signal Clash should follow Pixel Rush’s game-surface style: full-screen arena, compact HUD, clear start state, pause support, and no duplicate end popup.
- **D-20:** Signal Clash should show realtime player movement, avatar cosmetics, hazards, stun/immobilized feedback, score updates, and round end through the realtime room server.

### the agent's Discretion
- Choose exact cosmetic names, prices, and preview styling as long as they preserve the minimal, curated, lightly grindy direction.
- Choose the exact Durable Object message schema during planning, but keep it small and game-specific.
- Keep implementation incremental: fix broken solo game UX before moving Signal Clash to the new realtime backend.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project and Requirements
- `.planning/PROJECT.md` - Defines Gami’s core value: social display of cosmetics while playing.
- `.planning/REQUIREMENTS.md` - Defines Phase 4 requirements for cosmetics, store, and profile.
- `.planning/ROADMAP.md` - Defines Phase 4 boundary and dependencies.
- `.planning/STATE.md` - Current workflow position.

### Prior Phase Context
- `.planning/phases/03-game-shell-earn/03-CONTEXT.md` - Defines game shell and reward popup ownership.
- `.planning/phases/03-game-shell-earn/03-UAT.md` - Existing game shell UAT expectations.
- `.planning/phases/04-cosmetics-store-profile/04-UAT.md` - Partial direct implementation test notes.

### Platform Guidance
- `AGENTS.md` - Codex project init and required session rules.
- `convex/_generated/ai/guidelines.md` - Required before editing Convex code.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/cosmetics.ts` - Cosmetic metadata, slot labels, rarity classes, and player appearance helpers.
- `src/components/cosmetic-preview.tsx` - Store/profile preview component for cosmetic types.
- `src/components/cosmetics-applicator.tsx` - Root-level global cosmetic application.
- `src/lib/player-avatar.ts` - Canvas/player avatar rendering helpers for game routes.
- `src/app/store/page.tsx` and `src/app/profile/page.tsx` - Existing store/profile surfaces to refine rather than replace.

### Established Patterns
- Game routes live under `src/app/games/*` and are embedded by `/play/[slug]`.
- Game lifecycle uses `postMessage` events: `GAME_STARTED`, `SCORE_UPDATE`, and `GAME_OVER`.
- Convex query UIs must handle loading, unauthenticated, empty, owned, and equipped states.
- Store purchases use coin ledger debits and owned item rows; duplicate purchases should return owned/no-op rather than double charge.

### Integration Points
- `convex/schema.ts`, `convex/store.ts`, and `convex/gameCatalog.ts` define the durable backend surface.
- `src/app/layout.tsx` mounts global cosmetic application.
- `src/app/games/pixel-rush/page.tsx` consumes equipped player cosmetics.
- `src/app/games/duel-dash/page.tsx` is the current Signal Clash prototype and should be migrated away from Convex movement writes.

</code_context>

<specifics>
## Specific Ideas

- Minimal UX means fewer surfaces and clearer hierarchy, not empty or unfinished screens.
- Store/profile should prioritize readability, fast actions, and visible progress.
- Avatar cosmetic seed set starts small: orb, diamond, rounded-square; mint, ember, violet; pulse ring, soft trail, spark pop.
- Signal Clash should be creative and online, not local multiplayer.
- Multiplayer identity should be shown through player tokens/presence/profile surfaces; full remote cursor streaming is not the right v1 goal.

</specifics>

<deferred>
## Deferred Ideas

- Stripe coin purchases remain Phase 5.
- Full friends/social graph remains v2.
- Remote cursor streaming across the whole platform is deferred; use game-specific realtime player movement for Signal Clash.
- Admin catalog management is v2.

</deferred>

---

*Phase: 4-Cosmetics + Store + Profile*
*Context gathered: 2026-05-02*
