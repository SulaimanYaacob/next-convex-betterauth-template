# Phase 2: Home + Presence - Pattern Map

**Mapped:** 2026-05-01
**Files analyzed:** 11 new/modified files
**Analogs found:** 9 / 11

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/components/app-nav.tsx` | component | request-response | `src/components/guest-banner.tsx` | role-match |
| `src/components/mobile-nav.tsx` | component | request-response | `src/components/guest-banner.tsx` | role-match |
| `src/components/mobile-bottom-nav.tsx` | component | request-response | `src/components/guest-banner.tsx` | partial |
| `src/components/filter-chips.tsx` | component | event-driven | `src/components/ui/badge.tsx` | partial |
| `src/components/game-card.tsx` | component | — | `src/components/ui/card.tsx` | partial |
| `src/components/presence-panel.tsx` | component | request-response | `src/components/guest-banner.tsx` | role-match |
| `src/components/coin-balance.tsx` | component | request-response | `src/components/guest-banner.tsx` | exact |
| `src/components/heartbeat-provider.tsx` | provider | event-driven | `src/components/guest-banner.tsx` | role-match |
| `src/app/page.tsx` | page | request-response | `src/app/page.tsx` (current) | exact-rewrite |
| `src/app/layout.tsx` | layout | request-response | `src/app/layout.tsx` (current) | exact-update |
| `convex/presence.ts` | service | CRUD | `convex/presence.ts` (current) | exact-update |
| `convex/crons.ts` | cron/service | batch | `convex/users.ts` | role-match |

---

## Pattern Assignments

### `src/components/app-nav.tsx` (component, request-response)

**Analog:** `src/components/guest-banner.tsx`

**Imports pattern** (guest-banner.tsx lines 1–7):
```typescript
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { authClient } from "@/lib/auth-client";
```

**New imports pattern for AppNav:**
```typescript
"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { GamiLogo } from "@/components/gami-logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { CoinBalance } from "@/components/coin-balance";
import { toast } from "sonner";
```

**Auth guard pattern — anonymous check** (guest-banner.tsx lines 36–41):
```typescript
// Cast through unknown because the inferred session type carries
// additional fields including isAnonymous.
const isAnonymous =
  (session?.user as { isAnonymous?: boolean } | undefined)?.isAnonymous === true;
```
Apply same cast to determine whether to render CoinBalance and full avatar dropdown.

**Core structure pattern** (guest-banner.tsx lines 43–55):
```typescript
// Outer: fixed, z-50, full-width with border
// Inner: max-w-7xl mx-auto container with flex layout
return (
  <div
    role="region"
    aria-label="..."
    className="w-full sticky top-0 z-40 border-b"
  >
    <div className="mx-auto w-full max-w-7xl px-4 flex items-center justify-between gap-2 min-h-[44px]">
```

**AppNav-specific structure:**
```tsx
// Desktop nav: hidden md:flex
<nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-16">
  <div className="w-full max-w-7xl mx-auto px-6 flex items-center gap-4">
    {/* Left: logo — shrink-0 */}
    <GamiLogo size="md" />
    {/* Center: search — flex-1 max-w-xl */}
    <div className="flex-1 max-w-xl relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
      <Input type="search" placeholder="Search games..." aria-label="Search games" className="pl-9" />
    </div>
    {/* Right cluster: shrink-0 */}
    <div className="flex items-center gap-4 shrink-0">
      {!isAnonymous && <CoinBalance />}
      {/* Avatar + DropdownMenu */}
    </div>
  </div>
</nav>
```

**Sign-out pattern** (sign-in page pattern — authClient usage):
```typescript
async function handleSignOut() {
  const result = await authClient.signOut();
  if (result.error) {
    toast.error("Sign out failed. Try again.");
    return;
  }
  router.push("/sign-in");
}
```

**Dropdown destructive item** — use `text-destructive` class on the Sign out DropdownMenuItem.

**Touch target compliance** (guest-banner.tsx line 68):
```typescript
className="size-[44px] inline-flex items-center justify-center rounded-md hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-ring"
```
Avatar button must meet `min-h-[44px] min-w-[44px]`.

---

### `src/components/mobile-nav.tsx` (component, request-response)

**Analog:** `src/components/guest-banner.tsx`

**Imports pattern:** Same as AppNav but omit CoinBalance, Input, Search. Keep GamiLogo, Avatar, DropdownMenu, authClient.

**Core structure:**
```tsx
// Mobile top bar: flex md:hidden
<nav className="flex md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border h-14">
  <div className="w-full px-4 flex items-center justify-between">
    <GamiLogo size="sm" />
    {/* Avatar only — no CoinBalance on mobile top bar */}
  </div>
</nav>
// Mobile search row — full width, directly below top bar
<div className="flex md:hidden fixed top-14 left-0 right-0 z-40 bg-background border-b border-border px-4 py-2">
  <div className="relative w-full">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
    <Input type="search" placeholder="Search games..." aria-label="Search games" className="w-full pl-9" />
  </div>
</div>
```

**Auth check pattern:** Same `isAnonymous` cast as AppNav (guest-banner.tsx lines 36–41).

---

### `src/components/mobile-bottom-nav.tsx` (component, request-response)

**Analog:** `src/components/guest-banner.tsx` (structural pattern only — no close analog exists)

**Imports:**
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ShoppingBag } from "lucide-react";
```

**Core pattern:**
```tsx
<nav
  className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border h-16 pb-[env(safe-area-inset-bottom)]"
  aria-label="Main navigation"
>
  <div className="flex h-full">
    {/* Each tab: flex-1, flex-col, items-center, justify-center, gap-1, min-h-[44px] */}
    {/* Active: text-primary; Inactive: text-muted-foreground */}
    {/* Use aria-current="page" on active tab */}
  </div>
</nav>
```

**Active tab detection:** `usePathname()` — compare against `/` and `/store`.

**Inline style for section surfaces** (guest-banner.tsx lines 48–51):
```typescript
style={{ backgroundColor: "#f1f5fb", borderColor: "rgba(59,130,246,0.15)" }}
```
Do not replicate this pattern — bottom nav uses CSS variables only (`bg-background`, `border-border`).

---

### `src/components/filter-chips.tsx` (component, event-driven)

**Analog:** `src/components/ui/badge.tsx` + `src/components/ui/button.tsx`

**Imports:**
```typescript
"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
```

**Core pattern — radio group with local state:**
```tsx
const CHIPS = ["All", "Multiplayer", "Desktop", "Mobile"] as const;
type Chip = typeof CHIPS[number];

export function FilterChips() {
  const [active, setActive] = useState<Chip>("All");

  return (
    <div role="radiogroup" aria-label="Game filters" className="flex flex-row gap-2 px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto">
      {CHIPS.map((chip) => (
        <button
          key={chip}
          type="button"
          role="radio"
          aria-checked={active === chip}
          onClick={() => setActive(chip)}
          className={cn(
            "px-4 h-9 rounded-full text-sm min-h-[44px] transition-colors",
            active === chip
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
          )}
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
```

**cn utility** (src/lib/utils.ts — used throughout):
```typescript
import { cn } from "@/lib/utils";
// cn merges Tailwind classes, resolving conflicts
```

---

### `src/components/game-card.tsx` (component, static)

**Analog:** `src/components/ui/card.tsx`

**Imports:**
```typescript
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
```

**Card component usage pattern** (card.tsx lines 1–16):
```typescript
// Card is a plain div with data-slot="card" and bg-card rounded-xl border shadow-sm
// Compose with plain divs inside — no CardHeader/CardContent required for game card
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm",
        className
      )}
      {...props}
    />
  )
}
```

**Game card pattern:**
```tsx
interface GameCardProps {
  name: string;
  genre: string;
}

export function GameCard({ name, genre }: GameCardProps) {
  return (
    <Card className="rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 gap-0 py-0 focus-visible:ring-2 focus-visible:ring-ring">
      {/* 16:9 thumbnail placeholder */}
      <div className="aspect-video bg-muted animate-pulse" />
      <div className="p-4 space-y-2">
        <p className="text-sm font-semibold text-foreground">{name}</p>
        <Badge variant="outline" className="text-xs">{genre}</Badge>
      </div>
    </Card>
  );
}
```

**Badge variant="outline"** (badge.tsx lines 18–19):
```typescript
outline: "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
```

---

### `src/components/presence-panel.tsx` (component, request-response)

**Analog:** `src/components/guest-banner.tsx` (auth check, Convex loading pattern)

**Imports:**
```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
```

**Convex query undefined = loading pattern** (from CLAUDE.md):
```typescript
// From CLAUDE.md minimal example:
const user = useQuery(api.auth.getCurrentUser);
if (user === undefined) return <Skeleton />; // loading
```

**PresencePanel pattern:**
```tsx
export function PresencePanel() {
  const players = useQuery(api.presence.getOnlinePlayers);

  // Loading state
  if (players === undefined) {
    return (
      <div className="rounded-xl border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold mb-2">Online now</p>
        <div className="flex flex-row gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="size-10 rounded-full bg-muted animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // Empty state
  if (players.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold mb-2">Online now</p>
        <p className="text-sm text-muted-foreground text-center py-4">No players online right now</p>
      </div>
    );
  }

  // Populated
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4">
      <p className="text-sm font-semibold mb-2">Online now</p>
      <div role="list" className="flex flex-row gap-4 overflow-x-auto pb-1">
        {players.map((player) => (
          <div key={player.userId} role="listitem" className="flex flex-col items-center gap-1 shrink-0 w-14">
            <div
              className="relative"
              aria-label={`${player.name}, ${player.status}`}
            >
              <Avatar className="size-10">
                <AvatarFallback className="text-xs">{player.initials}</AvatarFallback>
              </Avatar>
              {/* Status dot — absolute bottom-right */}
              <span
                className="absolute bottom-0 right-0 size-2 rounded-full ring-2 ring-background"
                style={{ backgroundColor: STATUS_COLORS[player.status] }}
                aria-hidden="true"
              />
            </div>
            <span className="text-xs text-muted-foreground truncate w-full text-center">{player.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const STATUS_COLORS = {
  online: "#22c55e",
  "in-game": "oklch(0.5360 0.0398 196.0280)", // --secondary
  idle: "oklch(0.5510 0.0234 264.3637)",       // --muted-foreground
} as const;
```

---

### `src/components/coin-balance.tsx` (component, request-response)

**Analog:** `src/components/guest-banner.tsx` — closest match: same auth check pattern + conditional render

**Imports:**
```typescript
"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";
```

**Auth check pattern** (guest-banner.tsx lines 36–41):
```typescript
const isAnonymous =
  (session?.user as { isAnonymous?: boolean } | undefined)?.isAnonymous === true;

if (!isAnonymous || dismissed) return null;
```

**CoinBalance pattern:**
```tsx
export function CoinBalance() {
  const { data: session } = authClient.useSession();
  const isAnonymous =
    (session?.user as { isAnonymous?: boolean } | undefined)?.isAnonymous === true;

  const balance = useQuery(api.coinLedger.getBalance);

  // Hidden entirely for guests
  if (!session || isAnonymous) return null;

  // Loading skeleton (balance === undefined)
  if (balance === undefined) {
    return <div className="w-16 h-5 bg-muted animate-pulse rounded" aria-label="Loading coin balance" />;
  }

  return (
    <span
      className="text-sm font-semibold tabular-nums text-primary"
      aria-label={`Coin balance: ${balance} coins`}
    >
      ⟟ {balance.toLocaleString()}
    </span>
  );
}
```

---

### `src/components/heartbeat-provider.tsx` (provider, event-driven)

**Analog:** `src/components/guest-banner.tsx` — uses `useEffect` for side effects + auth check

**Imports:**
```typescript
"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { authClient } from "@/lib/auth-client";
import { api } from "@/convex/_generated/api";
```

**useEffect cleanup pattern** (guest-banner.tsx lines 15–23):
```typescript
useEffect(() => {
  if (typeof window !== "undefined") {
    if (window.localStorage.getItem(DISMISS_KEY) === "true") {
      setDismissed(true);
    }
  }
  setHydrated(true);
}, []);
```

**HeartbeatProvider pattern:**
```tsx
// React Compiler active — no useCallback on event handlers
export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const isAnonymous =
    (session?.user as { isAnonymous?: boolean } | undefined)?.isAnonymous === true;
  const isAuthenticated = session?.user && !isAnonymous;

  const updatePresence = useMutation(api.presence.updatePresence);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusRef = useRef<"online" | "idle">("online");

  useEffect(() => {
    if (!isAuthenticated) return;

    // Initial heartbeat
    updatePresence({ status: "online" });

    // 15-second interval heartbeat
    const interval = setInterval(() => {
      updatePresence({ status: statusRef.current });
    }, 15_000);

    // Idle detection — 3 minutes
    const IDLE_MS = 3 * 60 * 1000;

    function resetIdle() {
      if (statusRef.current === "idle") {
        statusRef.current = "online";
        updatePresence({ status: "online" });
      }
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        statusRef.current = "idle";
        updatePresence({ status: "idle" });
      }, IDLE_MS);
    }

    resetIdle(); // start timer immediately

    const events = ["mousemove", "keydown", "scroll", "click"] as const;
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));

    return () => {
      clearInterval(interval);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetIdle));
    };
  }, [isAuthenticated, updatePresence]);

  return <>{children}</>;
}
```

**Key rule:** React Compiler is active — no `useCallback` or `useMemo`. Do not wrap `resetIdle` in `useCallback`.

---

### `src/app/page.tsx` (page, static)

**Analog:** `src/app/page.tsx` (current — lines 1–17, full file)

**Current pattern** (page.tsx lines 1–17):
```typescript
import { GuestBanner } from "@/components/guest-banner";

export default function Home() {
  return (
    <>
      <GuestBanner />
      <main className="min-h-svh flex flex-col items-center justify-center gap-2 p-6 text-center">
        ...
      </main>
    </>
  );
}
```

**New home page pattern — server component, no "use client":**
```tsx
import { FilterChips } from "@/components/filter-chips";
import { GameCard } from "@/components/game-card";
import { PresencePanel } from "@/components/presence-panel";

const SOLO_GAMES = [
  { name: "Pixel Rush", genre: "Arcade" },
  { name: "Mind Maze", genre: "Puzzle" },
] as const;

const MP_GAMES = [
  { name: "Pixel Rush MP", genre: "Arcade" },
  { name: "Mind Maze Co-op", genre: "Puzzle" },
] as const;

export default function Home() {
  return (
    <>
      <FilterChips />
      <main>
        {/* Solo section — #f8f6f2 */}
        <section
          aria-label="Solo games"
          className="py-10 px-4 sm:px-6 lg:px-8"
          style={{ backgroundColor: "#f8f6f2" }}
        >
          <div className="w-full max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Solo</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {SOLO_GAMES.map((g) => <GameCard key={g.name} {...g} />)}
            </div>
          </div>
        </section>
        {/* Multiplayer section — #f1f5fb */}
        <section
          aria-label="Multiplayer games"
          className="py-10 px-4 sm:px-6 lg:px-8"
          style={{ backgroundColor: "#f1f5fb" }}
        >
          <div className="w-full max-w-7xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Multiplayer</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {MP_GAMES.map((g) => <GameCard key={g.name} {...g} />)}
            </div>
            <div className="mt-8">
              <PresencePanel />
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
```

**Section surface colors** (guest-banner.tsx lines 48–51 — same hex values):
```typescript
// Solo: style={{ backgroundColor: "#f8f6f2" }}
// MP:   style={{ backgroundColor: "#f1f5fb" }}
// Use inline style — no Tailwind token mapping needed for precision
```

---

### `src/app/layout.tsx` (layout, request-response)

**Analog:** `src/app/layout.tsx` (current — lines 1–44, full file)

**Current layout pattern** (layout.tsx lines 1–44):
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/next-theme/theme-provider";
import { ConvexClientProvider } from "./ConvexClientProvider";
```

**Updated layout — add nav components + HeartbeatProvider + body offset:**
```tsx
import { AppNav } from "@/components/app-nav";
import { MobileNav } from "@/components/mobile-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { HeartbeatProvider } from "@/components/heartbeat-provider";
import { GuestBanner } from "@/components/guest-banner";

// Body: remove overflow-hidden, add pt-16 desktop / pt-[calc(56px+48px)] mobile, pb-16 mobile
// Wrap children in HeartbeatProvider (client — runs heartbeat for authenticated users only)
// Place AppNav + MobileNav + MobileBottomNav here — wraps all routes
```

**Key change:** Remove `overflow-hidden` from body — the current layout has `overflow-hidden` which will prevent fixed nav from displaying correctly. Change body to `min-h-svh`.

---

### `convex/presence.ts` (service, CRUD — update)

**Analog:** `convex/presence.ts` (current — lines 1–45, full file)

**Existing mutation pattern** (presence.ts lines 1–45):
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";

export const updatePresence = mutation({
  args: {
    status: v.union(v.literal("online"), v.literal("in-game"), v.literal("idle")),
  },
  handler: async (ctx, args) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) return; // unauthenticated — silently no-op

    const appUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .first();
    if (!appUser) return;

    const existing = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastSeen: Date.now(), status: args.status });
    } else {
      await ctx.db.insert("presence", { userId: appUser._id, lastSeen: Date.now(), status: args.status });
    }
  },
});
```

**New query to add — `getOnlinePlayers`:**
```typescript
import { query } from "./_generated/server";

// Returns online + in-game players (not idle, not offline)
// Presence panel filters to status "online" | "in-game" only
export const getOnlinePlayers = query({
  args: {},
  handler: async (ctx) => {
    // Use .take(50) — never .collect() per Convex guidelines
    const rows = await ctx.db.query("presence").take(50);
    const active = rows.filter(
      (r) => r.status === "online" || r.status === "in-game"
    );
    // Join with users to get email/name for display
    return Promise.all(
      active.map(async (r) => {
        const user = await ctx.db.get(r.userId);
        const name = user?.username ?? user?.email?.split("@")[0] ?? "Player";
        const initials = name.slice(0, 2).toUpperCase();
        return { userId: r.userId, name, initials, status: r.status };
      })
    );
  },
});
```

**Auth pattern for getAuthUser** (presence.ts lines 12–19 — identity from betterAuthComponent, never from args):
```typescript
const authUser = await betterAuthComponent.getAuthUser(ctx);
if (!authUser) return; // silently no-op
```

---

### `convex/crons.ts` (cron/service, batch)

**Analog:** `convex/users.ts` (internalMutation pattern with `.take(100)`)

**No existing crons.ts in project** — use research pattern.

**Convex cron pattern:**
```typescript
import { cronJobs } from "convex/server";
import { internalMutation } from "./_generated/server";

// Mark rows stale (lastSeen > 5 min ago) as "offline"
export const markStalePresence = internalMutation({
  args: {},
  handler: async (ctx) => {
    const staleMs = 5 * 60 * 1000;
    const cutoff = Date.now() - staleMs;
    // Use .take(100) — never .collect() per Convex guidelines (users.ts pattern)
    const rows = await ctx.db.query("presence").take(100);
    for (const row of rows) {
      if (row.lastSeen < cutoff && row.status !== "offline") {
        await ctx.db.patch(row._id, { status: "offline" });
      }
    }
  },
});

const crons = cronJobs();
crons.interval(
  "mark-stale-presence",
  { minutes: 1 },
  internal.crons.markStalePresence,
);
export default crons;
```

**Take limit pattern** (users.ts lines 46–48):
```typescript
const ledgerRows = await ctx.db
  .query("coinLedger")
  .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
  .take(100);
for (const row of ledgerRows) await ctx.db.delete(row._id);
```

---

### `convex/coinLedger.ts` (service/query — new file needed)

**Note:** `api.coinLedger.getBalance` is referenced by CoinBalance component but no `coinLedger.ts` file exists yet. Must be created.

**Analog:** `convex/presence.ts` (query + betterAuthComponent.getAuthUser pattern)

**Pattern:**
```typescript
import { query } from "./_generated/server";
import { betterAuthComponent } from "./auth";

// ECON-04: real-time balance subscription
// Balance = SUM of all coinLedger rows for the user
export const getBalance = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) return null;

    const appUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .first();
    if (!appUser) return null;

    // Use .take(1000) — never .collect() per Convex guidelines
    const rows = await ctx.db
      .query("coinLedger")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(1000);

    return rows.reduce((sum, row) => sum + row.amount, 0);
  },
});
```

---

## Shared Patterns

### Auth Session Check (anonymous detection)
**Source:** `src/components/guest-banner.tsx` lines 36–41
**Apply to:** `app-nav.tsx`, `mobile-nav.tsx`, `coin-balance.tsx`, `heartbeat-provider.tsx`
```typescript
const { data: session } = authClient.useSession();
const isAnonymous =
  (session?.user as { isAnonymous?: boolean } | undefined)?.isAnonymous === true;
```

### Convex Loading State (undefined = loading)
**Source:** CLAUDE.md "Small Data Component" example
**Apply to:** `coin-balance.tsx`, `presence-panel.tsx`
```typescript
// undefined = still loading → show skeleton
// null/0 = valid empty response → show content
if (data === undefined) return <Skeleton />;
```

### Section Surface Colors (inline style)
**Source:** `src/components/guest-banner.tsx` lines 48–51
**Apply to:** `src/app/page.tsx` Solo + Multiplayer sections
```typescript
// Solo:        style={{ backgroundColor: "#f8f6f2" }}
// Multiplayer: style={{ backgroundColor: "#f1f5fb" }}
// Always inline style — not Tailwind — for exact color precision
```

### Standard Page Container
**Source:** CLAUDE.md
**Apply to:** All section inner wrappers
```typescript
className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
```

### Touch Target Compliance
**Source:** `src/components/guest-banner.tsx` line 68
**Apply to:** All interactive elements (nav avatar button, filter chips, bottom nav tabs)
```typescript
className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center"
```

### Convex internalMutation with .take()
**Source:** `convex/users.ts` lines 46–48
**Apply to:** `convex/crons.ts` markStalePresence
```typescript
const rows = await ctx.db.query("tableName").take(100);
for (const row of rows) { /* operate */ }
// Never use .collect() for unbounded sets
```

### Tailwind cn() Utility
**Source:** `src/lib/utils.ts` (used in all UI components)
**Apply to:** All new components that need conditional class merging
```typescript
import { cn } from "@/lib/utils";
className={cn("base-classes", condition && "conditional-classes")}
```

### Focus Ring
**Source:** `src/components/guest-banner.tsx` line 68; `src/components/ui/input.tsx` line 12
**Apply to:** All interactive elements
```typescript
"focus-visible:ring-2 focus-visible:ring-ring"
```

### Sonner Toast for Mutation Errors
**Source:** CLAUDE.md "Always use toast.success/error (Sonner) for mutation feedback"
**Apply to:** Sign-out in nav avatar dropdown
```typescript
import { toast } from "sonner";
toast.error("Sign out failed. Try again.");
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `convex/crons.ts` | cron | batch | No cron file exists in project yet — use Convex cronJobs() API pattern |
| `src/components/mobile-bottom-nav.tsx` | component | request-response | No bottom nav pattern exists — closest structural analog is guest-banner fixed positioning |

---

## Metadata

**Analog search scope:** `src/components/`, `src/app/`, `convex/`, `src/lib/`
**Files scanned:** 18
**Pattern extraction date:** 2026-05-01
