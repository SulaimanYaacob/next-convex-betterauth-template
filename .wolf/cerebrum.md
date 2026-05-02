# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-04-30

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->
- User wants Gami multiplayer to use Convex for durable app data, but not for high-frequency game movement; prefer Cloudflare Durable Objects/WebSockets for live gameplay.
- User wants Signal Clash to feel like multiplayer Pixel Rush: movement/contact collection first, no click-to-claim, no solo match starts, and compact in-game UI that stays out of the arena.
- User wants gameplay skills to live inside the existing Store/Profile flow, use one primary equipped slot, be cooldown-based, and never change hitboxes or core fairness.
- User does not want invisible/cloak-style skills for now; skill VFX should appear only while a skill is actively triggered, not as passive always-on decoration.

## Key Learnings

- **Project:** convex-template
- **Description:** [![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?style=flat&logo=next.js)](https://nextjs.org/)
- Gami shared UI organization now uses `src/components/cosmetics/*` for store/profile cosmetic pieces, `src/components/games/*` for game surface/HUD/start overlays, and `src/lib/game-messages.ts` for platform game lifecycle events.
- Shared Convex app-user helpers live in `convex/authUsers.ts`; store/profile/games/duelDash should reuse them instead of duplicating Better Auth lookup and coin/equipment reads.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->
- [2026-05-02] Do not rely only on Tailwind arbitrary grid sizing for critical iframe game boards; verify rendered dimensions in Playwright and use explicit styles for critical board geometry if needed.
- [2026-05-02] `pnpm dev:frontend -- --port <port>` passes `--` through to Next in this shell; use `pnpm exec next dev -p <port>` when starting a specific frontend port.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
- [2026-05-02] Realtime game architecture: keep Convex for auth, users, cosmetics, coins, catalog, leaderboards, and final match results; use Cloudflare Durable Objects/WebSockets for high-frequency live multiplayer movement because Convex subscriptions/mutations are not ideal for cursor/player movement.
- [2026-05-02] Phase 4 prep refactor direction: preserve behavior while extracting reusable cosmetics UI, game shell primitives, and shared Convex auth/user helpers before adding more multiplayer/payment features.
- [2026-05-02] Signal Clash v1 skill/realtime split: Convex issues short-lived signed room tickets and stores ownership/equipped loadout; Cloudflare Durable Object owns live movement, countdown, signals, hazards, recovery, and match state. Local dev keeps a BroadcastChannel fallback for same-browser smoke tests.
