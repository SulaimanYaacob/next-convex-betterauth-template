# Phase 2: Home + Presence - Research

**Researched:** 2026-05-01
**Domain:** Next.js App Router layout, Convex real-time presence, Convex cron jobs, Tailwind CSS v4 multi-section home layout
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Desktop top nav layout left-to-right: `[ gami logo ] [ Search (centered, wide) ] [ ⟟ balance ] [ avatar ]`
- **D-02:** Coin balance (⟟) hidden entirely for guests — no placeholder or ⟟ 0 shown
- **D-03:** Avatar click opens dropdown: Profile, Settings, Sign out. Uses existing Avatar + DropdownMenu primitives
- **D-04:** Mobile bottom tab bar ships in Phase 2: Home + Store tabs. Store → `/store` (empty placeholder)
- **D-05:** Mobile top nav simplifies to logo + avatar only; search bar moves to a full-width row below
- **D-06:** Search bar visual-only in Phase 2 — no filtering behavior
- **D-07:** Filter chips (All / Multiplayer / Desktop / Mobile) visual-only in Phase 2
- **D-08:** V2 Refined spotlight layout: Solo section on `#f8f6f2`, Multiplayer section on `#f1f5fb`
- **D-09:** Game cards use hardcoded placeholder data — no Convex `games` table reads in Phase 2
- **D-10:** Heartbeat: `updatePresence` mutation every 15s. Lives in root layout. Guests do NOT heartbeat
- **D-11:** Idle detection: client-side, 3 minutes no activity → status `"idle"`. Events: mousemove, keydown, scroll, click
- **D-12:** Convex cron marks presence rows with `lastSeen > 5 minutes` as `"offline"` — runs every minute
- **D-13:** Presence panel shows online + in-game players; idle/offline filtered out

### Claude's Discretion

- Exact game card dimensions, hover effects, and information density
- Presence panel exact layout (resolved in UI-SPEC: horizontal scroll, max 6 visible)
- Mobile search bar placement (resolved in UI-SPEC: full-width row below top bar)
- Loading skeleton pattern for presence panel and coin balance

### Deferred Ideas (OUT OF SCOPE)

- Game card exact design (real design in Phase 3)
- Functional search / filter chip queries (Phase 3+)
- Store tab content (Phase 4)
- OAuth/social sign-in in dropdown (v2)

</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Home page shows Solo section and Multiplayer section in V2 Refined spotlight layout | Section surface hex values confirmed in codebase. Layout pattern documented in Architecture section below. |
| HOME-02 | Coin balance (⟟) visible in nav for authenticated users, real-time | `coinLedger` table confirmed in schema; `getBalance` query must be created. `useQuery` subscription pattern documented below. |
| HOME-03 | Search bar in nav and filter chip strip | Components mapped: Input (existing), Button (existing). Visual-only confirmed. |
| HOME-04 | Real-time presence panel in Multiplayer section | `presence` table and `updatePresence` mutation confirmed in codebase. Query and display pattern documented below. |
| PRES-02 | User status: online / in-game / idle; idle detected client-side after 3min | `HeartbeatProvider` pattern documented. Idle detection via event listeners + debounced timer. |
| PRES-03 | Convex cron marks stale presence rows offline (lastSeen > 5min) | Cron pattern from Convex guidelines confirmed. `convex/crons.ts` does not exist yet — must be created. `"offline"` is NOT currently in the presence schema — requires schema patch. |
| ECON-04 | Coin balance in nav updates in real-time via Convex subscription | `coinLedger` table confirmed append-only. `getBalance` query (SUM pattern) must be created in `convex/coinLedger.ts`. |

</phase_requirements>

---

## Summary

Phase 2 builds on a complete Phase 1 foundation. The schema is locked and correct — `presence` table and `coinLedger` table exist as designed. The `updatePresence` mutation is already implemented in `convex/presence.ts`. The primary work is: (1) new Convex queries (`getOnlinePlayers`, `coinLedger.getBalance`, a presence query for the panel), (2) a `convex/crons.ts` file with a `markStalePresence` cron, (3) schema patch to add `"offline"` to the presence status union, and (4) 8 new React components wired together in an updated root layout and home page.

One critical finding: the `presence` schema currently has `status: v.union(v.literal("online"), v.literal("in-game"), v.literal("idle"))` — the `"offline"` literal is missing. The cron (PRES-03) needs to write `"offline"`, so the schema must be patched first. This is a Wave 0 task.

A second finding: the root `layout.tsx` currently uses `Inter` font and a flex layout with `overflow-hidden`. Phase 2 replaces `Inter` with `Geist Mono` (which is already the `--font-sans` token in globals.css) and restructures the layout to accommodate fixed nav + scrollable content. The current `overflow-hidden` on body and `grow flex flex-col overflow-hidden` on main will prevent the home page from scrolling — these must be changed.

**Primary recommendation:** Start every wave with the schema patch (add `"offline"`) and the new Convex backend functions (`coinLedger.getBalance`, `presence.getOnlinePlayers`, `crons.ts`), then build UI components in dependency order.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Nav rendering (desktop + mobile) | Frontend (Client Component) | — | Needs session state for guest vs auth display; `"use client"` required for authClient.useSession() |
| Coin balance subscription | Frontend (Client Component) | Convex backend (query) | useQuery lives on client; `getBalance` SUM query lives in Convex |
| Heartbeat / idle detection | Frontend (Client Component in root layout) | Convex backend (mutation) | Timer and event listeners are browser-only; mutation writes to Convex |
| Presence panel display | Frontend (Client Component) | Convex backend (query) | useQuery for live player list; filter logic (online + in-game only) in backend query |
| Stale presence cleanup | Convex cron (backend) | — | Must run server-side even when no client is connected; tab crashes = no client |
| Home page layout (sections) | Frontend (Server Component) | — | Static structure, no client state needed; child components handle real-time |
| Filter chips / search (visual-only) | Frontend (Client Component) | — | Local `useState` for active chip only; no server interaction |
| Avatar dropdown (sign out) | Frontend (Client Component) | — | authClient.signOut() is client-side |
| Mobile bottom nav active state | Frontend (Client Component) | — | usePathname() for active tab detection |

---

## Standard Stack

### Core (already installed — versions verified from package.json)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| convex | ^1.36.1 | Real-time queries, mutations, cron | Already installed; all Convex functions use this |
| next | 16.2.4 | App Router, layouts, routing | Project framework |
| react | 19.2.5 | UI components | Project framework |
| better-auth | 1.6.9 | Session/auth client | Already integrated; useSession pattern established |
| @convex-dev/better-auth | ^0.12.0 | Convex-Better Auth bridge | Already integrated |
| tailwindcss | ^4.2.4 | Styling | Project standard; `@theme inline` pattern established |
| lucide-react | ^1.11.0 | Icons (House, ShoppingBag, Search) | Already installed; project icon standard |
| sonner | ^2.0.7 | Toast notifications | Already installed; used for mutation feedback |

[VERIFIED: package.json]

### Supporting (already installed)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-avatar | ^1.1.10 | Avatar primitive (nav + presence) | Already in `src/components/ui/avatar.tsx` |
| @radix-ui/react-dropdown-menu | ^2.1.16 | Nav avatar dropdown | Already in `src/components/ui/dropdown-menu.tsx` |
| tw-animate-css | ^1.4.0 | animate-pulse for skeletons | Already imported in globals.css |

[VERIFIED: package.json]

### No New Dependencies Required

Phase 2 requires zero new package installations. All needed libraries are already in the project.

---

## Architecture Patterns

### System Architecture Diagram

```
Browser (root layout: src/app/layout.tsx)
        │
        ├── HeartbeatProvider ["use client"]
        │       │  setInterval(15s) → useMutation(api.presence.updatePresence)
        │       │  window event listeners → idle detection → status: "online"|"idle"
        │       └── (runs only when session.user.isAnonymous === false)
        │
        ├── AppNav ["use client"] (hidden md:hidden on mobile)
        │       ├── GamiLogo (size=md)
        │       ├── Search Input (visual-only)
        │       ├── CoinBalance ["use client"]
        │       │       └── useQuery(api.coinLedger.getBalance) → real-time SUM
        │       └── Avatar + DropdownMenu → authClient.signOut()
        │
        ├── MobileNav ["use client"] (flex md:hidden)
        │       ├── GamiLogo (size=sm)
        │       └── Avatar
        │
        ├── MobileSearchRow (full-width below MobileNav, md:hidden)
        │
        ├── FilterChips ["use client"] (local useState — visual only)
        │
        └── Page Content (src/app/page.tsx — Server Component)
                ├── Solo Section (#f8f6f2)
                │       └── GameCard × 2 (hardcoded data)
                └── Multiplayer Section (#f1f5fb)
                        ├── GameCard × 2 (hardcoded data)
                        └── PresencePanel ["use client"]
                                └── useQuery(api.presence.getOnlinePlayers)

Convex Backend
        ├── presence.ts
        │       ├── updatePresence (mutation) — ALREADY EXISTS
        │       └── getOnlinePlayers (query) — NEW: filters online + in-game, .take(20)
        ├── coinLedger.ts — NEW FILE
        │       └── getBalance (query) — SUM of coinLedger by userId
        └── crons.ts — NEW FILE
                └── markStalePresence (internalMutation, every 1 min)
                        └── patches rows where lastSeen < (Date.now() - 5min) to "offline"

MobileBottomNav ["use client"] (fixed bottom-0, md:hidden)
        └── usePathname() for active tab
```

### Recommended Project Structure (new files only)

```
convex/
├── coinLedger.ts        # getBalance query (SUM pattern)
├── crons.ts             # markStalePresence cron — 1min interval
└── presence.ts          # ADD: getOnlinePlayers query (+ existing updatePresence)

src/
├── app/
│   ├── layout.tsx       # MODIFY: add HeartbeatProvider, AppNav, MobileNav, MobileBottomNav; fix overflow
│   ├── page.tsx         # REPLACE: V2 home layout (two sections, game cards, presence panel)
│   └── store/
│       └── page.tsx     # NEW: empty placeholder (mobile bottom nav Store tab target)
└── components/
    ├── app-nav.tsx          # Desktop top nav
    ├── mobile-nav.tsx       # Mobile top bar
    ├── mobile-bottom-nav.tsx # Fixed bottom tab bar
    ├── filter-chips.tsx     # Visual-only chip strip
    ├── game-card.tsx        # Placeholder game card
    ├── presence-panel.tsx   # Online players horizontal scroll
    ├── coin-balance.tsx     # Real-time ⟟ balance
    └── heartbeat-provider.tsx # 15s interval + idle detection
```

### Pattern 1: Convex Cron — markStalePresence

**What:** Cron job runs every 1 minute, finds presence rows with `lastSeen` older than 5 minutes, patches them to `"offline"`.

**Critical constraint from guidelines:** Use only `crons.interval` or `crons.cron`. Never `crons.hourly/daily/weekly`. Both take FunctionReference, not function directly. [VERIFIED: convex/_generated/ai/guidelines.md]

**When to use:** Any server-side periodic task that must run even when no client is connected.

```typescript
// convex/crons.ts
// Source: convex/_generated/ai/guidelines.md (cron pattern)
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const markStalePresence = internalMutation({
  args: {},
  handler: async (ctx) => {
    const staleThreshold = Date.now() - 5 * 60 * 1000; // 5 minutes
    // Use .take(100) — never .collect() per guidelines
    const staleRows = await ctx.db
      .query("presence")
      .filter((q) => q.lt(q.field("lastSeen"), staleThreshold))
      .take(100);
    for (const row of staleRows) {
      await ctx.db.patch(row._id, { status: "offline" });
    }
  },
});

const crons = cronJobs();
crons.interval(
  "mark stale presence offline",
  { minutes: 1 },
  internal.crons.markStalePresence,
  {},
);
export default crons;
```

**IMPORTANT:** `.filter()` is used here because the `presence` table does not have an index on `lastSeen`. An alternative is to add a `by_lastSeen` index to the schema for efficient filtering. Given the small scale of Phase 2, `.filter()` on the full table is acceptable. [ASSUMED — no index benchmarking done]

### Pattern 2: Convex Real-Time Coin Balance (SUM Query)

**What:** Append-only ledger, balance = SUM(amount). Query aggregates all rows for authenticated user. [VERIFIED: convex/schema.ts — coinLedger table structure confirmed]

```typescript
// convex/coinLedger.ts
// Source: convex/schema.ts (coinLedger table), convex/_generated/ai/guidelines.md
import { query } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";

export const getBalance = query({
  args: {},
  handler: async (ctx): Promise<number | null> => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) return null;

    const appUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", authUser.email))
      .first();
    if (!appUser) return null;

    const rows = await ctx.db
      .query("coinLedger")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .collect(); // Full collect acceptable — balance reads all rows
    return rows.reduce((sum, row) => sum + row.amount, 0);
  },
});
```

**Client usage:**
```typescript
// src/components/coin-balance.tsx — "use client"
// Source: CLAUDE.md pattern + convex/_generated/ai/guidelines.md
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function CoinBalance() {
  const balance = useQuery(api.coinLedger.getBalance);
  // balance === undefined → loading; balance === null → guest/no user; balance === number → show
  if (balance === undefined) {
    return <div className="w-16 h-5 bg-muted animate-pulse rounded" aria-hidden="true" />;
  }
  if (balance === null) return null; // guest — render nothing
  return (
    <span
      className="text-sm font-semibold tabular-nums text-foreground"
      aria-label={`Coin balance: ${balance} coins`}
    >
      <span className="text-primary">⟟</span>{" "}
      {balance.toLocaleString()}
    </span>
  );
}
```

### Pattern 3: Presence Query — getOnlinePlayers

**What:** Returns presence rows with status `"online"` or `"in-game"`, ordered by lastSeen desc, limited to 20. Joins user name for display. [VERIFIED: convex/schema.ts — presence + users tables confirmed]

**Constraint from guidelines:** No `.filter()` on indexed queries — but presence table has `by_userId` index, not a `by_status` index. For Phase 2 scale a full-table `.filter()` is acceptable. [ASSUMED — acceptable at Phase 2 scale]

```typescript
// convex/presence.ts — ADD this query (keep existing updatePresence mutation)
// Source: convex/schema.ts, convex/_generated/ai/guidelines.md
export const getOnlinePlayers = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db
      .query("presence")
      .filter((q) =>
        q.or(
          q.eq(q.field("status"), "online"),
          q.eq(q.field("status"), "in-game"),
        ),
      )
      .order("desc")
      .take(20);

    // Join with users table to get display name
    const players = await Promise.all(
      rows.map(async (row) => {
        const user = await ctx.db.get(row.userId);
        return {
          userId: row.userId,
          status: row.status,
          name: user?.email?.split("@")[0] ?? "Player", // username added Phase 4
        };
      }),
    );
    return players;
  },
});
```

### Pattern 4: HeartbeatProvider — Client Component in Root Layout

**What:** Client component that runs `setInterval(15s)` for heartbeat and tracks user activity for idle detection. Mounted once in root layout, runs on all authenticated pages. [VERIFIED: CONTEXT.md D-10, D-11]

**Constraint:** React Compiler is active — no `useCallback`, no `useMemo`, no `React.memo`. [VERIFIED: CLAUDE.md]

```typescript
// src/components/heartbeat-provider.tsx
// Source: CONTEXT.md D-10/D-11, CLAUDE.md (React Compiler — no useCallback)
"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { authClient } from "@/lib/auth-client";

const IDLE_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
const HEARTBEAT_INTERVAL_MS = 15 * 1000; // 15 seconds

export function HeartbeatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const updatePresence = useMutation(api.presence.updatePresence);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isIdleRef = useRef(false);

  const isAuthenticated =
    session?.user !== undefined &&
    (session.user as { isAnonymous?: boolean }).isAnonymous !== true;

  useEffect(() => {
    if (!isAuthenticated) return;

    // Heartbeat interval
    const heartbeat = setInterval(() => {
      void updatePresence({
        status: isIdleRef.current ? "idle" : "online",
      });
    }, HEARTBEAT_INTERVAL_MS);

    // Initial heartbeat on mount
    void updatePresence({ status: "online" });

    // Idle detection
    function resetIdleTimer() {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (isIdleRef.current) {
        isIdleRef.current = false;
        void updatePresence({ status: "online" });
      }
      idleTimerRef.current = setTimeout(() => {
        isIdleRef.current = true;
        void updatePresence({ status: "idle" });
      }, IDLE_TIMEOUT_MS);
    }

    const events = ["mousemove", "keydown", "scroll", "click"] as const;
    events.forEach((e) => window.addEventListener(e, resetIdleTimer));
    resetIdleTimer(); // start timer

    return () => {
      clearInterval(heartbeat);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetIdleTimer));
    };
  }, [isAuthenticated, updatePresence]);

  return <>{children}</>;
}
```

**Note on `useRef` usage:** `useRef` is fine with React Compiler. The prohibition is on `useCallback`, `useMemo`, and `React.memo` only. [VERIFIED: CLAUDE.md]

### Pattern 5: Mobile Bottom Nav — Active Tab Detection

**What:** Fixed bottom tab bar uses `usePathname()` from `next/navigation` for active tab detection. Must be `"use client"`. [ASSUMED — standard Next.js App Router pattern]

```typescript
// src/components/mobile-bottom-nav.tsx
"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { House, ShoppingBag } from "lucide-react";

export function MobileBottomNav() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border h-16"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {/* tabs */}
    </nav>
  );
}
```

### Pattern 6: Root Layout Restructure

**Critical finding:** The current `src/app/layout.tsx` has `overflow-hidden` on `<body>` and `grow flex flex-col overflow-hidden` on `<main>`. This will prevent the home page from scrolling. The layout needs restructuring for Phase 2's scrollable content with fixed nav. [VERIFIED: src/app/layout.tsx read in this session]

```tsx
// src/app/layout.tsx — restructured body + layout
// Remove overflow-hidden from body/main
// Add HeartbeatProvider
// Add AppNav, MobileNav, MobileBottomNav
// pt-16 on desktop, pt-[calc(56px+48px)] on mobile for fixed nav offset
```

The font must also change from `Inter` to `Geist Mono` — the root layout currently imports `Inter` but the design system (`--font-sans`) already uses Geist Mono. The `(unauth)` layout uses `Sora` for the logo which is correct and can stay. [VERIFIED: src/app/layout.tsx, src/app/globals.css]

### Pattern 7: Inline Style for Section Backgrounds

**What:** Tailwind v4 does not support arbitrary hex colors via `bg-[#f8f6f2]` in all configurations, and the project's UI-SPEC explicitly calls for `style={{ backgroundColor: "#f8f6f2" }}`. This matches the GuestBanner precedent already in the codebase. [VERIFIED: src/components/guest-banner.tsx uses `style={{ backgroundColor: "#f1f5fb" }}`]

```tsx
// Solo section
<section
  aria-label="Solo games"
  style={{ backgroundColor: "#f8f6f2" }}
  className="w-full py-10"
>
// Multiplayer section
<section
  aria-label="Multiplayer games"
  style={{ backgroundColor: "#f1f5fb" }}
  className="w-full py-10"
>
```

### Anti-Patterns to Avoid

- **Using `useCallback` / `useMemo` in HeartbeatProvider or any new component:** React Compiler is active and will error or produce unexpected behavior. [VERIFIED: CLAUDE.md]
- **Accepting userId as a mutation argument:** `updatePresence` correctly derives identity server-side via `betterAuthComponent.getAuthUser(ctx)`. Never add a `userId` arg. [VERIFIED: convex/presence.ts]
- **Calling `ctx.db` inside a Convex action:** Actions don't have DB access. Cron must target `internalMutation`. [VERIFIED: guidelines.md]
- **Using `crons.hourly/daily/weekly`:** Only `crons.interval` and `crons.cron` are valid per guidelines. [VERIFIED: guidelines.md]
- **Using `.filter()` on queries with large tables and passing it to `withIndex`:** `.filter()` cannot be composed with `.withIndex()` at the same time in Convex. Use `.filter()` on the full table query (no index) or add a dedicated index. [VERIFIED: guidelines.md — "Do NOT use filter in queries, define an index instead"]
- **Placing `overflow-hidden` on body with scrollable home page:** The current layout wraps all content with overflow-hidden; this must be removed in Phase 2.
- **Rendering coin balance `⟟ 0` for guests:** The spec requires `CoinBalance` to return `null` for guests — no zero placeholder. [VERIFIED: CONTEXT.md D-02]
- **Hardcoding mobile body padding:** Use `pb-16` on page content wrapper (not just page.tsx) to ensure content isn't hidden under bottom nav — applies globally.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Avatar initials display | Custom image/initials logic | `Avatar`, `AvatarFallback` from `src/components/ui/avatar.tsx` | Already wraps Radix; handles fallback initials correctly |
| Dropdown menu | Custom dropdown | `DropdownMenu` from `src/components/ui/dropdown-menu.tsx` | Radix handles keyboard nav, focus trap, accessibility |
| Toast notifications | Custom toast | `toast.success/error` via sonner | Already installed, consistent UX |
| CSS class merging | Manual string concat | `cn()` from `src/lib/utils.ts` | Handles Tailwind class conflicts |
| Session detection | Manual cookie parsing | `authClient.useSession()` | Established pattern in guest-banner.tsx |
| Convex real-time | Polling / EventSource | `useQuery()` from `convex/react` | Built-in subscription, automatic reactivity |
| Guest detection | Custom auth check | `session.user.isAnonymous` via `inferAdditionalFields` | Already wired in authClient; guest-banner.tsx proves the pattern |

**Key insight:** The component library and auth patterns are fully established from Phase 1. Phase 2 wires them together — it is assembly work, not infrastructure work.

---

## Common Pitfalls

### Pitfall 1: `"offline"` Missing from presence Schema

**What goes wrong:** The cron job tries to write `status: "offline"` but the `presence` table's `status` validator is `v.union(v.literal("online"), v.literal("in-game"), v.literal("idle"))` — no `"offline"` literal. Convex will throw a runtime validation error on every cron execution.

**Why it happens:** Phase 1 implemented PRES-01 (heartbeat table + mutation). PRES-03 (cron) was Phase 2 work, so `"offline"` was not needed in Phase 1's schema.

**How to avoid:** Schema patch in Wave 0 (first task) — add `v.literal("offline")` to the `status` union in `convex/schema.ts` before any other work.

**Warning signs:** Cron logs show validation errors; presence rows never become offline after 5 minutes.

[VERIFIED: convex/schema.ts — "offline" not present in union]

### Pitfall 2: Root Layout `overflow-hidden` Blocks Page Scroll

**What goes wrong:** The current root layout wraps content with `overflow-hidden` on both `<body>` and the inner `<main>` flex div. The Phase 2 home page has two full-width sections taller than the viewport — this content will be clipped and unscrollable.

**Why it happens:** Phase 1 placeholder page was a centered "coming soon" screen that fit within viewport. Overflow-hidden was fine there.

**How to avoid:** In the layout restructure task, remove `overflow-hidden` from `<body>` and the main content wrapper. Replace with `min-h-svh` and normal document scroll. Fixed nav stays via `position: fixed`.

[VERIFIED: src/app/layout.tsx line 28 — `overflow-hidden` on body and inner div]

### Pitfall 3: Font Family Mismatch

**What goes wrong:** Root layout imports `Inter` and applies it as `--font-inter`. But `globals.css` sets `--font-sans: Geist Mono, ui-monospace, monospace`. All UI text renders in Geist Mono (correct), but the `inter.variable` CSS variable is applied to body for no reason. If any new component accidentally uses `font-sans` with a `font-inter` fallback, it breaks the mono aesthetic.

**How to avoid:** In the root layout restructure: remove `Inter` import entirely, load `Geist_Mono` (already used in design system) with the `--font-sans` variable, or simply rely on globals.css where `--font-sans` is already set correctly without a Next.js font variable.

[VERIFIED: src/app/layout.tsx (Inter import), src/app/globals.css (--font-sans already Geist Mono)]

### Pitfall 4: HeartbeatProvider Fires for Anonymous Users

**What goes wrong:** `HeartbeatProvider` runs on all pages including when a guest is browsing. Guest users call `updatePresence` mutation, which hits `betterAuthComponent.getAuthUser(ctx)` — this returns null for anonymous sessions, so the mutation silently no-ops. But it creates unnecessary Convex mutation invocations every 15 seconds.

**How to avoid:** Guard the `setInterval` with the `isAuthenticated` check (already shown in Pattern 4). The `useEffect` dependency on `isAuthenticated` ensures the interval only runs when a real user is logged in.

[VERIFIED: CONTEXT.md D-10 — "Guest users do NOT heartbeat"]

### Pitfall 5: `.filter()` Query Correctness — Convex Guidelines Conflict

**What goes wrong:** Convex guidelines say "Do NOT use filter in queries. Instead, define an index." But for Phase 2 presence queries, there is no `by_status` or `by_lastSeen` index. Using `.withIndex()` requires the index to exist in the schema.

**Resolution:** For Phase 2 at low user counts (dev/early), using `.filter()` without an index is acceptable. The guideline is a performance best practice for production scale, not a hard runtime error. The plan should include a comment noting this as a Phase 3+ optimization (add `by_status` or `by_lastSeen` index when user counts grow).

[ASSUMED — Convex does not throw errors for .filter() without index, it's a performance concern]

### Pitfall 6: Mobile Bottom Nav Hides Page Content

**What goes wrong:** Fixed `bottom-0` `h-16` bottom nav overlaps the last section of the home page on mobile. Content in the Solo/Multiplayer sections near the bottom of the page is permanently obscured.

**How to avoid:** Add `pb-16 md:pb-0` to the page content wrapper (or `<body>`) to push content above the bottom nav. The UI-SPEC specifies this at section 11: "Mobile body bottom padding: `pb-16`". [VERIFIED: UI-SPEC section 11]

### Pitfall 7: `env(safe-area-inset-bottom)` Requires `style` Not `className`

**What goes wrong:** `env(safe-area-inset-bottom)` is a CSS environment variable. Tailwind does not have a utility for it. Writing `className="pb-[env(safe-area-inset-bottom)]"` may not work reliably in Tailwind v4's JIT or may need specific configuration.

**How to avoid:** Use inline `style` for the safe area: `style={{ paddingBottom: "env(safe-area-inset-bottom)" }}`. This is what the UI-SPEC specifies. Combined with the `h-16` height class. [VERIFIED: UI-SPEC section 6 — Mobile Bottom Tab Bar spec]

---

## Code Examples

### Guest Detection Pattern (established in codebase)

```typescript
// Source: src/components/guest-banner.tsx (verified in this session)
const { data: session } = authClient.useSession();
const isAnonymous =
  (session?.user as { isAnonymous?: boolean } | undefined)?.isAnonymous === true;
// Authenticated non-guest = session?.user exists AND isAnonymous !== true
const isAuthenticated = session?.user !== undefined && !isAnonymous;
```

### Convex Index Query Pattern (verified guideline)

```typescript
// Source: convex/_generated/ai/guidelines.md
const appUser = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", authUser.email))
  .first(); // .unique() throws on multiple; .first() is safer
```

### Cron Registration (verified guideline)

```typescript
// Source: convex/_generated/ai/guidelines.md
import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();
crons.interval("mark stale presence offline", { minutes: 1 }, internal.crons.markStalePresence, {});
export default crons;
```

### Next.js App Router usePathname for Active Tab

```typescript
// Source: [ASSUMED — standard Next.js App Router pattern]
"use client";
import { usePathname } from "next/navigation";
const pathname = usePathname();
const isHomeActive = pathname === "/";
const isStoreActive = pathname.startsWith("/store");
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `React.memo` / `useMemo` / `useCallback` | React Compiler handles automatically | React 19 + Compiler | Never use manual memoization — compiler infers it |
| Tailwind arbitrary values for custom colors | Inline `style` for non-token hex values | Tailwind v4 design system | `#f8f6f2` / `#f1f5fb` use `style={{}}` per GuestBanner precedent |
| `ConvexProvider` | `ConvexBetterAuthProvider` | @convex-dev/better-auth integration | Already in place — auth tokens sent automatically |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `.filter()` without index does not throw a runtime error in Convex 1.36; it is a performance concern only | Pitfall 5, getOnlinePlayers pattern | If Convex throws on unindexed `.filter()`, a `by_status` index must be added to `presence` table in schema |
| A2 | `usePathname()` from `next/navigation` works correctly in `"use client"` components inside the root layout | Pattern 5 | Standard Next.js App Router pattern — very high confidence this is correct |
| A3 | Tailwind v4 `pb-[env(safe-area-inset-bottom)]` is unreliable; inline style is safer | Pitfall 7 | If arbitrary CSS env() works in Tailwind v4, inline style is still correct — no harm either way |
| A4 | Using `.filter()` with `.order("desc")` on presence table returns results ordered by `_creationTime` desc (no explicit `lastSeen` ordering) | getOnlinePlayers pattern | At Phase 2 scale acceptable; in Phase 3+ add `by_lastSeen` index for correct ordering |

---

## Open Questions

1. **Should `getBalance` use `.collect()` or will this be a performance issue at scale?**
   - What we know: coinLedger is append-only; balance = SUM of all rows for user. `.collect()` fetches all rows.
   - What's unclear: Phase 2 users have near-zero ledger entries; at Phase 5 (real payments) a user could have hundreds of rows.
   - Recommendation: Use `.collect()` in Phase 2. Add a denormalized `balance` field or pagination-based SUM approach in Phase 5. Document this as a known future optimization.

2. **Should `"offline"` presence rows be excluded from the `getOnlinePlayers` query explicitly?**
   - What we know: Query already filters to `online` | `in-game` — offline rows are implicitly excluded by the filter.
   - What's unclear: Whether `"offline"` rows accumulate (they do, until cron runs).
   - Recommendation: The query filter handles this correctly. No action needed beyond adding `"offline"` to the schema.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 2 has no new external dependencies. All tools and services (Convex, Next.js, pnpm) are already confirmed operational from Phase 1 completion.

---

## Project Constraints (from CLAUDE.md)

All directives that affect Phase 2 implementation:

| Directive | Impact on Phase 2 |
|-----------|-------------------|
| React Compiler active — NO `useMemo`, `useCallback`, `React.memo` | HeartbeatProvider and all new client components must not use these |
| `pnpm` as package manager | `pnpm install` for any additions (none needed) |
| Mobile-first: base styles mobile, `sm:`, `md:`, `lg:` for scaling | All new components start with mobile layout |
| Touch targets: `min-h-[44px] min-w-[44px]` (WCAG 2.5.5) | Nav buttons, filter chips, avatar, bottom nav tabs |
| Feedback: `toast.success/error` (Sonner) for mutation feedback | Sign-out failure → `toast.error("Sign out failed. Try again.")` |
| Data states: handle `undefined` (loading) and empty array | CoinBalance skeleton, PresencePanel skeleton + empty state |
| Images: `next/image` with `sizes` + `priority` | No images in Phase 2 (thumbnails are `bg-muted` placeholders) |
| Icons: import individually from lucide-react | `import { House } from "lucide-react"` not `import * as Icons` |
| Read `convex/_generated/ai/guidelines.md` before backend logic | Done — cron, query, mutation patterns all sourced from it |
| Standard container: `w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8` | Applied to section inner content and nav inner |
| Security headers configured in `next.config.ts` | No changes needed for Phase 2 |
| Environment variables in `.env.local` AND Convex | No new env vars in Phase 2 |

---

## Validation Architecture

Step 2.4: SKIPPED — `workflow.nyquist_validation` is explicitly `false` in `.planning/config.json`.

---

## Security Domain

Phase 2 adds no new authentication surfaces, payment flows, or privileged mutation arguments. All new Convex functions derive identity server-side via `betterAuthComponent.getAuthUser(ctx)`. No user-supplied identifiers accepted.

ASVS V5 (Input Validation): `updatePresence` uses `v.union(v.literal(...))` validators — only valid status values accepted. `getBalance` and `getOnlinePlayers` take no arguments.

No new security concerns introduced in Phase 2 beyond what Phase 1 established.

---

## Sources

### Primary (HIGH confidence)

- `convex/_generated/ai/guidelines.md` — cron syntax, mutation/query patterns, function validators, `.filter()` guidance, auth identity pattern — read in this session [VERIFIED]
- `convex/schema.ts` — presence table structure, coinLedger structure, confirmed `"offline"` absent from status union [VERIFIED]
- `convex/presence.ts` — `updatePresence` mutation confirmed implemented; `getOnlinePlayers` does not yet exist [VERIFIED]
- `src/components/guest-banner.tsx` — `isAnonymous` detection pattern, `authClient.useSession()` usage, `#f1f5fb` inline style precedent [VERIFIED]
- `src/app/layout.tsx` — current font/overflow structure; confirms restructuring needed [VERIFIED]
- `src/app/ConvexClientProvider.tsx` — `ConvexBetterAuthProvider` confirmed in use [VERIFIED]
- `src/lib/auth-client.ts` — `inferAdditionalFields`, `anonymousClient()` plugins confirmed [VERIFIED]
- `package.json` — all dependency versions verified [VERIFIED]
- `.planning/phases/02-home-presence/02-CONTEXT.md` — all locked decisions [VERIFIED]
- `.planning/phases/02-home-presence/02-UI-SPEC.md` — all layout specifications, component inventory, accessibility contract [VERIFIED]

### Secondary (MEDIUM confidence)

- `.planning/research/PITFALLS.md` — Phase 1 research on Convex patterns (append-only ledger, presence table separation)
- `.planning/STATE.md` — accumulated decisions from Phase 1

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all verified from package.json and codebase
- Architecture: HIGH — based on existing code patterns and Convex guidelines
- Convex cron pattern: HIGH — verified directly from guidelines.md
- Presence schema gap (missing "offline"): HIGH — verified directly from schema.ts
- Layout overflow issue: HIGH — verified directly from layout.tsx
- Font mismatch: HIGH — verified from layout.tsx and globals.css
- `.filter()` performance caveat: ASSUMED (A1)

**Research date:** 2026-05-01
**Valid until:** 2026-06-01 (stable stack; Convex 1.x API unlikely to break these patterns in 30 days)
