# Phase 3: Game Shell + Earn - Research

**Researched:** 2026-05-01
**Domain:** Convex schema extension, iframe postMessage, Next.js App Router fullscreen route, server-derived coin economy
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Game launches on a dedicated full-page route: `/play/[slug]`. Fullscreen iframe fills the viewport. Browser back returns to home. Slug is the canonical game identifier.
- **D-02:** GameCards wire to real Convex `gameCatalog` data in Phase 3 — no more hardcoded arrays.
- **D-03:** Game's iframe `src` URL comes from `gameCatalog.iframeUrl` — stored in Convex, not in code.
- **D-04:** Add `gameCatalog` table: `slug (indexed)`, `name`, `iframeUrl`, `isMultiplayer`, `thumbnailUrl (optional)`, `genre`.
- **D-05:** Existing `games` session-log table stays unchanged. `gameId` references `gameCatalog.slug`.
- **D-06:** Phase 3 seeds two records: Pixel Rush (solo) and Mind Maze (solo).
- **D-07:** ESC overlay: full-screen semi-transparent dark overlay. Three actions: Resume, Settings, Back to Lobby.
- **D-08:** Settings = placeholder only (button exists, disabled in Phase 3).
- **D-09:** "Back to Lobby" triggers GAME_OVER flow — synthetic session end, coins credited, reward screen before navigating home.
- **D-10:** Mobile pause: floating pause icon in corner outside iframe. Tap triggers ESC overlay.
- **D-11:** Platform handles: `GAME_OVER {score, gameId}`, `GAME_STARTED {gameId}`, `SCORE_UPDATE {score}` from game.
- **D-12:** Platform sends `SESSION_INIT {userId, sessionId}` to game on iframe `onLoad`.
- **D-13:** Origin validation via `NEXT_PUBLIC_ALLOWED_GAME_ORIGINS` env var (comma-separated allowlist).
- **D-14:** Coin formula: `Math.floor(score / COIN_SCORE_DIVISOR)` — server-derived, never client-supplied.
- **D-15:** Score divisor stored in env var `COIN_SCORE_DIVISOR`.
- **D-16:** Per-session cap: `COIN_SESSION_CAP` env var.
- **D-17:** No daily earn cap in Phase 3.
- **D-18:** Full-screen reward overlay after GAME_OVER: coins earned + updated total balance. No auto-redirect.
- **D-19:** Adding a new game requires ONLY seeding a `gameCatalog` record + adding its origin to env var.
- **D-20:** Coin economy tuning via env vars — no code change needed.

### Claude's Discretion

- Exact pause button position and icon on mobile
- Reward screen visual design (animation, layout)
- ESC overlay animation (fade, scale, blur)
- `/play/[slug]` loading state while iframe loads
- Presence status reset to `"online"` when player returns to lobby

### Deferred Ideas (OUT OF SCOPE)

- Functional search + filter chip wiring to real game data
- Daily earn cap
- Multiplayer game variants
- Admin UI for game catalog management
- `/play/[slug]/results` shareable URL
- Settings in ESC overlay (real implementation)
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| GAME-01 | Game loads in fullscreen iframe with `sandbox="allow-scripts allow-same-origin"` | §Standard Stack: iframe sandbox pattern; §Architecture Patterns: GameIframe spec |
| GAME-02 | ESC/pause overlay with Resume, Settings, Back to Lobby (reusable) | §Architecture Patterns: EscOverlay component; §Code Examples: overlay state machine |
| GAME-03 | Platform validates origin, derives award server-side via internalMutation; client never supplies coin amount | §Architecture Patterns: postMessage + coin award flow; §Don't Hand-Roll: server-derived identity |
| GAME-04 | Mobile layout with tap-friendly pause button; canvas fills viewport | §UI-SPEC confirmed: FloatingPauseButton 44px circle, `md:hidden`, outside iframe |
| ECON-02 | Coins earned by completing sessions; award server-derived; per-session cap | §Standard Stack: coinLedger internalMutation; §Code Examples: awardSessionCoins pattern |
| ECON-03 | Post-game reward screen shows coins earned and updated balance | §Architecture Patterns: RewardScreen component; reuses CoinBalance subscription |
</phase_requirements>

---

## Summary

Phase 3 adds a fullscreen game shell to the Gami platform, allowing players to launch catalog games at `/play/[slug]`, interact via a bidirectional postMessage contract, and earn coins via a server-derived formula when sessions end. The implementation spans three tiers: a new Convex `gameCatalog` table (backend), a `convex/games.ts` module for session recording + coin award (backend), and a `src/app/play/[slug]/` fullscreen route with four new UI components (frontend).

The established patterns from Phases 1-2 are mature and directly reusable: `betterAuthComponent.getAuthUser(ctx)` for server identity, `internalMutation` for all coin operations, the `updatePresence` mutation already accepting `"in-game"` status, and the `CoinBalance` component already subscribing to the ledger in real time. The only net-new architectural concern is the `window.postMessage` security boundary — origin validation must happen before any message is acted on.

Adding `gameCatalog` to the schema is a pure additive change (new table, no modifications to existing tables) — Convex handles this transparently; no migration tooling is needed. Seeding the two initial game records is done via an `internalMutation` callable via `npx convex run`.

**Primary recommendation:** Structure Phase 3 into four waves: (1) schema + Convex backend (`gameCatalog` table, `gameCatalog.list` query, `games.startSession`/`updateScore`/`endSession` mutations, `awardSessionCoins` internalMutation), (2) home page wiring (GameCard gets `slug` + `thumbnailUrl` props, page.tsx switches from hardcoded arrays to `useQuery`), (3) `/play/[slug]` route + GameIframe + postMessage handler + ESC overlay + FloatingPauseButton, (4) RewardScreen + presence integration.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Game catalog data | Database / Convex | — | Rows are platform config; no business logic needed beyond CRUD |
| Game session log (start, score, end) | Database / Convex | — | Append-only events; must be server-authoritative |
| Coin award formula + session cap | API / Convex internalMutation | — | Must be server-derived; client never supplies coin values (GAME-03, locked) |
| Origin validation | Frontend Client | — | `window.message` event fires in browser; validation happens before any mutation is called |
| postMessage routing (GAME_OVER etc.) | Frontend Client | — | Browser event; decoded in React component before dispatching to Convex |
| `/play/[slug]` fullscreen route | Frontend Client | — | Static page shell; no SSR data needed beyond gameCatalog query |
| ESC overlay state | Frontend Client | — | Pure UI state (`escOpen` boolean); no server involvement |
| Reward screen | Frontend Client | Convex query | UI driven by local state (`rewardData`); CoinBalance is a live Convex subscription |
| Presence "in-game" status | API / Convex mutation | Frontend Client | Server writes presence; client triggers on `GAME_STARTED` message |
| gameCatalog seeding | Database / Convex | — | One-time `internalMutation` run via CLI |

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | 1.36.1 [VERIFIED: package.json] | Database, real-time queries, mutations | Locked project stack |
| next | 16.2.4 [VERIFIED: package.json] | App Router, `/play/[slug]` dynamic route | Locked project stack |
| react | 19.2.5 [VERIFIED: package.json] | UI components | Locked project stack |
| @convex-dev/better-auth | 0.12.0 [VERIFIED: package.json] | Server-side identity via `betterAuthComponent.getAuthUser(ctx)` | Locked auth pattern |
| lucide-react | 1.11.0 [VERIFIED: package.json] | `Pause`, `Loader2` icons | Already used in project |
| sonner | 2.0.7 [VERIFIED: package.json] | `toast.error` on coin mutation failure | Locked feedback pattern from CLAUDE.md |
| tw-animate-css | 1.4.0 [VERIFIED: package.json] | `animate-in fade-in zoom-in-95` overlay animations | Already imported in globals.css |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| convex-helpers | 0.1.115 [VERIFIED: package.json] | `typedV` (used in util.ts), helper patterns | Already in use; extend only if needed |

### No New Packages Needed

All Phase 3 capabilities are achievable with the current dependency set. [VERIFIED: package.json inventory]

**Installation:** No new packages to install for Phase 3.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (GameShell)
  │
  ├── [mount] ──── Convex query: gameCatalog.getBySlug(slug)
  │                    │
  │                    ▼
  │              gameCatalog record → { iframeUrl, name, ... }
  │
  ├── [iframe onLoad] ──── postMessage(SESSION_INIT → game)
  │                            targetOrigin = parsed from iframeUrl
  │
  ├── [window.message] ──── origin check (NEXT_PUBLIC_ALLOWED_GAME_ORIGINS Set)
  │     │                       │
  │     │           invalid → silent ignore
  │     │           valid ──────┤
  │     │                       ▼
  │     │           GAME_STARTED → useMutation(presence.updatePresence, "in-game")
  │     │                          useMutation(games.startSession, { gameId: slug })
  │     │
  │     │           SCORE_UPDATE → local state: setLastScore(score)
  │     │                          useMutation(games.updateScore, { sessionId, score })
  │     │
  │     └──────     GAME_OVER ──── useMutation(games.endSession, { sessionId, score })
  │                                    │
  │                                    ▼ (Convex internalMutation)
  │                               awardSessionCoins(userId, score, sessionId)
  │                                    │
  │                                    ├── coins = min(floor(score / COIN_SCORE_DIVISOR), COIN_SESSION_CAP)
  │                                    ├── ctx.db.insert("coinLedger", { amount: coins, reason: "game_earn" })
  │                                    └── ctx.db.patch(games row, { endedAt, coinsAwarded })
  │
  └── [GAME_OVER callback] ──── setRewardData({ earned: coins })
                                 setRewardOpen(true)
                                 RewardScreen renders over game
                                     │
                                     └── CoinBalance (live Convex subscription)
                                             │
                                     [Back to Home] → presence.updatePresence("online")
                                                       router.push("/")
```

### Recommended Project Structure

```
src/app/play/[slug]/
├── page.tsx              # GameShell — fullscreen container, postMessage handler, ESC key listener
src/components/
├── game-iframe.tsx       # <iframe> with sandbox, onLoad handler, loading skeleton
├── esc-overlay.tsx       # Pause overlay: Resume / Settings / Back to Lobby
├── floating-pause-button.tsx  # Mobile-only 44px circle (md:hidden)
├── reward-screen.tsx     # Post-game overlay: coins earned + CoinBalance + Back to Home
convex/
├── schema.ts             # ADD gameCatalog table
├── gameCatalog.ts        # list query, getBySlug query, seed internalMutation
├── games.ts              # startSession, updateScore, endSession mutations + awardSessionCoins internalMutation
```

### Pattern 1: gameCatalog Table Definition

**What:** New table, additive-only — no migration tooling needed. Convex handles new tables transparently on next `convex dev` / `convex deploy`.

**When to use:** Any time a new unrelated table is added with no existing row transformations needed.

```typescript
// Source: convex/schema.ts — additive pattern matching existing tables
gameCatalog: defineTable({
  slug: v.string(),          // URL identifier; matches gameId in games session log
  name: v.string(),
  iframeUrl: v.string(),
  isMultiplayer: v.boolean(),
  thumbnailUrl: v.optional(v.string()),
  genre: v.string(),
})
  .index("by_slug", ["slug"])
  .index("by_isMultiplayer", ["isMultiplayer"]),
```

**Indexes rationale:**
- `by_slug` — used by `/play/[slug]` to look up a single record. [VERIFIED: CONTEXT.md D-04]
- `by_isMultiplayer` — used by home page to split solo / MP sections. Avoids full-table scan. [ASSUMED — may be `filter()` on a small table instead; at 2–10 catalog records this is not a scaling concern]

### Pattern 2: awardSessionCoins internalMutation

**What:** Server-derives coin amount from score; writes to coinLedger; patches games row. Never callable from client. Identity from `betterAuthComponent.getAuthUser(ctx)`.

**When to use:** Any time the game session ends (GAME_OVER postMessage or Back to Lobby synthetic event).

```typescript
// Source: convex/coinLedger.ts + convex/auth.ts patterns (existing)
// convex/games.ts

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { requireEnv } from "./util";
import { Id } from "./_generated/dataModel";

export const awardSessionCoins = internalMutation({
  args: {
    userId: v.id("users"),
    gameSessionId: v.id("games"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const divisor = parseInt(requireEnv("COIN_SCORE_DIVISOR"), 10);
    const cap = parseInt(requireEnv("COIN_SESSION_CAP"), 10);
    const coins = Math.min(Math.floor(args.score / divisor), cap);

    if (coins > 0) {
      await ctx.db.insert("coinLedger", {
        userId: args.userId,
        amount: coins,
        reason: "game_earn",
        sessionId: args.gameSessionId,
      });
    }

    await ctx.db.patch(args.gameSessionId, {
      endedAt: Date.now(),
      coinsAwarded: coins,
      sessionCap: cap,
    });

    return coins;
  },
});
```

**Critical:** `awardSessionCoins` is `internalMutation` — it is called by `endSession` (a public mutation) via `ctx.runMutation(internal.games.awardSessionCoins, ...)`. The public `endSession` derives userId from `betterAuthComponent.getAuthUser(ctx)` — never from client args. [VERIFIED: existing coinLedger.ts + auth.ts patterns; CONTEXT.md locked decision]

### Pattern 3: endSession Public Mutation (Calls internalMutation)

```typescript
// convex/games.ts

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
import { internal } from "./_generated/api";

export const endSession = mutation({
  args: {
    gameSessionId: v.id("games"),
    score: v.number(),
  },
  handler: async (ctx, args) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) return null;

    const appUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .first();
    if (!appUser) return null;

    // Verify session belongs to this user before awarding
    const session = await ctx.db.get(args.gameSessionId);
    if (!session || session.userId !== appUser._id) return null;

    const coins: number = await ctx.runMutation(
      internal.games.awardSessionCoins,
      {
        userId: appUser._id,
        gameSessionId: args.gameSessionId,
        score: args.score,
      },
    );

    return coins;
  },
});
```

**Note on ctx.runMutation from same-file cross-call:** Per Convex guidelines, when calling a function in the same file, specify a type annotation on the return value to avoid TypeScript circularity. [VERIFIED: convex/_generated/ai/guidelines.md line ~94]

### Pattern 4: postMessage Origin Validation in React

**What:** Parse `NEXT_PUBLIC_ALLOWED_GAME_ORIGINS` once (stable ref, not per-message), validate before any mutation call.

**When to use:** Single `useEffect` in `GameShell` page component.

```typescript
// Source: CONTEXT.md D-13, UI-SPEC §7 Interaction Contracts
// src/app/play/[slug]/page.tsx

"use client";
import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

// Parse env var once outside component — stable across renders
const ALLOWED_ORIGINS = new Set(
  (process.env.NEXT_PUBLIC_ALLOWED_GAME_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);

// Inside component:
useEffect(() => {
  function handleMessage(event: MessageEvent) {
    if (!ALLOWED_ORIGINS.has(event.origin)) return; // silent ignore

    const data = event.data as { type?: string; score?: number; gameId?: string };
    if (!data?.type) return;

    switch (data.type) {
      case "GAME_STARTED":
        void updatePresence({ status: "in-game" });
        void startSession({ gameId: slug });
        break;
      case "SCORE_UPDATE":
        setLastScore(data.score ?? 0);
        if (sessionIdRef.current) {
          void updateScore({ gameSessionId: sessionIdRef.current, score: data.score ?? 0 });
        }
        break;
      case "GAME_OVER":
        setEscOpen(false);
        void handleGameOver({ score: data.score ?? 0 });
        break;
    }
  }

  window.addEventListener("message", handleMessage);
  return () => window.removeEventListener("message", handleMessage);
}, [slug, updatePresence, startSession, updateScore]);
```

**React Compiler note:** No `useCallback` on handler. Attach directly in `useEffect`. Dependencies: `slug` (from params), plus the stable Convex mutation refs. [VERIFIED: CLAUDE.md "React Compiler: Enabled; do NOT use useMemo or useCallback manually"]

### Pattern 5: SESSION_INIT Dispatch on iframe onLoad

```typescript
// src/components/game-iframe.tsx
const sessionInitSentRef = useRef(false);

function handleLoad() {
  setIframeLoaded(true);
  if (!sessionInitSentRef.current && iframeRef.current?.contentWindow) {
    const targetOrigin = new URL(iframeUrl).origin;
    iframeRef.current.contentWindow.postMessage(
      { type: "SESSION_INIT", userId, sessionId },
      targetOrigin,
    );
    sessionInitSentRef.current = true;
  }
}
```

**Specific targetOrigin:** Never `"*"` — use the parsed origin of `iframeUrl`. [CITED: UI-SPEC §7]

### Pattern 6: Body Scroll Lock on `/play/[slug]`

```typescript
// src/app/play/[slug]/page.tsx — inside component
useEffect(() => {
  const prev = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";
  document.body.style.overflow = "hidden";
  return () => {
    document.documentElement.style.overflow = prev;
    document.body.style.overflow = "";
  };
}, []);
```

Applied on mount, cleaned up on unmount. Prevents page scroll bleed-through when iframe content is taller than viewport on some devices. [CITED: UI-SPEC §6]

### Pattern 7: gameCatalog Seeding via internalMutation + CLI

**What:** Seed initial catalog records via a runnable `internalMutation`. No separate migration framework needed — table is new/empty. [VERIFIED: convex/_generated/ai/guidelines.md — "Small Table Shortcut" applies when table is new and empty]

```typescript
// convex/gameCatalog.ts

export const seed = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("gameCatalog")
      .withIndex("by_slug", (q) => q.eq("slug", "pixel-rush"))
      .first();
    if (existing) return; // idempotent

    await ctx.db.insert("gameCatalog", {
      slug: "pixel-rush",
      name: "Pixel Rush",
      iframeUrl: "https://placeholder.game/pixel-rush",
      isMultiplayer: false,
      genre: "Arcade",
    });

    await ctx.db.insert("gameCatalog", {
      slug: "mind-maze",
      name: "Mind Maze",
      iframeUrl: "https://placeholder.game/mind-maze",
      isMultiplayer: false,
      genre: "Puzzle",
    });
  },
});
```

**Run:** `npx convex run gameCatalog:seed`

The iframeUrl values will need real game URLs before Phase 3 is live. Placeholder URLs cause iframe load errors but do not break schema or coin logic. [ASSUMED — actual game URLs not yet known; planner should create a task noting URLs are placeholder]

### Pattern 8: GameCard Props Extension

**What:** `GameCard` gains `slug` and `thumbnailUrl` props and becomes a `<Link>` wrapper for navigation.

```typescript
// src/components/game-card.tsx
import Link from "next/link";

interface GameCardProps {
  name: string;
  genre: string;
  slug: string;
  thumbnailUrl?: string;
}

export function GameCard({ name, genre, slug, thumbnailUrl }: GameCardProps) {
  return (
    <Link href={`/play/${slug}`} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xl">
      <Card className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 gap-0 py-0">
        <div className="aspect-video bg-muted relative overflow-hidden">
          {thumbnailUrl ? (
            <Image src={thumbnailUrl} alt={name} fill sizes="(max-width:640px) 100vw, (max-width:1024px) 50vw, 25vw" className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-muted" aria-hidden="true" />
          )}
        </div>
        <div className="p-4 space-y-2">
          <p className="text-sm font-semibold text-foreground">{name}</p>
          <Badge variant="outline" className="text-xs">{genre}</Badge>
        </div>
      </Card>
    </Link>
  );
}
```

**`next/image` is required** when `thumbnailUrl` is present. Per CLAUDE.md: "Always use `next/image` with `sizes` and `priority` for above-the-fold content." Game cards may be above the fold — `priority` on first 2-4 cards is appropriate. [VERIFIED: CLAUDE.md]

### Pattern 9: Home Page — Switch to Real gameCatalog Data

```typescript
// src/app/page.tsx — becomes client component ("use client") to call useQuery

"use client";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const allGames = useQuery(api.gameCatalog.list);
  const soloGames = allGames?.filter((g) => !g.isMultiplayer) ?? [];
  const mpGames = allGames?.filter((g) => g.isMultiplayer) ?? [];

  // allGames === undefined → loading (show skeletons per UI-SPEC §12)
  // ...
}
```

**Convex `undefined` = loading** — always handle in rendering. [VERIFIED: CLAUDE.md + existing CoinBalance/PresencePanel pattern]

### Anti-Patterns to Avoid

- **Trusting client-supplied userId in mutations:** Always derive from `betterAuthComponent.getAuthUser(ctx)`. Never accept `userId` as an arg in coin-affecting mutations. [VERIFIED: guidelines.md line ~180, existing coinLedger.ts pattern]
- **Calling `internalMutation` directly from client:** `awardSessionCoins` is internal. Call it from `endSession` (public mutation) via `ctx.runMutation(internal.games.awardSessionCoins, ...)`. [VERIFIED: guidelines.md function registration section]
- **Using `"*"` as postMessage targetOrigin:** Parse the actual origin from `iframeUrl`. Using `"*"` leaks session tokens to any cross-origin frame. [CITED: UI-SPEC §7]
- **Accepting the `score` value from the postMessage payload as the coin amount:** Score is an event input; coin calculation happens server-side. Client sends `{ score }`, server runs the formula. [VERIFIED: CONTEXT.md D-14; REQUIREMENTS.md GAME-03]
- **Using `useMemo` or `useCallback`:** React Compiler is active. Manually wrapping handlers breaks the compiler's optimization model. [VERIFIED: CLAUDE.md]
- **Adding scroll to `/play/[slug]`:** Page must be `overflow-hidden`; any `overflow-y-auto` on parent containers will break fullscreen fill. [CITED: UI-SPEC §6]
- **Querying presence table without `.take(n)`:** Use `.take(50)` — never `.collect()` on unbounded tables. [VERIFIED: guidelines.md query section; existing presence.ts uses `.take(50)`]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Real-time coin balance in reward screen | Manual subscription or refetch | Existing `CoinBalance` component | Already subscribed to `api.coinLedger.getBalance` — reuse as-is |
| Overlay portal management | Custom portal | Radix `Dialog` or React `createPortal` | `dialog.tsx` already in project; handles z-index, focus trap, aria-modal |
| Focus trap in ESC overlay | Manual tab-cycle logic | Radix `Dialog` or `@radix-ui/react-focus-trap` | Radix handles focus trap, aria-modal, escape-key dismiss — project already has Radix installed |
| Coin award logic | Custom formula in client component | Convex `internalMutation` | Economy integrity requires server authority; client formula is exploitable |
| Animation library | Framer Motion / GSAP | `tw-animate-css` classes already in project | `animate-in fade-in zoom-in-95` covers all overlay entry/exit in the spec; no new package needed |
| Session identity lookup | Cache user lookup | Existing `betterAuthComponent.getAuthUser(ctx)` pattern | Established pattern in every Convex file that needs identity |

**Key insight:** The project's existing Convex patterns, CoinBalance component, and Radix UI kit cover every Phase 3 need. No new libraries are required.

---

## Common Pitfalls

### Pitfall 1: sessionId not available when GAME_OVER arrives
**What goes wrong:** The client calls `endSession` with `score` but `startSession` hasn't returned its `_id` yet (async Convex mutation in flight). `sessionIdRef.current` is null, and the session cannot be patched.
**Why it happens:** `useMutation` returns a promise; `startSession` result is async. If the game is very short, GAME_OVER can arrive before the promise resolves.
**How to avoid:** Queue the GAME_OVER event if `sessionIdRef.current` is null — resolve after `startSession` settles. Alternatively, pass `gameId` (slug) to `endSession` and let the server look up the most recent open session for this user + gameId.
**Warning signs:** `endSession` is called with an undefined `gameSessionId`, causing a Convex validation error.

### Pitfall 2: iframeUrl origin parsing for SESSION_INIT targetOrigin
**What goes wrong:** `new URL(iframeUrl).origin` throws if `iframeUrl` is a relative path or malformed URL.
**Why it happens:** Seed data may have placeholder or partial URLs during development.
**How to avoid:** Wrap in try/catch; fall back to `"*"` only in development (`process.env.NODE_ENV === "development"`). In production, throw if origin cannot be parsed.
**Warning signs:** `TypeError: Failed to construct 'URL'` in console when iframe loads.

### Pitfall 3: Body scroll lock leaking across navigations
**What goes wrong:** `document.body.style.overflow = "hidden"` is set in a `useEffect` but the cleanup doesn't run if the user navigates via browser back button on some mobile browsers.
**Why it happens:** Next.js App Router page transitions don't always trigger unmount synchronously on back-nav in certain mobile WebView environments.
**How to avoid:** Save the previous `overflow` value before setting and restore it in the `useEffect` cleanup. This is already in Pattern 6. Also set `overflow` on both `document.documentElement` and `document.body` — some browsers use one, some use the other.
**Warning signs:** Home page is not scrollable after returning from a game.

### Pitfall 4: postMessage from game before iframe is registered
**What goes wrong:** Game sends `GAME_STARTED` before the platform's `window.addEventListener('message', ...)` has been registered in the `useEffect` (React effects run after first paint, not synchronously).
**Why it happens:** The iframe may load and the game may start faster than the React component's effects run, especially in development with pre-cached assets.
**How to avoid:** Send `SESSION_INIT` only after `onLoad` fires (already in Pattern 5). The game should wait for `SESSION_INIT` before sending `GAME_STARTED`. This is the correct contract per D-12 and the UI-SPEC. If games are third-party and cannot be controlled, the platform effect must register before the iframe is rendered — put the `addEventListener` in the same `useEffect` that controls the iframe's `src`.
**Warning signs:** Presence never updates to `"in-game"` even when the game says it started.

### Pitfall 5: `COIN_SCORE_DIVISOR` / `COIN_SESSION_CAP` not set in Convex
**What goes wrong:** `requireEnv("COIN_SCORE_DIVISOR")` throws in the `awardSessionCoins` internalMutation. The entire `endSession` call fails.
**Why it happens:** Convex env vars must be set separately from `.env.local` — they are not automatically inherited. Per CLAUDE.md: "Variables must be set in `.env.local` AND Convex (`pnpm convex env set <VAR> <VAL>`)."
**How to avoid:** Wave 0 / setup task must include: `pnpm convex env set COIN_SCORE_DIVISOR 100` and `pnpm convex env set COIN_SESSION_CAP 100`.
**Warning signs:** Convex function log shows `Missing environment variable 'COIN_SCORE_DIVISOR'` after GAME_OVER.

### Pitfall 6: Home page.tsx is a Server Component by default
**What goes wrong:** Adding `useQuery` to `page.tsx` fails with "You're importing a component that needs `useQuery`. This only works in a Client Component" — because Next.js App Router pages are Server Components by default.
**Why it happens:** `useQuery` (Convex React hook) is a client-side hook.
**How to avoid:** Add `"use client"` directive to `page.tsx` OR extract the data-dependent section into a separate client component (e.g., `GameCatalogGrid`). The former is simpler given the entire page body needs real-time data.
**Warning signs:** Build error: "React Hook 'useQuery' cannot be called in a Server Component."

### Pitfall 7: gameCatalog seed runs multiple times (double-insert)
**What goes wrong:** Running `npx convex run gameCatalog:seed` twice inserts duplicate records.
**Why it happens:** No idempotency guard.
**How to avoid:** Already handled in Pattern 7 — check for existing record by `by_slug` index before inserting. The seed function is idempotent.
**Warning signs:** Home page shows 4 Pixel Rush cards.

---

## Code Examples

### gameCatalog Query Functions

```typescript
// Source: convex/gameCatalog.ts — matches existing query pattern from coinLedger.ts / presence.ts

import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Used by home page to populate GameCard grid
export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("gameCatalog").take(100);
  },
});

// Used by /play/[slug] to validate slug + get iframeUrl
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return ctx.db
      .query("gameCatalog")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .unique();
  },
});
```

### startSession Mutation

```typescript
// convex/games.ts
export const startSession = mutation({
  args: { gameId: v.string() },
  handler: async (ctx, args): Promise<Id<"games"> | null> => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) return null;

    const appUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .first();
    if (!appUser) return null;

    return ctx.db.insert("games", {
      userId: appUser._id,
      gameId: args.gameId,
      startedAt: Date.now(),
    });
  },
});
```

### EscOverlay State Machine (GameShell page)

```typescript
// State in GameShell component
const [escOpen, setEscOpen] = useState(false);
const [rewardOpen, setRewardOpen] = useState(false);
const [rewardCoins, setRewardCoins] = useState(0);
const [lastScore, setLastScore] = useState(0);
const sessionIdRef = useRef<Id<"games"> | null>(null);

// Keyboard ESC handler (in useEffect)
function handleKeyDown(e: KeyboardEvent) {
  if (e.key === "Escape" && !rewardOpen) {
    setEscOpen((prev) => !prev);
  }
}

// Synthetic GAME_OVER (Back to Lobby button)
async function handleGameOver(score: number) {
  setEscOpen(false);
  const sessionId = sessionIdRef.current;
  if (!sessionId) return;
  const earned = await endSession({ gameSessionId: sessionId, score });
  setRewardCoins(earned ?? 0);
  setRewardOpen(true);
}
```

### Presence Reset on Home Navigation

```typescript
// src/components/reward-screen.tsx — Back to Home button handler
const updatePresence = useMutation(api.presence.updatePresence);
const router = useRouter();

function handleBackToHome() {
  void updatePresence({ status: "online" }); // fire-and-forget
  router.push("/");
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Hardcoded `SOLO_GAMES` / `MP_GAMES` arrays in `page.tsx` | `useQuery(api.gameCatalog.list)` — real Convex data | Phase 3 | Adding a game = seed a row, no code deploy |
| No game routing | `/play/[slug]` fullscreen route | Phase 3 | Games are independent URLs; deep-linkable |
| No coin earn | `awardSessionCoins` internalMutation on GAME_OVER | Phase 3 | Economy loop active |

**Deprecated/outdated:**
- Hardcoded `SOLO_GAMES` / `MP_GAMES` constants in `src/app/page.tsx` — replaced by Convex query in Phase 3.

---

## Runtime State Inventory

> Not a rename/refactor phase. Only new tables and routes are being added.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | No existing gameCatalog records — table is new | Seed via `npx convex run gameCatalog:seed` after deploy |
| Live service config | No existing game origins in ALLOWED_GAME_ORIGINS — env var is new | Set `NEXT_PUBLIC_ALLOWED_GAME_ORIGINS` in `.env.local` AND Convex before launch |
| OS-registered state | None | None |
| Secrets/env vars | `COIN_SCORE_DIVISOR`, `COIN_SESSION_CAP` are new Convex env vars | `pnpm convex env set COIN_SCORE_DIVISOR 100` and `pnpm convex env set COIN_SESSION_CAP 100` |
| Build artifacts | None — no rename involved | None |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `gameCatalog` table is small enough (2–10 records) that `filter()` on `isMultiplayer` is acceptable without a dedicated index; planner may add `by_isMultiplayer` index defensively | Architecture Patterns, Pattern 1 | Negligible at Phase 3 scale; add index if home page shows slow loads |
| A2 | Actual iframeUrl values for Pixel Rush and Mind Maze are not yet finalized; seed uses placeholder URLs | Pattern 7 | Iframe shows blank/error during dev; does not break schema or coin logic |
| A3 | `/play/[slug]` is accessible to guests (no auth gate) — CONTEXT.md D-01 says "browser back returns to home" without specifying auth requirement; proxy.ts does not currently protect `/play` | Architecture Patterns, Proxy section | If guests should be blocked, planner must add `/play` to `protectedRoutes` in `src/proxy.ts`; if guests can play, no change needed |
| A4 | `sessionId` in `SESSION_INIT` payload refers to the Convex `games._id` returned by `startSession` — sent to game for reference only, not used for auth or coin award | Pattern 5 | If game uses `sessionId` for its own auth, the value must be stable and known before `onLoad`; requires rethinking timing |

---

## Open Questions

1. **Guest access to `/play/[slug]`**
   - What we know: Proxy currently only protects `/dashboard` and `/settings`. Games are in scope for guests (AUTH-03 says guests can play without registering).
   - What's unclear: Should guests earn coins? If so, `betterAuthComponent.getAuthUser(ctx)` will return a guest user — the coin award will succeed if the guest has an app user row (which they do, per Phase 1 `onCreateUser` hook). If guests should NOT earn coins, `endSession` should check `isAnonymous` before calling `awardSessionCoins`.
   - Recommendation: Allow guests to play (no proxy change). Guests can earn coins — the ledger supports it. Flag for planner to confirm.

2. **iframeUrl placeholder values**
   - What we know: Pixel Rush and Mind Maze are described as external games in REQUIREMENTS.md ("games are external; game logic lives outside this repo").
   - What's unclear: The actual hosted URLs are unknown. Without real URLs, the game shell cannot be fully tested.
   - Recommendation: Seed with `localhost:3001` or a static HTML test page that emits the correct postMessage contract. Document this clearly so future developers know to replace placeholder URLs.

3. **`next/image` domain configuration for thumbnailUrl**
   - What we know: `next/image` requires configured `remotePatterns` in `next.config.ts` for external image URLs.
   - What's unclear: Where thumbnail images will be hosted (Convex file storage, external CDN, etc.).
   - Recommendation: Either host thumbnails in Convex storage (use `ctx.storage.getUrl()`) or configure `remotePatterns` in `next.config.ts`. If thumbnailUrl is null (Phase 3 seed has no thumbnails), this is deferred.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build, Convex CLI | Yes | v22.14.0 [VERIFIED] | — |
| Convex CLI | Schema deploy, seed | Yes | 1.36.1 [VERIFIED] | — |
| pnpm | Package install | Yes [ASSUMED] | — | npm |
| `COIN_SCORE_DIVISOR` Convex env | `awardSessionCoins` | Not yet set [ASSUMED] | — | Must set before testing coin earn |
| `COIN_SESSION_CAP` Convex env | `awardSessionCoins` | Not yet set [ASSUMED] | — | Must set before testing coin earn |
| `NEXT_PUBLIC_ALLOWED_GAME_ORIGINS` | postMessage validation | Not yet set [ASSUMED] | — | All postMessages silently ignored until set |
| Real game iframeUrl | iframe loading | Not yet available [ASSUMED] | — | Placeholder URL; iframe shows blank |

**Missing dependencies with no fallback:**
- None that block code writing. `COIN_SCORE_DIVISOR` and `COIN_SESSION_CAP` block runtime testing of coin earn — must be set via Wave 0 setup task.

**Missing dependencies with fallback:**
- Real game URLs — use localhost test page as placeholder during development.

---

## Project Constraints (from CLAUDE.md)

| Directive | Enforcement |
|-----------|-------------|
| Stack: Next.js 16.2.4, Convex 1.36, Better Auth 1.6, Tailwind v4, TypeScript | All new files must use this stack — no alternative libraries |
| React Compiler active — NO `useMemo`, `useCallback`, `React.memo` | Never wrap event handlers in useCallback; attach directly in useEffect |
| Always use `next/image` with `sizes` and `priority` for above-the-fold | GameCard thumbnailUrl must use `<Image>` not `<img>` |
| Import individual icons only: `import { Pause } from "lucide-react"` | Never import entire lucide-react bundle |
| Security headers (CSP, X-Frame-Options) in `next.config.ts` | Verify CSP allows iframe embedding of game origins; X-Frame-Options applies to the platform page, not the game |
| Always use `toast.success/error` (Sonner) for mutation feedback | Coin award failure → `toast.error(...)` per UI-SPEC §9 |
| Every query must handle `undefined` (loading) and empty array (empty state) | `allGames === undefined` → skeleton cards; `soloGames.length === 0` → empty state copy |
| Environment variables: set in `.env.local` AND Convex | New env vars (`COIN_SCORE_DIVISOR`, `COIN_SESSION_CAP`, `NEXT_PUBLIC_ALLOWED_GAME_ORIGINS`) need both |
| Read `convex/_generated/ai/guidelines.md` before editing backend logic | ALWAYS include arg validators; internalMutation for private functions; no `.collect()` on unbounded |
| `pnpm` is the package manager | Use `pnpm add`, never `npm install` |

---

## Validation Architecture

> `nyquist_validation: false` in `.planning/config.json` — this section is SKIPPED.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | `betterAuthComponent.getAuthUser(ctx)` — server identity, never trust client userId arg |
| V3 Session Management | Yes | Game session `_id` returned by `startSession`; verified to belong to user in `endSession` before awarding |
| V4 Access Control | Yes | `awardSessionCoins` is `internalMutation` — not in public API; client cannot call it directly |
| V5 Input Validation | Yes | Convex arg validators on all functions; origin allowlist validated before any message is processed |
| V6 Cryptography | No | No cryptographic operations in Phase 3 |

### Known Threat Patterns

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Client supplies inflated coin amount | Tampering | Server-only formula: `Math.floor(score / COIN_SCORE_DIVISOR)` in `internalMutation` |
| GAME_OVER from unauthorized iframe (cross-origin) | Spoofing | `NEXT_PUBLIC_ALLOWED_GAME_ORIGINS` allowlist checked before any mutation is called |
| Score replay (send same GAME_OVER twice) | Tampering | Session ownership check in `endSession` + `endedAt` field on games row; second call patches same record (idempotent patch, not double-insert) |
| userId spoofing in endSession args | Tampering | `userId` is never accepted as a function argument — always derived via `betterAuthComponent.getAuthUser(ctx)` |
| Iframe content accessing parent DOM | Elevation of Privilege | `sandbox="allow-scripts allow-same-origin"` — `allow-same-origin` required for postMessage but does NOT grant parent DOM access if iframe is cross-origin |

**On `allow-same-origin` in sandbox:** This attribute only relaxes the default sandbox restriction that treats all iframed content as cross-origin. For games hosted on a different domain than the platform, the game is still cross-origin relative to the platform — `allow-same-origin` enables the game to access its OWN origin's storage, not the platform's. This is the required value per GAME-01. [VERIFIED: REQUIREMENTS.md GAME-01]

---

## Sources

### Primary (HIGH confidence)
- `convex/_generated/ai/guidelines.md` — Convex function registration, internalMutation, arg validators, query guidelines
- `convex/schema.ts` — Existing schema; additive change pattern confirmed
- `convex/coinLedger.ts` — `betterAuthComponent.getAuthUser(ctx)` identity pattern
- `convex/presence.ts` — `updatePresence` mutation already supports `"in-game"` status union
- `convex/auth.ts` — `betterAuthComponent` import pattern
- `src/components/game-card.tsx` — Existing component to extend
- `src/app/page.tsx` — Existing home page to refactor
- `src/proxy.ts` — Current route protection; `/play` not currently protected
- `src/components/heartbeat-provider.tsx` — Existing presence mutation wiring pattern
- `package.json` — All dependency versions verified
- `.planning/phases/03-game-shell-earn/03-CONTEXT.md` — All locked decisions
- `.planning/phases/03-game-shell-earn/03-UI-SPEC.md` — All component specs, layout, animations
- `CLAUDE.md` — Stack constraints, coding conventions

### Secondary (MEDIUM confidence)
- `.agents/skills/convex-migration-helper/references/migration-patterns.md` — "Small Table Shortcut" pattern for seeding; confirmed applicable (new empty table)

### Tertiary (LOW confidence — none)
No unverified WebSearch findings used in this research.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified from package.json
- Architecture: HIGH — patterns derived directly from existing working code (coinLedger.ts, presence.ts, auth.ts)
- Pitfalls: HIGH — pitfalls 1–7 all derived from code inspection of existing patterns and Convex guidelines
- Security: HIGH — ASVS mapping based on locked decisions from CONTEXT.md and Convex guidelines

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (stable stack; Convex 1.36 API is unlikely to change in this window)
