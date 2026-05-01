# Phase 3: Game Shell + Earn - Context

**Gathered:** 2026-05-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Players can launch any game into a fullscreen iframe at `/play/[slug]`, pause via ESC overlay, earn coins when the session ends (score-based, server-derived), and see a reward screen. Game catalog data lives in a new `gameCatalog` Convex table — adding a new game requires only seeding a record, no code changes or redeploys.

No cosmetics, no store, no profile. Phase 4 handles those.

</domain>

<decisions>
## Implementation Decisions

### Game Routing
- **D-01:** Game launches on a dedicated full-page route: `/play/[slug]`. Fullscreen iframe fills the viewport. Browser back returns to home. Slug is the canonical game identifier.
- **D-02:** GameCards wire to real Convex `gameCatalog` data in Phase 3 — no more hardcoded arrays. Home page reads game catalog from Convex and renders real cards.
- **D-03:** Game's iframe `src` URL comes from `gameCatalog.iframeUrl` — stored in Convex, not in code. Adding a new game = seed a record. No code deploy needed.

### Schema
- **D-04:** Add `gameCatalog` table to schema (separate from session-log `games` table):
  - `slug: string` (indexed) — URL identifier and `gameId` foreign key in session log
  - `name: string`
  - `iframeUrl: string`
  - `isMultiplayer: boolean` — determines which home section the card appears in
  - `thumbnailUrl: optional string` — game card image
  - `genre: string`
- **D-05:** Existing `games` session-log table stays unchanged. `gameId` field (string) references `gameCatalog.slug`.
- **D-06:** Phase 3 seeds two records: Pixel Rush (solo) and Mind Maze (solo). MP variants deferred until real multiplayer exists.

### ESC Overlay
- **D-07:** Full-screen semi-transparent dark overlay. Game pauses visually behind it. Three actions: Resume, Settings, Back to Lobby.
- **D-08:** Settings = placeholder only in Phase 3 (button exists, shows "coming soon" state or is visually disabled). No real settings scope for Phase 3.
- **D-09:** "Back to Lobby" triggers the GAME_OVER flow — synthetic session end, coins credited if earned, reward screen shown before navigating home. Consistent with postMessage flow; players don't lose progress if they pause and quit.
- **D-10:** Mobile pause: floating semi-transparent pause icon overlaid in a corner of the game viewport (outside the iframe, `position: absolute`). Tap triggers the ESC overlay. Satisfies GAME-04.

### postMessage Contract
- **D-11:** Platform handles three message types from game:
  - `GAME_OVER` (required): `{ type: 'GAME_OVER', score: number, gameId: string }` — triggers coin earn + reward screen
  - `GAME_STARTED`: `{ type: 'GAME_STARTED', gameId: string }` — platform creates session record + sets presence to `"in-game"`
  - `SCORE_UPDATE`: `{ type: 'SCORE_UPDATE', score: number }` — stored on session record; no immediate coin action
- **D-12:** Platform sends one message to game on iframe load:
  - `SESSION_INIT`: `{ type: 'SESSION_INIT', userId: string, sessionId: string }` — lets game know who is playing and reference the session
- **D-13:** Origin validation via `NEXT_PUBLIC_ALLOWED_GAME_ORIGINS` env var (comma-separated). Platform ignores postMessages from unlisted origins. Adding a game on a new domain = add its origin to env var, no code change.

### Coin Earn Formula (resolves STATE.md pending decision)
- **D-14:** Formula: `coins = Math.floor(score / 100)` — server-derived, never client-supplied.
- **D-15:** Score divisor (100) stored in env var `COIN_SCORE_DIVISOR` — tunable without redeploying code.
- **D-16:** Per-session cap: 100 coins. Stored in env var `COIN_SESSION_CAP`.
- **D-17:** No daily earn cap in Phase 3. Defer until Phase 4/5 when real economy data exists. Per-session cap provides abuse protection.

### Post-Game Reward Screen
- **D-18:** Full-screen overlay after GAME_OVER: shows coins earned this session + updated total balance. "Back to Home" button — player controls when they leave (no auto-redirect). Overlay replaces/fades the game iframe.

### Maintainability / Extensibility
- **D-19:** Adding a new game requires ONLY: seed a `gameCatalog` record (slug, name, iframeUrl, isMultiplayer, thumbnailUrl, genre) + add its origin to `ALLOWED_GAME_ORIGINS`. Zero code changes, zero redeploy.
- **D-20:** Coin economy tuning (divisor, session cap) via env vars — no code change needed.

### Claude's Discretion
- Exact pause button position and icon on mobile (corner, opacity, size)
- Reward screen visual design (animation, layout of coins earned vs total)
- ESC overlay animation (fade, scale, blur on game behind it)
- `/play/[slug]` loading state while iframe loads (spinner, skeleton)
- Presence status reset to `"online"` when player returns to lobby after game

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema
- `convex/schema.ts` — Current schema; Phase 3 adds `gameCatalog` table. `games` session-log table stays unchanged.
- `convex/_generated/ai/guidelines.md` — MUST read before writing any Convex functions
- `CLAUDE.md` — Convex patterns, stack constraints

### Design Direction
- `.planning/PROJECT.md` — V2 Refined design, color tokens, mobile-first patterns
- `.planning/REQUIREMENTS.md` — GAME-01..04, ECON-02, ECON-03 acceptance criteria

### Existing Components (reuse these)
- `src/components/game-card.tsx` — Existing card component; Phase 3 adds click action + real data props
- `src/components/ui/dialog.tsx` — Available for ESC overlay implementation
- `src/components/coin-balance.tsx` — Existing real-time coin balance (reuse in reward screen)
- `src/components/heartbeat-provider.tsx` — Existing heartbeat; presence status update to `"in-game"` wires here or in game shell

### Auth & Convex Patterns
- `convex/auth.ts` — `getCurrentUser` query, `betterAuthComponent.getAuthUser(ctx)` for server-derived identity
- `src/lib/auth-client.ts` — `authClient.useSession()` for client-side session/guest check
- React Compiler active — no `useMemo`/`useCallback`/`React.memo`

### Routing
- `src/proxy.ts` — Add `/play/:path*` to protected routes (or allow guests to play — needs decision at planning time)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `GameCard` — exists with `name` + `genre` props; Phase 3 adds `slug` prop + click navigation
- `CoinBalance` — real-time Convex subscription; reuse in reward screen for updated total
- `Dialog` — available for ESC overlay; already used in the UI system
- `HeartbeatProvider` — existing presence mechanism; extend to set `"in-game"` status on game start

### Established Patterns
- Convex `undefined` = loading → show skeleton
- `internalMutation` for all coin-affecting operations (locked architecture constraint)
- Server-derived identity: use `betterAuthComponent.getAuthUser(ctx)` in mutations — never trust client-supplied userId
- Route groups: new `/play/[slug]` goes in root (not `(auth)` or `(unauth)`) unless game access requires auth
- `presenceMutation` pattern already exists for status updates

### Integration Points
- `src/app/page.tsx` — Home page GameCard loops need to switch from hardcoded arrays to `useQuery(api.gameCatalog.list)`
- `convex/schema.ts` — Add `gameCatalog` table
- `convex/presence.ts` — Extend with `"in-game"` status update triggered by GAME_STARTED message
- `convex/coinLedger.ts` — New `awardSessionCoins` internalMutation implementing D-14..D-16 formula
- `src/proxy.ts` — Evaluate whether `/play/:path*` needs auth protection

</code_context>

<specifics>
## Specific Ideas

- postMessage contract is bidirectional but asymmetric: game → platform (3 events), platform → game (1 event on load)
- `SESSION_INIT` sent after iframe `onLoad` event fires — not before, to ensure game is ready to receive
- Score divisor and session cap are env vars so product team can tune economy without engineering involvement
- `gameCatalog` seeding: Phase 3 ships two records via a Convex seed script or migration — no UI for game management yet (that's PLAT-V2-01)

</specifics>

<deferred>
## Deferred Ideas

- Functional search + filter chips (wiring to real game data) — Phase 3 can wire filter chips to `isMultiplayer` field since real data exists now; discussed but not confirmed — leave to planner's discretion
- Daily earn cap — defer to Phase 4/5 after real economy data
- Multiplayer game variants (Pixel Rush MP, Mind Maze Co-op) — seeded as solo only in Phase 3; MP shell wiring deferred
- Admin UI for game catalog management — PLAT-V2-01
- `/play/[slug]/results` shareable results URL — defer to Phase 4
- Settings in ESC overlay (audio, keybinds) — placeholder in Phase 3, real settings in Phase 4+

</deferred>

---

*Phase: 03-game-shell-earn*
*Context gathered: 2026-05-01*
