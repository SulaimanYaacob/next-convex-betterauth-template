# Phase 1: Foundation - Pattern Map

**Mapped:** 2026-04-26
**Files analyzed:** 10 new/modified files
**Analogs found:** 8 / 10

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `convex/schema.ts` | schema/config | CRUD | `convex/schema.ts` (current) | exact-rewrite |
| `convex/users.ts` | service/mutation | CRUD | `convex/users.ts` (current) | exact-update |
| `convex/auth.ts` | service/query | request-response | `convex/auth.ts` (current) | exact-update |
| `convex/presence.ts` | service/mutation | CRUD | `convex/users.ts` | role-match |
| `src/proxy.ts` | middleware | request-response | `src/proxy.ts` (current) | exact-rewrite |
| `src/lib/auth.ts` | config/service | event-driven | `src/lib/auth.ts` (current) | exact-update |
| `src/app/(unauth)/layout.tsx` | layout/component | request-response | `src/app/layout.tsx` | role-match |
| `src/app/(unauth)/sign-in/page.tsx` | component | request-response | `src/components/client.tsx` | partial |
| `src/app/(unauth)/sign-up/page.tsx` | component | request-response | `src/components/client.tsx` | partial |
| `src/components/gami-logo.tsx` | component | — | none | no-analog |
| `src/components/guest-banner.tsx` | component | event-driven | `src/components/footer.tsx` | partial |
| `src/app/page.tsx` | component | request-response | `src/app/page.tsx` (current) | exact-rewrite |

---

## Pattern Assignments

### `convex/schema.ts` (schema/config, CRUD)

**Analog:** `convex/schema.ts` (current — lines 1–20)

**Current imports pattern** (lines 1–3):
```typescript
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
```

**Current table definition pattern** (lines 9–19):
```typescript
export default defineSchema({
  users: defineTable({
    email: v.string(),
  }).index("email", ["email"]),

  todos: defineTable({
    text: v.string(),
    completed: v.boolean(),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("userId", ["userId"]),
});
```

**Critical change — index naming:** The new schema MUST rename all indexes to the `by_` prefix convention required by Convex guidelines. Old names (`"email"`, `"userId"`) must become `"by_email"`, `"by_userId"`, `"by_userId_and_slot"`, etc. Every `.withIndex()` call site must be updated in the same pass.

**New schema shape to produce** (from RESEARCH.md Pattern 1):
- 7 tables: `users`, `coinLedger`, `presence`, `storeItems`, `ownedItems`, `equippedItems`, `games`
- Remove `todos` entirely
- `users` adds `userId?: string` and `username?: string` optional fields
- `coinLedger`: append-only (`userId`, `amount`, `reason`, `sessionId?`)
- `presence`: heartbeat table (`userId`, `lastSeen`, `status` union)
- `storeItems`: catalog (`slug`, `name`, `type` union, `price`, `rarity` union, `previewUrl?`, `earnedOnly`)
- `ownedItems`: join table (`userId`, `itemId`, `acquiredAt`)
- `equippedItems`: slot table (`userId`, `slot` union, `itemId`)
- `games`: session log (`userId`, `gameId`, `startedAt`, `endedAt?`, `scoreEvent?`, `coinsAwarded?`, `sessionCap?`)

---

### `convex/users.ts` (service/mutation, CRUD)

**Analog:** `convex/users.ts` (current — lines 1–34, full file)

**Current imports pattern** (lines 1–4):
```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { asyncMap } from "convex-helpers";
import { Id } from "./_generated/dataModel";
```

**Current syncUserCreation pattern** (lines 6–13):
```typescript
export const syncUserCreation = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("users", {
      email: args.email,
    });
  },
});
```

**Required change — idempotency guard:** The new `syncUserCreation` must check for an existing row before inserting (anonymous-to-account conversion fires `create` twice for different emails, but the general guard prevents any edge-case duplicate):
```typescript
const existing = await ctx.db
  .query("users")
  .withIndex("by_email", (q) => q.eq("email", args.email))
  .first();
if (!existing) {
  await ctx.db.insert("users", { email: args.email });
}
```

**Current syncUserDeletion pattern** (lines 15–34):
```typescript
export const syncUserDeletion = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", args.email))  // rename to by_email
      .first();

    if (appUser) {
      const todos = await ctx.db
        .query("todos")                                        // replace with all 5 new tables
        .withIndex("userId", (q) => q.eq("userId", appUser._id))
        .collect();                                            // replace with .take(100)
      await asyncMap(todos, async (todo) => {
        await ctx.db.delete(todo._id);
      });
      await ctx.db.delete(appUser._id);
    }
  },
});
```

**Required change — cascade to new tables:** Replace the `todos` cascade with cascades into `presence`, `coinLedger`, `ownedItems`, `equippedItems`, `games`. Use `.take(100)` (not `.collect()`) for all related-row queries. Use `for...of` loop (not `asyncMap`) for deletion — simpler and no extra import needed if removing the `asyncMap` dependency.

---

### `convex/auth.ts` (service/query, request-response)

**Analog:** `convex/auth.ts` (current — lines 1–49, full file)

**Current imports pattern** (lines 1–5):
```typescript
import { createClient } from "@convex-dev/better-auth";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { DataModel, Id } from "./_generated/dataModel";
import { asyncMap } from "convex-helpers";
```

**Current betterAuthComponent setup** (lines 7–9):
```typescript
export const betterAuthComponent = createClient<DataModel>(
  components.betterAuth
);
```

**Current getCurrentUser pattern** (lines 13–48):
```typescript
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    let betterAuthUser;
    try {
      betterAuthUser = await betterAuthComponent.getAuthUser(ctx);
    } catch {
      return null;
    }
    if (!betterAuthUser) return null;

    const appUser = await ctx.db
      .query("users")
      .withIndex("email", (q) => q.eq("email", betterAuthUser.email))  // rename to by_email
      .first();

    if (!appUser) {
      console.warn(`No app user found for email: ${betterAuthUser.email}`);
      return betterAuthUser;
    }
    return { ...appUser, ...betterAuthUser };
  },
});
```

**Required change — index rename only:** Change `.withIndex("email", ...)` to `.withIndex("by_email", ...)` to match the new schema index name. The merge pattern (`...appUser, ...betterAuthUser`) stays identical.

---

### `convex/presence.ts` (service/mutation, CRUD)

**Analog:** `convex/users.ts` (lines 6–13 — same `internalMutation` → `mutation` structure)

**Imports pattern** — copy from `convex/users.ts` and add betterAuthComponent:
```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { betterAuthComponent } from "./auth";
```

**Core mutation pattern** — upsert via index lookup (same pattern as syncUserCreation's idempotency check, extended to patch-or-insert):
```typescript
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
    if (!authUser) return;  // unauthenticated — silently ignore

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
      await ctx.db.insert("presence", {
        userId: appUser._id,
        lastSeen: Date.now(),
        status: args.status,
      });
    }
  },
});
```

**Auth pattern:** Always derive identity from `betterAuthComponent.getAuthUser(ctx)` — never accept `userId` as a mutation argument. This is the same pattern used in `getCurrentUser` in `convex/auth.ts`.

---

### `src/proxy.ts` (middleware, request-response)

**Analog:** `src/proxy.ts` (current — lines 1–16, full file)

**Current structure** (lines 1–16):
```typescript
import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const signInRoutes = ["/sign-in", "/sign-up", "/verify-2fa", "/reset-password"];

export default async function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  console.log(session, signInRoutes);
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
};
```

**Required change — replace `getSessionCookie` with real HTTP session check:** The current implementation never redirects. The new implementation must:
1. Call `getSession()` (HTTP call to `/api/auth/get-session`) instead of cookie-only parsing
2. Redirect unauthenticated users away from protected routes (`/dashboard`, `/settings`)
3. Redirect authenticated users away from auth routes (`/sign-in`, `/sign-up`)

**Preserve:** The `export const config` matcher block stays identical — it correctly excludes static assets and `api/auth`.

**Import note (Assumption A1 from RESEARCH.md):** The exact import path for `getSession()` in the Next.js edge context must be verified against `node_modules/better-auth`. CLAUDE.md specifies using `betterFetch` to call `/api/auth/get-session` directly if `getSession()` is not edge-compatible.

---

### `src/lib/auth.ts` (config/service, event-driven)

**Analog:** `src/lib/auth.ts` (current — lines 1–183, full file)

**Current databaseHooks pattern** (lines 122–164):
```typescript
databaseHooks: {
  user: {
    create: {
      after: async (user) => {
        if ("runMutation" in ctx) {
          await ctx.runMutation(internal.users.syncUserCreation, {
            email: user.email,
          });
        } else if ("db" in ctx) {
          await (ctx as MutationCtx).db.insert("users", {
            email: user.email,
          });
        }
      },
    },
    delete: {
      after: async (user) => {
        if ("runMutation" in ctx) {
          await ctx.runMutation(internal.users.syncUserDeletion, {
            email: user.email,
          });
        } else if ("db" in ctx) {
          // inline cascade (fallback path)
          ...
        }
      },
    },
  },
},
```

**Required change — update inline fallback cascade and add onLinkAccount:** The `delete.after` inline `"db" in ctx` fallback currently cascades into `todos`. Update it to cascade into the new tables (`presence`, `coinLedger`, `ownedItems`, `equippedItems`, `games`) using the same `by_userId` index pattern and `.take(100)`.

**Add `onLinkAccount` to anonymous() plugin** (from RESEARCH.md Pattern 5):
```typescript
plugins: [
  anonymous({
    onLinkAccount: async ({ anonymousUser, newUser }) => {
      // Phase 1: no game data to migrate yet
      // anonymousUser.user.id = Better Auth ID of old anonymous user
      // newUser.user.id = Better Auth ID of new registered user
      // syncUserDeletion fires automatically via databaseHooks.user.delete.after
    },
  }),
  // ... rest of plugins unchanged
]
```

**Keep unchanged:** All other options (socialProviders, emailAndPassword, emailVerification, magicLink, emailOTP, twoFactor, genericOAuth, convex plugin, createAuth export).

---

### `src/app/(unauth)/layout.tsx` (layout/component, request-response)

**Analog:** `src/app/layout.tsx` (lines 1–49)

**Root layout font pattern** (lines 10–13) — copy for Sora:
```typescript
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"]
})
```
New layout uses `Sora` with the same structure:
```typescript
import { Sora } from "next/font/google";
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});
```

**Root layout children wrapper** (lines 20–49) — the `(unauth)/layout.tsx` is simpler (no ThemeProvider, no Footer, no Toaster — those are in root layout already):
```tsx
export default function UnAuthLayout({ children }: { children: React.ReactNode }) {
  return (
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

**Dark mode isolation:** The root `<html>` may have `class="dark"` from ThemeProvider. Using `colorScheme: "light"` inline style and explicit `#f8f6f2` background (not `bg-background` CSS var) isolates auth pages from dark mode. Auth card must use `bg-white` not `bg-card`.

---

### `src/app/(unauth)/sign-in/page.tsx` (component, request-response)

**Analog:** `src/components/client.tsx` (SignOutButton pattern — lines 1–21) + `src/components/ui/form.tsx`

**Client component declaration pattern** (from `src/components/client.tsx` line 1, `src/components/footer.tsx` line 1):
```typescript
"use client";
```

**Import pattern** — combining auth client + UI primitives + routing:
```typescript
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage
} from "@/components/ui/form";
import { GamiLogo } from "@/components/gami-logo";
```

**Loader2 loading button pattern** (from `src/components/client.tsx` lines 10–17):
```tsx
{loading ? (
  <Loader2 size={16} className="mr-2 animate-spin" />
) : null}
```

**Form setup pattern** (from `src/components/ui/form.tsx` — uses react-hook-form FormProvider):
```typescript
const form = useForm<z.infer<typeof signInSchema>>({
  resolver: zodResolver(signInSchema),
  defaultValues: { email: "", password: "" },
});
```

**Server error → inline error pattern** (D-07 — not toast):
```typescript
if (result.error) {
  const code = result.error.code;
  if (code === "INVALID_EMAIL_OR_PASSWORD" || code === "USER_NOT_FOUND") {
    form.setError("password", { message: "Incorrect email or password" });
  } else {
    form.setError("root", { message: "Something went wrong. Please try again." });
  }
  return;
}
```

**Guest sign-in pattern** (D-01 — below the form, secondary link style):
```typescript
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

**Card structure** (D-05 — logo above card, centered layout):
```tsx
<div className="min-h-svh flex flex-col items-center justify-center px-4">
  <GamiLogo size="lg" className="mb-8" />
  <Card className="w-full max-w-sm bg-white">
    <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* FormField blocks */}
          {form.formState.errors.root && (
            <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="animate-spin" />}
            Sign in
          </Button>
        </form>
      </Form>
    </CardContent>
    <CardFooter className="flex flex-col gap-2 text-sm text-center">
      {/* Play as Guest link — D-01 */}
      {/* Sign up link */}
    </CardFooter>
  </Card>
</div>
```

---

### `src/app/(unauth)/sign-up/page.tsx` (component, request-response)

**Analog:** Same as sign-in page — identical structure, different schema and auth call.

**Differences from sign-in:**
- Schema: `signUpSchema` with `password: z.string().min(8, "Password must be at least 8 characters")`
- Auth call: `authClient.signUp.email({ email, password, name: email })` — `name` defaults to email since no name field at registration (Claude's Discretion)
- On success: `router.push("/")` (same as sign-in)
- Footer links: "Sign in" + "Play as Guest" (instead of "Sign up" + "Play as Guest")
- Error mapping: `EMAIL_ALREADY_EXISTS` → `form.setError("email", { message: "An account with this email already exists" })`

---

### `src/components/gami-logo.tsx` (component, —)

**Analog:** None — no logo component exists in the codebase.

Use RESEARCH.md Pattern (Code Examples section — GamiLogo Component). Key details:
- Props: `size?: "sm" | "md" | "lg"` (default: `"md"`)
- SVG: two overlapping `<rect>` elements with `rx="4"`, using `var(--primary)` fill; back rect at `fillOpacity="0.4"`
- Wordmark: `<span>` with `style={{ fontFamily: "var(--font-sora), sans-serif" }}` and `font-semibold text-foreground`
- No `"use client"` needed — pure presentational, no hooks

---

### `src/components/guest-banner.tsx` (component, event-driven)

**Analog:** `src/components/footer.tsx` (lines 1–31) — closest layout pattern (sticky bar with links)

**Client directive + Link pattern** (from `src/components/footer.tsx` lines 1–7):
```typescript
"use client";
import Link from "next/link";
```

**Sticky bar layout pattern** (from `src/components/footer.tsx` lines 7–9):
```tsx
<div className="mx-auto w-full max-w-6xl px-2 md:px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
```

**Session check pattern** — use `authClient.useSession()` (from `src/lib/auth-client.ts`):
```typescript
const { data: session } = authClient.useSession();
const isGuest = session?.user?.isAnonymous === true;
```

**localStorage dismissal pattern** (no analog in codebase — standard React pattern):
```typescript
const DISMISS_KEY = "gami_banner_dismissed";
const [dismissed, setDismissed] = useState(false);

useEffect(() => {
  if (localStorage.getItem(DISMISS_KEY) === "true") {
    setDismissed(true);
  }
}, []);
```

**Icon-only button accessibility** (from CLAUDE.md accessibility section):
```tsx
<button aria-label="Dismiss banner">
  <X className="size-4" />
</button>
```

**Touch target rule** (from CLAUDE.md — min 44x44px):
```tsx
className="size-[44px] inline-flex items-center justify-center rounded-md hover:bg-black/5"
```

**Banner placement:** `sticky top-0 z-40` with `backgroundColor: "#f1f5fb"` (MP blue from design spec).

---

### `src/app/page.tsx` (component, request-response)

**Analog:** `src/app/page.tsx` (current — lines 1–8, full file)

**Current pattern** (full file):
```typescript
"use client";
import { useConvexAuth } from "convex/react";

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return <div className="m-auto">Fresh Start</div>;
}
```

**Required change:** Replace content with Phase 1 placeholder that:
1. Renders `<GuestBanner />` at the top
2. Shows a minimal placeholder body (e.g., "Coming soon" or empty state)
3. Keeps `"use client"` if GuestBanner needs session access (it does — it uses `authClient.useSession()`)
4. Remove unused `useConvexAuth` import

---

## Shared Patterns

### Auth Client Import
**Source:** `src/lib/auth-client.ts` (lines 13–23)
**Apply to:** `sign-in/page.tsx`, `sign-up/page.tsx`, `guest-banner.tsx`
```typescript
import { authClient } from "@/lib/auth-client";
// Usage in components:
const { data: session } = authClient.useSession();
await authClient.signIn.email({ email, password });
await authClient.signUp.email({ email, password, name: email });
await authClient.signIn.anonymous();
```

### Convex Query Pattern
**Source:** `convex/auth.ts` lines 13–48 / `CLAUDE.md` "Querying Data" section
**Apply to:** `convex/presence.ts`, `convex/users.ts`
```typescript
// In client components
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
const data = useQuery(api.moduleName.functionName, { args });
// undefined = loading; null = not found; value = data

// In Convex functions — derive identity, never accept userId arg
const authUser = await betterAuthComponent.getAuthUser(ctx);
if (!authUser) return null;
```

### Index Lookup Pattern (Convex)
**Source:** `convex/auth.ts` lines 30–34 / `convex/users.ts` lines 20–22
**Apply to:** `convex/users.ts`, `convex/auth.ts`, `convex/presence.ts`
```typescript
// Always use withIndex — never filter()
// New index names use by_ prefix (schema rewrite changes this)
const row = await ctx.db
  .query("tableName")
  .withIndex("by_fieldName", (q) => q.eq("fieldName", value))
  .first();
```

### internalMutation Declaration
**Source:** `convex/users.ts` lines 6–13
**Apply to:** `convex/users.ts` (syncUserCreation, syncUserDeletion)
```typescript
import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

export const functionName = internalMutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // ctx.db operations here
  },
});
```

### public mutation Declaration
**Source:** `convex/users.ts` structure, type changed to `mutation`
**Apply to:** `convex/presence.ts` (updatePresence)
```typescript
import { mutation } from "./_generated/server";
// Same args/handler structure as internalMutation
// Accessible via api.presence.updatePresence from client
```

### Form Component Stack
**Source:** `src/components/ui/form.tsx` (lines 1–167)
**Apply to:** `sign-in/page.tsx`, `sign-up/page.tsx`

The full stack is:
```tsx
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input type="email" placeholder="you@example.com" {...field} />
          </FormControl>
          <FormMessage />  {/* renders error automatically */}
        </FormItem>
      )}
    />
  </form>
</Form>
```
`FormMessage` auto-renders `field.error.message`. `FormControl` sets `aria-invalid` on the Input automatically.

### Button Loading State
**Source:** `src/components/client.tsx` lines 10–17
**Apply to:** `sign-in/page.tsx`, `sign-up/page.tsx`
```tsx
import { Loader2 } from "lucide-react";

<Button type="submit" disabled={isLoading}>
  {isLoading && <Loader2 className="animate-spin" />}
  Sign in
</Button>
```
Do NOT add `useMemo`/`useCallback` — React Compiler handles memoization.

### databaseHooks Pattern
**Source:** `src/lib/auth.ts` lines 122–164
**Apply to:** `src/lib/auth.ts` (update only)

The dual-path pattern (`"runMutation" in ctx` vs `"db" in ctx`) must be preserved for both `create.after` and `delete.after`. The `delete.after` inline fallback path must be updated to cascade into the new tables.

---

## No Analog Found

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/components/gami-logo.tsx` | component | — | No logo/branding component exists in codebase |

---

## Critical Warnings for Implementors

1. **Index rename is a breaking change:** When `convex/schema.ts` changes `index("email", ...)` to `index("by_email", ...)`, the following files must be updated in the same task: `convex/users.ts` (both mutations), `convex/auth.ts` (getCurrentUser), `src/lib/auth.ts` (inline db fallback in databaseHooks). TypeScript will error at compile time if any call site is missed.

2. **`todos` table removal:** After schema rewrite, `convex/users.ts` `syncUserDeletion` and `src/lib/auth.ts` inline delete fallback both reference `"todos"`. These become TypeScript errors immediately — they must be updated in the same pass.

3. **Dark mode isolation:** Auth page Card must use `bg-white` (not `bg-card`). The layout wrapper must use inline `style={{ colorScheme: "light" }}` (not a Tailwind class). See RESEARCH.md Pitfall 4.

4. **Anonymous user flow — `syncUserCreation` fires twice:** When an anonymous user converts to a real account, `create.after` fires for BOTH the anonymous temp email AND the new real email. The idempotency guard in `syncUserCreation` (check before insert) prevents duplicate rows.

5. **`getSession()` import path unverified (Assumption A1):** The exact edge-runtime-compatible import for `getSession()` in `src/proxy.ts` is flagged as uncertain in RESEARCH.md. If `getSession()` from `better-auth/client` is not edge-compatible, implement as a raw `fetch` to `/api/auth/get-session` with the forwarded cookie header.

---

## Metadata

**Analog search scope:** `convex/`, `src/app/`, `src/components/`, `src/lib/`
**Files read:** 14
**Pattern extraction date:** 2026-04-26
