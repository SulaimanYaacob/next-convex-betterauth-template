# Phase 1: Foundation - Research

**Researched:** 2026-04-26
**Domain:** Convex schema design, Better Auth anonymous plugin, Next.js App Router auth pages
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** "Play as Guest" button lives on the sign-in page, below the sign-in form. Guest anonymous session created immediately via Better Auth anonymous plugin.
- **D-02:** After clicking "Play as Guest", user lands on `/` (home). Phase 1 home is a placeholder.
- **D-03:** Guest-to-account conversion prompt: persistent unobtrusive banner in the nav for guest users ("Create account to save progress"). Dismissible. Added as part of Phase 1 nav scaffolding.
- **D-04:** Minimal centered card layout on `#f8f6f2` neutral background. No decoration, no dark theme. Logo ("gami" wordmark) above the card.
- **D-05:** Card contains: logo/brand header, form fields, primary CTA button, secondary links.
- **D-06:** Errors appear inline under each field — triggered on submit and on blur.
- **D-07:** Server-side errors shown as inline errors, not toasts.
- **D-08:** No password strength indicator. Minimum password length enforced with a single inline error.
- **D-09:** Phase 1 creates ALL tables required for the full platform (schema lock): `users`, `coinLedger`, `presence`, `storeItems`, `ownedItems`, `equippedItems`, `games`.
- **D-10:** Remove `todos` table (scaffold leftover).
- **D-11:** `coinLedger` is append-only — signed amount entries (`userId`, `amount: number`, `reason: string`, `sessionId?: string`). Balance computed as SUM. No mutable balance field on `users`.
- **D-12:** `presence` is a separate table (NOT fields on `users`) — `userId`, `lastSeen: number`, `status: "online" | "in-game" | "idle"`. Heartbeat mutation must exist in Phase 1.

### Claude's Discretion

- Sign-up fields: email + password only at registration. Username optional/nullable in `users` table for future Phase 4 population without migration.

### Deferred Ideas (OUT OF SCOPE)

- OAuth sign-in UI (Google/GitHub) — AUTH-V2-01
- 2FA and magic link UI — AUTH-V2-02
- Password reset flow — defer to v2
- Avatar upload at sign-up — Phase 4
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| AUTH-01 | User can create account with email and password | Better Auth `emailAndPassword` already enabled in `src/lib/auth.ts`; sign-up page needed in `(unauth)/sign-up/` |
| AUTH-02 | User can sign in and session persists across browser refresh | Better Auth session cookies + Convex JWT; sign-in page needed in `(unauth)/sign-in/`; proxy.ts needs full protection logic |
| AUTH-03 | User can play as guest without registering | `anonymous()` plugin already in auth.ts; client needs `authClient.signIn.anonymous()` call |
| AUTH-04 | Guest user can convert to full account (keeps progress) | Better Auth `onLinkAccount` hook fires automatically on sign-up after anonymous; `onDeleteUser` must cascade-delete presence row |
| ECON-01 | Coin ledger is append-only with SUM-computed balance | New `coinLedger` table in schema; no mutable balance field anywhere |
| PRES-01 | Separate `presence` table; heartbeat mutation updates `lastSeen` every 15s | New `presence` table in schema; public `updatePresence` mutation in `convex/presence.ts` |
</phase_requirements>

---

## Summary

Phase 1 is almost entirely about two things: **locking the database schema for all 5 phases** and **wiring the auth UI** (sign-in, sign-up, guest flow, guest-to-account conversion). The majority of the auth infrastructure already exists in the codebase — Better Auth is configured with the `anonymous()` plugin, `emailAndPassword` is enabled, and the Convex component is registered. The core work is:

1. **Schema rewrite** — replace the scaffold (`users` + `todos`) with the full platform schema (7 tables with all required indexes).
2. **Auth pages** — create `(unauth)/sign-in/` and `(unauth)/sign-up/` with the exact UI specified in 01-UI-SPEC.md.
3. **Proxy hardening** — `src/proxy.ts` currently has no real protection logic (`getSessionCookie` is called but no redirect happens). It must be replaced with `getSession()` HTTP call per CLAUDE.md.
4. **users.ts mutation update** — `syncUserCreation` and `syncUserDeletion` are written for the old `todos`-based schema; they must be updated for the new schema.
5. **Presence mutation** — a `updatePresence` public mutation in `convex/presence.ts` (client will call it; Phase 2 wires the 15s interval).
6. **Home placeholder** — replace `src/app/page.tsx` with the Phase 1 stub + `<GuestBanner />`.

The anonymous-to-account conversion is handled automatically by Better Auth's `onLinkAccount` hook, which fires when an anonymous user calls `signUp.email()`. The app side needs to handle cascading the deletion of the old anonymous user's `presence` and any future data rows via `syncUserDeletion`.

**Primary recommendation:** Schema first, then users.ts, then proxy, then UI pages in order (sign-in, sign-up, home+banner). Each step is independent — no circular dependencies.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Schema definition | Database (Convex) | — | All table definitions live in `convex/schema.ts`; no frontend concern |
| Auth session management | API / Backend (Better Auth on Convex) | Frontend Server (proxy) | Session creation/validation is server-side; proxy reads session cookie to gate routes |
| Sign-in / Sign-up UI | Browser / Client | — | Client components using `authClient` hooks from better-auth/react |
| Guest session creation | Browser / Client → API | — | `authClient.signIn.anonymous()` is a client call that hits the Better Auth `/sign-in/anonymous` endpoint on Convex |
| Guest-to-account conversion | API / Backend (Better Auth onLinkAccount) | — | Conversion is server-side; client just calls `signUp.email()`; onLinkAccount hook migrates data |
| Route protection | Frontend Server (proxy.ts) | — | `src/proxy.ts` runs at the Next.js edge; redirects unauthenticated users |
| Coin ledger table | Database (Convex) | — | Schema-only in Phase 1; no mutations written until Phase 3 |
| Presence heartbeat mutation | API / Backend (Convex mutation) | — | Public mutation in `convex/presence.ts`; client calls it (Phase 2 wires the interval) |
| User creation sync | API / Backend (internalMutation) | — | `convex/users.ts` `syncUserCreation` triggered by Better Auth `databaseHooks.user.create.after` |

---

## Standard Stack

### Core (already installed — no new installs needed for Phase 1)

| Library | Version | Purpose | Status |
|---------|---------|---------|--------|
| `better-auth` | 1.6.9 | Auth framework with anonymous plugin | Installed [VERIFIED: package.json] |
| `@convex-dev/better-auth` | 0.12.0 | Convex adapter for Better Auth | Installed [VERIFIED: package.json] |
| `convex` | 1.36.1 | Real-time backend + schema | Installed [VERIFIED: package.json] |
| `next` | 16.2.4 | App Router, proxy.ts pattern | Installed [VERIFIED: package.json] |
| `react-hook-form` | 7.73.1 | Form state management | Installed [VERIFIED: package.json] |
| `@hookform/resolvers` | 5.2.2 | Zod resolver for react-hook-form | Installed [VERIFIED: package.json] |
| `zod` | 4.3.6 | Schema validation | Installed [VERIFIED: package.json] |
| `sonner` | 2.0.7 | Toast notifications (Toaster already in layout) | Installed [VERIFIED: package.json] |
| `lucide-react` | 1.11.0 | Icons (Loader2 spinner for loading state) | Installed [VERIFIED: package.json] |
| `next-themes` | 0.4.6 | Theme provider (already in root layout) | Installed [VERIFIED: package.json] |

### Google Font (needs adding)

| Font | Weight | Variable | Purpose |
|------|--------|----------|---------|
| Sora | 600 | `--font-sora` | Logo wordmark only — `next/font/google` |

**No new npm installs required for Phase 1.** Sora is loaded via `next/font/google` (no package needed).

### UI Components Already Available (shadcn New York style)

`Button`, `Input`, `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`, `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Label`, `Sonner`

[VERIFIED: src/components/ui/ directory listing]

---

## Architecture Patterns

### System Architecture Diagram

```
Browser                    Next.js Edge (proxy.ts)     Convex Backend
   |                               |                         |
   |-- GET /dashboard -----------> |                         |
   |                         getSessionCookie()              |
   |                         [no valid cookie]               |
   |<-- 302 /sign-in ------------ |                         |
   |                               |                         |
   |-- POST /api/auth/sign-in --> Next.js API route         |
   |                         convexBetterAuthNextJs()        |
   |                               |--- HTTP --> convex.site/api/auth/sign-in
   |                               |                   Better Auth handler
   |                               |                   betterAuthComponent.registerRoutes()
   |                               |                   databaseHooks.user.create.after
   |                               |                       ctx.runMutation(internal.users.syncUserCreation)
   |                               |                         ctx.db.insert("users", {...})
   |<-- Set-Cookie: session ------ |<--- response ----------|
   |                               |                         |
   |-- GET / ------------------> proxy.ts                   |
   |                         getSessionCookie() = valid      |
   |                         NextResponse.next()             |
   |<-- 200 (home page) --------- |                         |
   |                               |                         |
   |-- authClient.signIn.anonymous()                         |
   |                               |--- POST /api/auth/sign-in/anonymous
   |                               |                   anonymous() plugin
   |                               |                   generates temp email
   |                               |                   creates user (isAnonymous=true)
   |                               |                   databaseHooks fires -> syncUserCreation
   |<-- Set-Cookie: session ------ |<--- response ----------|
   |                               |                         |
   |-- (later) authClient.signUp.email()                     |
   |                               |--- POST /api/auth/sign-up/email
   |                               |                   anonymous plugin: onLinkAccount hook fires
   |                               |                   old anonymous user deleted
   |                               |                   databaseHooks.user.delete.after -> syncUserDeletion
   |<-- new session cookie ------- |<--- response ----------|
```

### Recommended Project Structure for Phase 1

```
src/app/
├── (unauth)/               # Public auth routes (proxy redirects auth'd users away)
│   ├── layout.tsx          # AuthLayout shell — forces light bg, no dark mode
│   ├── sign-in/
│   │   └── page.tsx        # Sign-in form with guest link
│   └── sign-up/
│       └── page.tsx        # Sign-up form with guest link
├── (auth)/                 # Protected routes (proxy redirects unauth'd users away)
│   ├── dashboard/
│   │   └── page.tsx        # (existing scaffold — leave as-is)
│   └── settings/
│       └── page.tsx        # (existing scaffold — leave as-is)
├── layout.tsx              # Root layout — add metadata update, keep ThemeProvider
├── page.tsx                # Home placeholder — replace content, add GuestBanner
└── api/auth/[...all]/route.ts  # (existing — no changes)

src/components/
├── ui/                     # (existing shadcn components — no changes)
├── gami-logo.tsx           # NEW: GamiLogo component (Sora font + SVG mark)
└── guest-banner.tsx        # NEW: GuestConversionBanner component

convex/
├── schema.ts               # REWRITE: full platform schema (7 tables)
├── users.ts                # UPDATE: syncUserCreation/syncUserDeletion for new schema
├── presence.ts             # NEW: updatePresence internalMutation + public heartbeat
├── auth.ts                 # UPDATE: getCurrentUser to use users.by_userId index
└── auth.config.ts          # (no changes)
```

### Pattern 1: Schema — Complete Platform Lock

All 7 tables with indexes. Written once, never migrated.

```typescript
// Source: convex/schema.ts — rewrite
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Application users — merged with Better Auth user via getCurrentUser
  users: defineTable({
    email: v.string(),
    userId: v.optional(v.string()),  // Better Auth user ID (string, not Id)
    username: v.optional(v.string()), // nullable — populated in Phase 4
    // Add other app-level fields here as phases progress
  })
    .index("by_email", ["email"])
    .index("by_userId", ["userId"]),

  // Append-only coin ledger — ECON-01; balance = SUM of amount
  coinLedger: defineTable({
    userId: v.id("users"),
    amount: v.number(),           // signed: positive = credit, negative = debit
    reason: v.string(),           // e.g. "game_earn", "purchase", "stripe_topup"
    sessionId: v.optional(v.string()), // game session reference for ECON-02
  }).index("by_userId", ["userId"]),

  // Separate presence table — PRES-01; heartbeat writes never touch users doc
  presence: defineTable({
    userId: v.id("users"),
    lastSeen: v.number(),         // Unix ms timestamp
    status: v.union(
      v.literal("online"),
      v.literal("in-game"),
      v.literal("idle"),
    ),
  }).index("by_userId", ["userId"]),

  // Store catalog — populated in Phase 4
  storeItems: defineTable({
    slug: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("cursor_skin"),
      v.literal("cursor_trail"),
      v.literal("ui_theme"),
    ),
    price: v.number(),            // coin price
    rarity: v.union(
      v.literal("common"),
      v.literal("rare"),
      v.literal("epic"),
      v.literal("legendary"),
    ),
    previewUrl: v.optional(v.string()),
    earnedOnly: v.boolean(),      // true = not purchasable with coins
  }).index("by_slug", ["slug"]).index("by_type", ["type"]),

  // Items owned by users — Phase 4
  ownedItems: defineTable({
    userId: v.id("users"),
    itemId: v.id("storeItems"),
    acquiredAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_itemId", ["userId", "itemId"]),

  // Currently equipped cosmetics per user — Phase 4
  equippedItems: defineTable({
    userId: v.id("users"),
    slot: v.union(
      v.literal("cursor_skin"),
      v.literal("cursor_trail"),
      v.literal("ui_theme"),
    ),
    itemId: v.id("storeItems"),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_slot", ["userId", "slot"]),

  // Game sessions — Phase 3
  games: defineTable({
    userId: v.id("users"),
    gameId: v.string(),           // identifier for the game type
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    scoreEvent: v.optional(v.any()), // raw postMessage payload from game
    coinsAwarded: v.optional(v.number()),
    sessionCap: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_gameId", ["userId", "gameId"]),
});
```

**Critical index naming convention** (from Convex guidelines): always include all index fields in the name.
- `by_email` (not `email`), `by_userId` (not `userId`), `by_userId_and_slot`, etc.
[VERIFIED: convex/_generated/ai/guidelines.md — "Always include all index fields in the index name"]

### Pattern 2: users.ts — Sync Hooks for New Schema

`syncUserCreation` must be updated to insert the full new `users` shape (email + optional userId + optional username). The `todos`-based deletion cascade must be replaced.

```typescript
// convex/users.ts
export const syncUserCreation = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // Idempotent: check if user already exists before inserting
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!existing) {
      await ctx.db.insert("users", {
        email: args.email,
        // username and userId are optional — omit at creation
      });
    }
  },
});

export const syncUserDeletion = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const appUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    if (!appUser) return;

    // Cascade: presence
    const presenceRow = await ctx.db
      .query("presence")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .first();
    if (presenceRow) await ctx.db.delete(presenceRow._id);

    // Cascade: coinLedger (delete all entries)
    const ledgerRows = await ctx.db
      .query("coinLedger")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(100);
    for (const row of ledgerRows) await ctx.db.delete(row._id);

    // Cascade: ownedItems
    const owned = await ctx.db
      .query("ownedItems")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(100);
    for (const row of owned) await ctx.db.delete(row._id);

    // Cascade: equippedItems
    const equipped = await ctx.db
      .query("equippedItems")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(100);
    for (const row of equipped) await ctx.db.delete(row._id);

    // Cascade: games
    const games = await ctx.db
      .query("games")
      .withIndex("by_userId", (q) => q.eq("userId", appUser._id))
      .take(100);
    for (const row of games) await ctx.db.delete(row._id);

    // Delete the user record itself
    await ctx.db.delete(appUser._id);
  },
});
```

Note: For large accounts, the `.take(100)` approach is intentional — mutations have document limits. If > 100 rows exist, the first 100 are deleted. For Phase 1 (new users), this is safe. A scheduled continuation pattern can be added in Phase 5 if real-money purchases create many ledger rows.

### Pattern 3: Proxy — Real Protection Logic

The current `src/proxy.ts` calls `getSessionCookie()` but **never redirects**. It must implement actual route protection.

```typescript
// src/proxy.ts
import { getSession } from "@better-auth/client";  // NOT getSessionCookie
// CLAUDE.md: "proxy.ts uses getSession() (calls /api/auth/get-session) — more reliable"
import { NextRequest, NextResponse } from "next/server";

const authRoutes = ["/sign-in", "/sign-up"];
const protectedRoutes = ["/dashboard", "/settings"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Session check via HTTP (reliable — parses JWT server-side)
  const session = await getSession({
    fetchOptions: { headers: { cookie: request.headers.get("cookie") ?? "" } },
    baseURL: `${request.nextUrl.protocol}//${request.nextUrl.host}`,
  });

  const isAuthenticated = !!session?.data?.session;

  // Authenticated users should not see auth pages
  if (isAuthenticated && authRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unauthenticated users cannot access protected routes
  if (!isAuthenticated && protectedRoutes.some(r => pathname.startsWith(r))) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
};
```

**Important:** Anonymous (guest) sessions ARE valid sessions — `isAuthenticated` will be `true` for guest users. The home page `/` is accessible to both guests and registered users. Only `/dashboard` and `/settings` are protected.

### Pattern 4: Anonymous Sign-In — Client Side

```typescript
// In sign-in page component
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

async function handleGuestSignIn() {
  setGuestLoading(true);
  const result = await authClient.signIn.anonymous();
  if (result.error) {
    form.setError("root", { message: "Guest sign-in failed. Please try again." });
  } else {
    router.push("/");
  }
  setGuestLoading(false);
}
```

[VERIFIED: better-auth anonymous plugin type definitions at node_modules/better-auth/dist/plugins/anonymous/index.d.mts — `signInAnonymous` endpoint exists]

### Pattern 5: Guest-to-Account Conversion — onLinkAccount Hook

The `onLinkAccount` hook in `src/lib/auth.ts` fires automatically when an anonymous user calls `signUp.email()` or `signIn.social()`. No client-side special handling needed — the user just fills out the sign-up form normally.

```typescript
// In src/lib/auth.ts — add to anonymous() plugin config
anonymous({
  onLinkAccount: async ({ anonymousUser, newUser }) => {
    // anonymousUser.user.id = Better Auth ID of the old anonymous user
    // newUser.user.id = Better Auth ID of the new registered user
    // The anonymous user is deleted AFTER this hook fires (by default)
    // Any app-level data migration from old user to new user happens here
    // For Phase 1: no game data to migrate (Phase 3 feature)
    // The syncUserDeletion hook handles cleanup of the app users table row
  },
})
```

[VERIFIED: AnonymousOptions.onLinkAccount type signature at node_modules/better-auth/dist/plugins/anonymous/types.d.mts]

**Key behavior:** The `databaseHooks.user.delete.after` callback (which calls `syncUserDeletion`) fires when the anonymous user record is deleted by Better Auth after `onLinkAccount`. This cascades the deletion of the app `users` row and all related rows. No separate migration step needed in Phase 1.

### Pattern 6: Presence Mutation — Phase 1 Table + Mutation, Phase 2 Client Wiring

```typescript
// convex/presence.ts
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";

export const updatePresence = mutation({
  args: {
    status: v.union(
      v.literal("online"),
      v.literal("in-game"),
      v.literal("idle"),
    ),
  },
  handler: async (ctx, args) => {
    const authUser = await betterAuthComponent.getAuthUser(ctx);
    if (!authUser) return; // unauthenticated — silently ignore

    // Look up app user by email
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
      await ctx.db.patch(existing._id, {
        lastSeen: Date.now(),
        status: args.status,
      });
    } else {
      await ctx.db.insert("presence", {
        userId: appUser._id,
        lastSeen: Date.now(),
        status: args.status,
      });
    }
  },
});
```

### Pattern 7: Auth Page Layout — Light-Only, Dark Mode Suppressed

The `(unauth)/layout.tsx` must prevent the `.dark` class from the root `<html>` element from affecting auth pages. The design spec (D-04) mandates light-only.

```tsx
// src/app/(unauth)/layout.tsx
import { Sora } from "next/font/google";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

export default function UnAuthLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-theme="light" forces light mode regardless of system preference
    // The div creates a new stacking context that overrides .dark inherited from <html>
    <div
      className={`${sora.variable} min-h-svh`}
      style={{ backgroundColor: "#f8f6f2", colorScheme: "light" }}
      data-theme="light"
    >
      {children}
    </div>
  );
}
```

Note: The `ThemeProvider` in root layout applies `class` attribute to `<html>`. Auth pages need isolation. Using `colorScheme: "light"` on the wrapper div and explicit `bg-white` on the card provides reliable light-mode isolation without removing the `ThemeProvider`.

### Anti-Patterns to Avoid

- **Never use `filter()` in Convex queries** — use `withIndex()` instead. [VERIFIED: convex/_generated/ai/guidelines.md]
- **Never use `.collect()` for large or unbounded result sets** — use `.take(n)`. [VERIFIED: convex/_generated/ai/guidelines.md]
- **Never put status/lastSeen on the `users` document** — use the `presence` table. [VERIFIED: STATE.md architecture constraints]
- **Never accept userId as a mutation argument for authorization** — derive from `betterAuthComponent.getAuthUser(ctx)`. [VERIFIED: convex/_generated/ai/guidelines.md]
- **Never add `useMemo`/`useCallback`/`React.memo` to auth page components** — React Compiler is active. [VERIFIED: CLAUDE.md, next.config.ts `reactCompiler: true`]
- **Never use `getSessionCookie()` alone for session validation in proxy** — it only parses local cookie without server verification. Use `getSession()` HTTP call. [VERIFIED: CLAUDE.md authentication concepts]
- **Never store a mutable coin balance field on `users`** — ECON-01 requires append-only ledger. [VERIFIED: STATE.md, CONTEXT.md D-11]
- **Never expose coin-award mutations via public `api.*`** — only `internalMutation`. [VERIFIED: STATE.md key decisions]

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Session validation in proxy | Custom JWT parsing | `getSession()` from `@better-auth/client` | Handles token refresh, clock skew, signature verification |
| Form validation | Custom validation loop | `zod` + `react-hook-form` + `@hookform/resolvers` | Already installed; `form.setError()` handles server errors inline |
| Anonymous session creation | Custom UUID + cookie | `authClient.signIn.anonymous()` | Plugin handles user creation, session token, cookie setting atomically |
| Guest-to-account migration | Custom merge logic | Better Auth `onLinkAccount` hook | Fires automatically; hook receives both user objects for data migration |
| Loading spinner | Custom CSS animation | `lucide-react` `Loader2` + `animate-spin` | Consistent with rest of app; already imported via Lucide |
| Toast notifications | Custom toast system | `sonner` (`toast.success/error`) | Already in layout via `<Toaster />`; though Phase 1 auth errors are inline, not toasts |

---

## Common Pitfalls

### Pitfall 1: onCreateUser fires for anonymous users too

**What goes wrong:** The `databaseHooks.user.create.after` callback in `src/lib/auth.ts` fires when `signIn.anonymous()` is called. `syncUserCreation` inserts a row into `users`. If the anonymous user later converts to a real account, `databaseHooks.user.create.after` fires AGAIN for the new user — creating a duplicate `users` row.

**Why it happens:** Better Auth creates a new user record for the registered account, even when converting from anonymous. The old anonymous user is deleted via `databaseHooks.user.delete.after`.

**How to avoid:** Make `syncUserCreation` idempotent — check if a row with the given email already exists before inserting. If converting from anonymous, the new email will be different from the temp email, so no conflict. But if the same email is used for both anonymous temp email and registration (edge case — impossible since anonymous emails are generated), the check prevents duplication.

**Warning signs:** Duplicate rows in `users` table for same email; `getCurrentUser` returning wrong data.

### Pitfall 2: Proxy using getSessionCookie() without actual redirect

**What goes wrong:** The current `src/proxy.ts` calls `getSessionCookie()` but **never returns a redirect response**. Protected routes are completely open.

**Why it happens:** The scaffold was a stub that was never completed.

**How to avoid:** Replace with the `getSession()` HTTP call pattern per CLAUDE.md. The HTTP call is slightly slower but is the correct approach — `getSessionCookie()` only parses the local cookie value without verifying the JWT signature server-side.

**Warning signs:** Unauthenticated users can access `/dashboard` directly.

### Pitfall 3: Index naming convention mismatch

**What goes wrong:** Convex's generated types expect index names to match the field list. If the schema uses `index("email", ["email"])` (old scaffold pattern) but code queries `withIndex("by_email", ...)`, the TypeScript types will error.

**Why it happens:** The existing `convex/users.ts` and `convex/auth.ts` query with `withIndex("email", ...)` matching the old schema's `index("email", ...)` name. The new schema should use `by_email` per Convex guidelines, requiring all call sites to be updated simultaneously.

**How to avoid:** When rewriting schema, update ALL call sites in the same wave. Search for `withIndex("email"` and `withIndex("userId"` and update to `withIndex("by_email"` and `withIndex("by_userId"`.

**Warning signs:** TypeScript compile errors on `withIndex` calls after schema change.

### Pitfall 4: Dark mode bleeds into auth pages

**What goes wrong:** The `ThemeProvider` in root layout applies `class="dark"` to `<html>`. The `(unauth)/layout.tsx` wraps inside this — shadcn CSS variables resolve to dark values.

**Why it happens:** Tailwind v4 uses `@custom-variant dark (&:is(.dark *))` — any element inside an ancestor with `.dark` class gets dark styles.

**How to avoid:** The `(unauth)/layout.tsx` must use `data-theme="light"` and explicit inline style `colorScheme: "light"`, and auth page backgrounds must use inline hex values (not `bg-background` which would resolve to dark). The `AuthCard` must use explicit `bg-white` not `bg-card`.

**Warning signs:** Auth pages look dark on system dark mode.

### Pitfall 5: deleteUser cascade misses new tables

**What goes wrong:** The current `syncUserDeletion` only cascades into `todos`. After the schema rewrite, it still only deletes todos (which no longer exist) and leaves `presence`, `coinLedger`, `ownedItems`, `equippedItems`, `games` rows orphaned.

**Why it happens:** The `databaseHooks.user.delete.after` callback in `src/lib/auth.ts` calls `ctx.runMutation(internal.users.syncUserDeletion, ...)` — that mutation must be updated along with the schema.

**How to avoid:** Update `syncUserDeletion` in the same task as the schema rewrite. Cascade into all 5 related tables.

**Warning signs:** Orphaned rows in Convex data browser after user deletion.

### Pitfall 6: `getCurrentUser` query uses wrong index name

**What goes wrong:** After renaming `index("email", ["email"])` to `index("by_email", ["email"])`, the `getCurrentUser` query in `convex/auth.ts` still uses `.withIndex("email", ...)` — TypeScript error, runtime failure.

**How to avoid:** Update `getCurrentUser` in `convex/auth.ts` to use `.withIndex("by_email", ...)` in the same task as the schema rewrite.

---

## Code Examples

### GamiLogo Component

```tsx
// src/components/gami-logo.tsx
// Source: 01-UI-SPEC.md §5.1

interface GamiLogoProps {
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: { mark: 24, wordmark: "text-xl" },
  md: { mark: 32, wordmark: "text-3xl" },
  lg: { mark: 40, wordmark: "text-4xl" },
};

export function GamiLogo({ size = "md" }: GamiLogoProps) {
  const { mark, wordmark } = sizes[size];
  const sq = mark * 0.625; // 20px at md

  return (
    <div className="flex items-center gap-2">
      <svg
        width={mark}
        height={mark}
        viewBox="0 0 32 32"
        aria-hidden="true"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Back square — 40% opacity */}
        <rect
          x="6" y="6" width={sq} height={sq} rx="4"
          fill="var(--primary)"
          fillOpacity="0.4"
        />
        {/* Front square — full opacity, offset */}
        <rect
          x="12" y="12" width={sq} height={sq} rx="4"
          fill="var(--primary)"
        />
      </svg>
      <span
        className={`${wordmark} font-semibold text-foreground`}
        style={{ fontFamily: "var(--font-sora), sans-serif" }}
      >
        gami
      </span>
    </div>
  );
}
```

### Sign-in Form — Zod Schema and Error Handling

```typescript
// Source: 01-UI-SPEC.md §6 + CONTEXT.md D-06, D-07
import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const signUpSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Server error mapping in sign-in submit handler
async function onSubmit(values: z.infer<typeof signInSchema>) {
  const result = await authClient.signIn.email({
    email: values.email,
    password: values.password,
  });

  if (result.error) {
    // Map Better Auth error codes to inline field errors
    const code = result.error.code;
    if (code === "INVALID_EMAIL_OR_PASSWORD" || code === "USER_NOT_FOUND") {
      form.setError("password", { message: "Incorrect email or password" });
    } else {
      form.setError("root", { message: "Something went wrong. Please try again." });
    }
    return;
  }
  router.push("/");
}
```

### GuestBanner — localStorage Dismissal

```typescript
// Source: 01-UI-SPEC.md §4.4 + §5.4
"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { X } from "lucide-react";

const DISMISS_KEY = "gami_banner_dismissed";

export function GuestBanner() {
  const { data: session } = authClient.useSession();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISS_KEY) === "true") {
      setDismissed(true);
    }
  }, []);

  const isGuest = session?.user?.isAnonymous === true;

  if (!isGuest || dismissed) return null;

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, "true");
    setDismissed(true);
  }

  return (
    <div
      className="w-full sticky top-0 z-40 border-b"
      style={{
        backgroundColor: "#f1f5fb",
        borderColor: "rgba(59,130,246,0.15)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-10">
        <p className="text-xs text-muted-foreground">
          Create an account to save your progress
        </p>
        <div className="flex items-center gap-2">
          <Link
            href="/sign-up"
            className="text-xs font-semibold text-primary hover:underline min-h-[44px] inline-flex items-center"
          >
            Create account
          </Link>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss banner"
            className="size-[44px] inline-flex items-center justify-center rounded-md hover:bg-black/5"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| `middleware.ts` | `src/proxy.ts` (Next.js 16 convention) | File must be named `proxy.ts`, not `middleware.ts` |
| `useMemo`/`useCallback` for perf | React Compiler (auto) | Never add manual memoization; `reactCompiler: true` in next.config.ts |
| Coin balance as mutable field on user | Append-only ledger with SUM | Audit trail, no race conditions on concurrent coin awards |
| Presence fields on users doc | Separate `presence` table | High-churn writes don't invalidate user doc subscribers |
| `context.auth.getUserIdentity()` directly | `betterAuthComponent.getAuthUser(ctx)` | Better Auth uses its own session mechanism, not Convex's built-in JWT |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | `getSession()` from `@better-auth/client` is the correct import for server-side session checking in proxy.ts | Pattern 3: Proxy | Proxy would fail to compile; need to verify exact import path from `better-auth` or `@better-auth/client` for Next.js middleware context |
| A2 | The anonymous user's `databaseHooks.user.delete.after` fires when the anonymous account is deleted during conversion | Patterns 2 and 5 | If it doesn't fire, the anonymous `users` row is orphaned; may need to use `onLinkAccount` for explicit cleanup instead |
| A3 | `session.user.isAnonymous` is available via `authClient.useSession()` in client components | GuestBanner pattern | If the field isn't exposed through the session hook, guest detection breaks; may need a separate Convex query |

---

## Open Questions

1. **Proxy import path for `getSession()`**
   - What we know: CLAUDE.md says proxy.ts should use `getSession()` via `betterFetch`. The exact import path in a Next.js 16 edge-runtime context is not confirmed.
   - What's unclear: Is it `import { getSession } from "better-auth/client"` or a different path? Does it work in the Next.js edge runtime (no Node.js built-ins)?
   - Recommendation: Check `node_modules/better-auth/dist/client/index.d.mts` for `getSession` export, or use `getSessionCookie()` as a fallback (less secure, but works at edge; session signature not verified locally).

2. **isAnonymous field in useSession() response**
   - What we know: The anonymous plugin adds `isAnonymous: boolean` to the user schema [VERIFIED: types.d.mts]. The `inferAdditionalFields<typeof authWithoutCtx>()` plugin is in `auth-client.ts`.
   - What's unclear: Whether `isAnonymous` is included in the session response returned by `authClient.useSession()` in the client.
   - Recommendation: Test with `console.log(session?.user)` during implementation; if absent, use a Convex query `api.auth.getCurrentUser` which merges Better Auth user data (which includes `isAnonymous`).

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Convex dev server | Schema deployment | Must be running | 1.36.1 | None — required |
| Node.js | pnpm scripts | Assumed present | — | None |
| `next/font/google` (Sora) | GamiLogo wordmark | Internet required at build | CDN | Use system `sans-serif` as fallback font stack |

No external services required for Phase 1 (email verification is disabled, `requireEmailVerification: false` in auth.ts [VERIFIED: src/lib/auth.ts line 57]).

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | Yes | Better Auth email+password; min 8 char enforced (zod + Better Auth server-side) |
| V3 Session Management | Yes | Better Auth session cookies; HttpOnly by default |
| V4 Access Control | Yes | `proxy.ts` enforces route-level auth; anonymous sessions get access to `/` only |
| V5 Input Validation | Yes | zod schemas on all form fields; server-side validation via Better Auth |
| V6 Cryptography | Yes | Better Auth uses RS256 JWT; never hand-rolled |

### Known Threat Patterns for this Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Session fixation | Elevation of privilege | Better Auth regenerates session token on sign-in (default behavior) |
| CSRF on auth endpoints | Tampering | `disableCSRFCheck: false` in auth options [VERIFIED: src/lib/auth.ts line 38] |
| Anonymous session abuse | Denial of service | Each `signIn.anonymous()` creates a new user + session — rate limiting is a v2 concern; not critical for Phase 1 with no real economy yet |
| Proxy bypass (static assets) | Information disclosure | Matcher pattern `/((?!.*\\..*|_next|api/auth).*)` correctly excludes static assets [VERIFIED: src/proxy.ts] |
| Server error message leakage | Information disclosure | Map all server errors to generic user-facing messages (D-07); never surface raw Better Auth error codes to the client UI |

---

## Sources

### Primary (HIGH confidence)
- `convex/_generated/ai/guidelines.md` — Convex schema, index naming, query patterns, mutation limits, function types
- `src/lib/auth.ts` — Existing Better Auth configuration, plugins installed, databaseHooks structure
- `src/lib/auth-client.ts` — Client plugins (anonymousClient confirmed)
- `node_modules/better-auth/dist/plugins/anonymous/types.d.mts` — AnonymousOptions.onLinkAccount type signature, UserWithAnonymous.isAnonymous field
- `node_modules/better-auth/dist/plugins/anonymous/index.d.mts` — Plugin schema (isAnonymous field on user), error codes
- `package.json` — All installed package versions verified
- `01-UI-SPEC.md` — Component contracts, interaction patterns, copy, accessibility requirements
- `CONTEXT.md` — All locked decisions (D-01 through D-12)

### Secondary (MEDIUM confidence)
- [better-auth.com/docs/plugins/anonymous](https://www.better-auth.com/docs/plugins/anonymous) — onLinkAccount hook behavior, disableDeleteAnonymousUser option
- `CLAUDE.md` — Architecture patterns, proxy.ts session checking approach, React Compiler rules

### Tertiary (LOW confidence)
- A1 (proxy `getSession()` import) — unverified; flagged in Assumptions Log
- A3 (`isAnonymous` in useSession response) — inferred from plugin schema; not directly tested

---

## Metadata

**Confidence breakdown:**
- Schema design: HIGH — all table structures derived from locked decisions (D-09 through D-12) and Convex guidelines
- Auth page patterns: HIGH — Better Auth plugins verified in installed packages; auth.ts already configured
- Anonymous flow: HIGH — type definitions verified in node_modules; onLinkAccount hook signature confirmed
- Proxy implementation: MEDIUM — pattern from CLAUDE.md; exact getSession() import path not verified (A1)
- Guest detection (isAnonymous in session): MEDIUM — field exists in schema; client exposure not verified (A3)

**Research date:** 2026-04-26
**Valid until:** 2026-05-26 (stable stack — Better Auth 1.6.x, Convex 1.36.x, Next.js 16.2.x are all locked in package.json)
