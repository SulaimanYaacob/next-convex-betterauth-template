# Phase 3: Game Shell + Earn - Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 10 new/modified files
**Analogs found:** 10 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `convex/schema.ts` | model | CRUD | `convex/schema.ts` (self — additive) | exact |
| `convex/gameCatalog.ts` | service | CRUD | `convex/coinLedger.ts` | role-match |
| `convex/games.ts` | service | CRUD + event-driven | `convex/presence.ts` + `convex/users.ts` | role-match |
| `src/app/play/[slug]/page.tsx` | component (page shell) | event-driven | `src/components/heartbeat-provider.tsx` | flow-match |
| `src/components/game-iframe.tsx` | component | request-response | `src/components/guest-banner.tsx` | partial |
| `src/components/esc-overlay.tsx` | component | event-driven | `src/components/ui/dialog.tsx` | role-match |
| `src/components/floating-pause-button.tsx` | component | event-driven | `src/components/guest-banner.tsx` | partial |
| `src/components/reward-screen.tsx` | component | request-response | `src/components/coin-balance.tsx` | role-match |
| `src/components/game-card.tsx` | component | CRUD | `src/components/game-card.tsx` (self — extend) | exact |
| `src/app/page.tsx` | component (page) | CRUD | `src/app/page.tsx` (self — refactor) | exact |

---

## Pattern Assignments

### `convex/schema.ts` (model, CRUD — additive change)

**Analog:** `convex/schema.ts` lines 1–90 (self — additive)

**What to copy:** The `gameCatalog` table follows the exact same `defineTable` + `.index()` pattern as `storeItems` (which also has `slug` + `by_slug` index). Mirror that definition.

**Existing storeItems pattern** (lines 36–55) — copy structure for `gameCatalog`:
```typescript
storeItems: defineTable({
  slug: v.string(),
  name: v.string(),
  // ... typed fields
  previewUrl: v.optional(v.string()),   // optional field pattern
  earnedOnly: v.boolean(),
})
  .index("by_slug", ["slug"])
  .index("by_type", ["type"]),
```

**New `gameCatalog` table definition to add** (after the `games` table, lines 79–90):
```typescript
gameCatalog: defineTable({
  slug: v.string(),
  name: v.string(),
  iframeUrl: v.string(),
  isMultiplayer: v.boolean(),
  thumbnailUrl: v.optional(v.string()),
  genre: v.string(),
})
  .index("by_slug", ["slug"])
  .index("by_isMultiplayer", ["isMultiplayer"]),
```

**Note:** `games` table already exists in schema at lines 79–89 — do NOT add it again. Only `gameCatalog` is new.

---

### `convex/gameCatalog.ts` (service, CRUD)

**Analog:** `convex/coinLedger.ts` (lines 1–27) — closest match for a read-only query service using server identity pattern; `convex/users.ts` (lines 1–20) for the `internalMutation` seed pattern.

**Imports pattern** (from `convex/coinLedger.ts` lines 1–2, adapted):
```typescript
import { query, internalMutation } from "./_generated/server";
import { v } from "convex/values";
```

**Query pattern** (from `convex/coinLedger.ts` lines 8–27 — `query` with no auth, public read):
```typescript
export const list = query({
  args: {},
  handler: async (ctx) => {
    return ctx.db.query("gameCatalog").take(100);
  },
});

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

**Seed `internalMutation` pattern** (from `convex/users.ts` lines 6–20 — idempotency guard before insert):
```typescript
// convex/users.ts lines 6-20 — idempotent guard pattern:
const existing = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", args.email))
  .first();
if (existing) return;   // ← idempotency guard
await ctx.db.insert("users", { ... });
```
Apply same guard in `gameCatalog.seed`: check `by_slug` for "pixel-rush" before inserting either record.

**Critical:** `.take(100)` not `.collect()` — per Convex guidelines enforced in existing code (e.g., `coinLedger.ts` line 23: `.take(1000)`). Use `.take(100)` for the catalog list.

---

### `convex/games.ts` (service, CRUD + event-driven)

**Analog:** `convex/presence.ts` (lines 1–45) for the public mutation identity pattern; `convex/users.ts` (lines 27–74) for the `internalMutation` cascade/patch pattern.

**Imports pattern** (from `convex/presence.ts` lines 1–3):
```typescript
import { mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
```
Add for `games.ts`:
```typescript
import { internal } from "./_generated/api";
import { requireEnv } from "./util";
import { Id } from "./_generated/dataModel";
```

**Auth identity pattern** (from `convex/presence.ts` lines 17–26 — THE canonical pattern):
```typescript
// presence.ts lines 17-26
const authUser = await betterAuthComponent.getAuthUser(ctx);
if (!authUser) return; // unauthenticated — silently no-op

const appUser = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", authUser.email))
  .first();
if (!appUser) return;
```
This exact block is the identity resolution pattern for ALL Phase 3 mutations (`startSession`, `updateScore`, `endSession`). Copy verbatim.

**Mutation with db.insert pattern** (from `convex/presence.ts` lines 38–44 — insert-or-patch):
```typescript
// presence.ts lines 38-44
} else {
  await ctx.db.insert("presence", {
    userId: appUser._id,
    lastSeen: Date.now(),
    status: args.status,
  });
}
```

**internalMutation with requireEnv pattern** (from `convex/util.ts` lines 4–9):
```typescript
// util.ts lines 4-9
export const requireEnv = (name: string) => {
  const value = process.env[name];
  if (value === undefined) {
    throw new Error(`Missing environment variable \`${name}\``);
  }
  return value;
};
```
Use `requireEnv("COIN_SCORE_DIVISOR")` and `requireEnv("COIN_SESSION_CAP")` inside `awardSessionCoins`.

**ctx.runMutation cross-call pattern** — call `awardSessionCoins` from `endSession` via:
```typescript
const coins: number = await ctx.runMutation(
  internal.games.awardSessionCoins,
  { userId: appUser._id, gameSessionId: args.gameSessionId, score: args.score },
);
```
Type annotation on `coins` is required to avoid TypeScript circularity (same-file cross-call — per `convex/_generated/ai/guidelines.md`).

**db.patch pattern** (from `convex/users.ts` lines 67–69, from `convex/presence.ts` lines 33–36):
```typescript
// presence.ts lines 33-36
await ctx.db.patch(existing._id, {
  lastSeen: Date.now(),
  status: args.status,
});
```
Copy for `games.ts` `updateScore` and `endSession` patches.

---

### `src/app/play/[slug]/page.tsx` (component/page shell, event-driven)

**Analog:** `src/components/heartbeat-provider.tsx` (lines 1–65) — closest match for `useEffect` + `window.addEventListener` event loop pattern with Convex mutations.

**Imports pattern** (from `heartbeat-provider.tsx` lines 1–6, adapted):
```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
```

**useEffect event listener pattern** (from `heartbeat-provider.tsx` lines 26–62):
```typescript
// heartbeat-provider.tsx lines 26-62 — useEffect with cleanup
useEffect(() => {
  if (!isAuthenticated) return;

  // ... setup
  const events = ["mousemove", "keydown", ...] as const;
  events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));

  return () => {
    clearInterval(interval);
    events.forEach((e) => window.removeEventListener(e, resetIdle));
  };
}, [isAuthenticated, updatePresence]);
```
Apply same structure for `window.addEventListener('message', handleMessage)` and `window.addEventListener('keydown', handleKeyDown)`. Separate `useEffect` per listener type is acceptable.

**Body scroll lock pattern** — unique to this file, no analog; use pattern from RESEARCH.md:
```typescript
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

**Void mutation call pattern** (from `heartbeat-provider.tsx` line 30):
```typescript
void updatePresence({ status: "online" });   // fire-and-forget
```
Use same `void` prefix for all fire-and-forget Convex mutations in GameShell.

**ALLOWED_ORIGINS parse — outside component** (no direct analog; stable ref pattern):
```typescript
// Parse once at module level — stable across renders, no React Compiler issue
const ALLOWED_ORIGINS = new Set(
  (process.env.NEXT_PUBLIC_ALLOWED_GAME_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),
);
```

**State variables pattern** (from `heartbeat-provider.tsx` lines 23–25 — `useRef` for mutable values not needing re-render):
```typescript
const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const statusRef = useRef<"online" | "idle">("online");
```
Use `useRef<Id<"games"> | null>(null)` for `sessionIdRef` — same pattern, mutable cross-effect value.

---

### `src/components/game-iframe.tsx` (component, request-response)

**Analog:** `src/components/guest-banner.tsx` (lines 1–76) — closest match for a client component with `useRef` + conditional rendering + `useEffect` for one-time side effects.

**Imports pattern** (from `guest-banner.tsx` lines 1–6, adapted):
```typescript
"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
```

**useRef one-shot guard pattern** (from `guest-banner.tsx` lines 13–23 — `useEffect` with a guard that runs once):
```typescript
// guest-banner.tsx lines 13-23
useEffect(() => {
  if (typeof window !== "undefined") {
    if (window.localStorage.getItem(DISMISS_KEY) === "true") {
      setDismissed(true);
    }
  }
  setHydrated(true);
}, []);
```
Mirror with `sessionInitSentRef` guard for `SESSION_INIT`:
```typescript
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

**Conditional render pattern** (from `guest-banner.tsx` lines 33–41 — early return guards):
```typescript
if (!hydrated) return null;
if (!isAnonymous || dismissed) return null;
```
Mirror: `if (!iframeLoaded)` → show skeleton. `if (!game)` → show error state.

**Loading skeleton pattern** (from `coin-balance.tsx` lines 19–24 — animate-pulse skeleton):
```typescript
// coin-balance.tsx lines 19-24
return (
  <div
    className="w-16 h-5 bg-muted animate-pulse rounded"
    aria-label="Loading coin balance"
  />
);
```
Extend to full-screen: `absolute inset-0 bg-black flex items-center justify-center` + `<Loader2 className="size-8 text-muted-foreground animate-spin" />`.

---

### `src/components/esc-overlay.tsx` (component, event-driven)

**Analog:** `src/components/ui/dialog.tsx` (lines 1–143) — handles portal, overlay dim, centered panel, animation, focus trap via Radix primitives.

**Key Dialog patterns to copy** (lines 33–81):

**Overlay dim pattern** (lines 34–47):
```typescript
// dialog.tsx lines 34-47
<DialogPrimitive.Overlay
  className={cn(
    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
    className
  )}
/>
```
EscOverlay: increase opacity to `bg-black/75` and add `backdrop-blur-sm`. Change z-index to `z-50`.

**Content panel animation pattern** (lines 49–80):
```typescript
// dialog.tsx lines 63
"data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 fixed top-[50%] left-[50%] ... translate-x-[-50%] translate-y-[-50%] ... rounded-lg border p-6 shadow-lg duration-200"
```
EscOverlay panel: `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-80 max-w-[calc(100vw-32px)] bg-background rounded-2xl border border-border shadow-xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150`.

**Import pattern** (lines 1–8):
```typescript
"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"
```

**EscOverlay can wrap `DialogPrimitive.Root/Content`** directly (reusing dialog's focus trap, aria-modal, ESC dismiss) or implement as a plain `<div>` with manual focus management. Prefer wrapping Radix `DialogPrimitive` to avoid re-implementing focus trap.

---

### `src/components/floating-pause-button.tsx` (component, event-driven)

**Analog:** `src/components/guest-banner.tsx` (lines 64–71) — closest match for a small standalone button component with icon + aria-label + responsive visibility.

**Button with icon pattern** (from `guest-banner.tsx` lines 64–71):
```typescript
// guest-banner.tsx lines 64-71
<button
  type="button"
  onClick={handleDismiss}
  aria-label="Dismiss banner"
  className="size-[44px] inline-flex items-center justify-center rounded-md hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring"
>
  <X className="size-4" aria-hidden="true" />
</button>
```
FloatingPauseButton: same structure but `className="md:hidden fixed bottom-6 right-4 z-40 flex items-center justify-center size-11 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors"`. Import `{ Pause } from "lucide-react"`.

**Imports pattern** (from `guest-banner.tsx` lines 1–7, adapted):
```typescript
"use client";

import { Pause } from "lucide-react";
```

**Props interface** — component receives `onPause: () => void` callback from GameShell parent. Pattern from `heartbeat-provider.tsx` lines 11–14 (`children: React.ReactNode` prop pattern — similarly typed interface).

---

### `src/components/reward-screen.tsx` (component, request-response)

**Analog:** `src/components/coin-balance.tsx` (lines 1–40) — closest match for a client component that subscribes to Convex coin data and renders with loading/null guards.

**Imports pattern** (from `coin-balance.tsx` lines 1–6, adapted):
```typescript
"use client";

import { CoinBalance } from "@/components/coin-balance";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
```

**CoinBalance reuse pattern** (from `coin-balance.tsx` lines 13, 32–38):
```typescript
// coin-balance.tsx lines 13 + 32-38
const balance = useQuery(api.coinLedger.getBalance);

// Render the CoinBalance component directly — it handles its own loading state
<CoinBalance />
```
Reward screen reuses `<CoinBalance />` as-is. No separate subscription needed.

**Loading state guard pattern** (from `coin-balance.tsx` lines 18–25):
```typescript
// coin-balance.tsx lines 18-25
if (balance === undefined) {
  return (
    <div
      className="w-16 h-5 bg-muted animate-pulse rounded"
      aria-label="Loading coin balance"
    />
  );
}
if (balance === null) return null;
```

**Overlay entrance animation** — same `animate-in fade-in zoom-in-95 duration-200` from dialog.tsx overlay pattern (lines 63).

**Presence reset on navigate pattern** (from `heartbeat-provider.tsx` lines 22–23 + 30 — fire-and-forget mutation):
```typescript
const updatePresence = useMutation(api.presence.updatePresence);
// ...
void updatePresence({ status: "online" }); // fire-and-forget before router.push
```

---

### `src/components/game-card.tsx` (component, CRUD — extend existing)

**Analog:** `src/components/game-card.tsx` (lines 1–24) — self-extension.

**Current implementation** (full file, lines 1–24):
```typescript
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GameCardProps {
  name: string;
  genre: string;
}

export function GameCard({ name, genre }: GameCardProps) {
  return (
    <Card className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 gap-0 py-0 focus-visible:ring-2 focus-visible:ring-ring">
      <div className="aspect-video bg-muted animate-pulse" aria-hidden="true" />
      <div className="p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <Badge variant="outline" className="text-xs">{genre}</Badge>
      </div>
    </Card>
  );
}
```

**What to add:**
- Add `slug: string` and `thumbnailUrl?: string` to `GameCardProps`
- Wrap entire card in `<Link href={`/play/${slug}`}>` — import `Link from "next/link"`
- Replace static `aspect-video bg-muted animate-pulse` with conditional `<Image>` (when `thumbnailUrl`) or `<div className="aspect-video bg-muted">` (placeholder)
- Use `next/image` with `sizes` and `priority` per CLAUDE.md: `import Image from "next/image"`
- Add `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring` on the `<Link>` wrapper
- Remove `animate-pulse` from the thumbnail placeholder (it was a dev placeholder, not a real skeleton)

---

### `src/app/page.tsx` (component/page, CRUD — refactor existing)

**Analog:** `src/app/page.tsx` (lines 1–56) — self-refactor. Pattern for Convex data switch comes from `src/components/coin-balance.tsx` and `src/components/presence-panel.tsx`.

**Current implementation** (full file, lines 1–56):
```typescript
// Currently a Server Component with hardcoded arrays
import { FilterChips } from "@/components/filter-chips";
import { GameCard } from "@/components/game-card";
import { PresencePanel } from "@/components/presence-panel";

const SOLO_GAMES = [ ... ] as const;
const MP_GAMES = [ ... ] as const;

export default function Home() { ... }
```

**Refactor to client component** — add `"use client"` directive (top of file). Pattern from `coin-balance.tsx` line 1.

**useQuery pattern** (from `coin-balance.tsx` lines 3–4, 13):
```typescript
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

const allGames = useQuery(api.gameCatalog.list);
```

**undefined = loading guard** (from `coin-balance.tsx` lines 18–25 — Convex undefined pattern):
```typescript
// allGames === undefined → loading; render skeleton grid
// allGames === [] → empty state; render "No games available yet."
// allGames loaded → filter and render GameCard grid
const soloGames = allGames?.filter((g) => !g.isMultiplayer) ?? [];
const mpGames = allGames?.filter((g) => g.isMultiplayer) ?? [];
```

**Skeleton card pattern** (from UI-SPEC §12 — 4× skeleton cards in same grid):
```typescript
{allGames === undefined ? (
  Array.from({ length: 4 }).map((_, i) => (
    <div key={i} className="rounded-xl overflow-hidden">
      <div className="aspect-video bg-muted animate-pulse" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 bg-muted rounded animate-pulse" />
        <div className="h-3 w-1/3 bg-muted rounded animate-pulse" />
      </div>
    </div>
  ))
) : (
  soloGames.map((g) => (
    <GameCard key={g._id} name={g.name} genre={g.genre} slug={g.slug} thumbnailUrl={g.thumbnailUrl} />
  ))
)}
```

---

## Shared Patterns

### Auth Identity Resolution
**Source:** `convex/presence.ts` lines 17–26
**Apply to:** All public mutations in `convex/games.ts` (`startSession`, `updateScore`, `endSession`)
```typescript
const authUser = await betterAuthComponent.getAuthUser(ctx);
if (!authUser) return null; // unauthenticated — silently no-op

const appUser = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", authUser.email))
  .first();
if (!appUser) return null;
```
Never accept `userId` as a function argument. Never trust client-supplied identity.

### requireEnv for Env Vars in Convex
**Source:** `convex/util.ts` lines 4–9
**Apply to:** `convex/games.ts` `awardSessionCoins` internalMutation
```typescript
import { requireEnv } from "./util";
// Inside handler:
const divisor = parseInt(requireEnv("COIN_SCORE_DIVISOR"), 10);
const cap = parseInt(requireEnv("COIN_SESSION_CAP"), 10);
```
Convex env vars must be set via `pnpm convex env set` separately from `.env.local`.

### Convex undefined = Loading Guard
**Source:** `src/components/coin-balance.tsx` lines 18–29
**Apply to:** `src/app/page.tsx` (gameCatalog query), `src/components/reward-screen.tsx` (any Convex query)
```typescript
if (data === undefined) return <Skeleton />;  // loading
if (data === null) return null;               // authenticated but no record
// data is the typed value
```

### Fire-and-Forget Mutation Pattern
**Source:** `src/components/heartbeat-provider.tsx` line 30
**Apply to:** All non-awaited Convex mutations in GameShell page and RewardScreen
```typescript
void updatePresence({ status: "online" }); // prefix with void — no await
```
Never `await` mutations that are fire-and-forget. Avoids unhandled promise warnings.

### useMutation Import Pattern
**Source:** `src/components/heartbeat-provider.tsx` lines 1–4
**Apply to:** `src/app/play/[slug]/page.tsx`, `src/components/reward-screen.tsx`
```typescript
"use client";
import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
```
Note: path alias depth varies — `../../convex/` from `src/components/`, `../../../convex/` from `src/app/play/[slug]/`.

### No useMemo / useCallback
**Source:** CLAUDE.md — "React Compiler: Enabled; do NOT use useMemo or useCallback manually."
**Apply to:** Every React component in this phase
All event handlers are defined as plain functions inside components or `useEffect` bodies. The React Compiler handles memoization automatically.

### Individual Icon Imports
**Source:** `src/components/guest-banner.tsx` line 5
**Apply to:** `src/components/floating-pause-button.tsx`, `src/components/game-iframe.tsx`
```typescript
import { X } from "lucide-react";      // guest-banner.tsx pattern
import { Pause } from "lucide-react";   // floating-pause-button.tsx
import { Loader2 } from "lucide-react"; // game-iframe.tsx
```
Never `import * as Icons from "lucide-react"`.

### toast.error for Mutation Failure
**Source:** CLAUDE.md — "Always use toast.success/error (Sonner) for mutation feedback."
**Apply to:** `src/app/play/[slug]/page.tsx` — coin award mutation failure handler
```typescript
import { toast } from "sonner";
// In catch block or on null return from endSession:
toast.error("Couldn't save your coins. Your progress is not lost — contact support.");
```

### .take(n) Never .collect()
**Source:** `convex/coinLedger.ts` line 23, `convex/presence.ts` line 53, `convex/users.ts` lines 43–65
**Apply to:** Every `ctx.db.query()` in `convex/gameCatalog.ts` and `convex/games.ts`
```typescript
// Always:
.take(100)  // or appropriate limit
// Never:
.collect()  // forbidden on unbounded tables
```

---

## No Analog Found

All files have usable analogs in this codebase. No files require falling back to external references exclusively.

| File | Note |
|------|------|
| `src/app/play/[slug]/page.tsx` | No full-page game shell analog exists; `heartbeat-provider.tsx` covers the `useEffect`/event pattern but planner should also reference RESEARCH.md Pattern 4 (postMessage handler) and Pattern 6 (scroll lock) for the novel aspects |
| `src/components/esc-overlay.tsx` | `dialog.tsx` covers the Radix/portal/animation foundation; planner should reference UI-SPEC §6 for the Phase 3-specific panel dimensions and `bg-black/75` dim color |

---

## Metadata

**Analog search scope:** `convex/`, `src/components/`, `src/app/`, `src/lib/`, `src/proxy.ts`
**Files scanned:** 14
**Pattern extraction date:** 2026-05-01
