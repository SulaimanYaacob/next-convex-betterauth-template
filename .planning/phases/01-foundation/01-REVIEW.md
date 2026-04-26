---
phase: 01-foundation
reviewed: 2026-04-26T00:00:00Z
depth: standard
files_reviewed: 12
files_reviewed_list:
  - convex/presence.ts
  - convex/schema.ts
  - convex/users.ts
  - convex/auth.ts
  - src/lib/auth.ts
  - src/components/gami-logo.tsx
  - src/components/guest-banner.tsx
  - src/app/(unauth)/layout.tsx
  - src/app/(unauth)/sign-in/page.tsx
  - src/app/(unauth)/sign-up/page.tsx
  - src/proxy.ts
  - src/app/page.tsx
findings:
  critical: 1
  warning: 4
  info: 4
  total: 9
status: issues_found
---

# Phase 01: Code Review Report

**Reviewed:** 2026-04-26
**Depth:** standard
**Files Reviewed:** 12
**Status:** issues_found

## Summary

All 12 source files for Phase 1 (Foundation) were reviewed at standard depth. The architecture is sound — ECON-01 invariant (no mutable balance field) is correctly enforced by schema design, PRES-01 identity-from-auth pattern is correctly implemented, and the dual-context (`runMutation` vs direct `db`) pattern in `auth.ts` databaseHooks is coherent.

One critical security issue was found: the `authWithoutCtx` export at the bottom of `src/lib/auth.ts` instantiates a full Better Auth instance with an empty object cast as context, which surfaces at module load time and exposes the auth configuration to server environments where it should not. Four warnings cover incomplete state resets on auth errors, a missing `setSubmitting(false)` guard in error paths, a `scoreEvent: v.any()` schema field that bypasses type safety, and the hardcoded inline style colors that will not respond to theme changes. Four informational items cover a TODO comment left in production config, duplicate guest sign-in handler code, a missing `name` on the `<button>` submit in unauth pages, and an unused `additionalFields.foo` config entry.

## Critical Issues

### CR-01: `authWithoutCtx` constructs a live auth instance from an empty context

**File:** `src/lib/auth.ts:197`
**Issue:** The module-level export `authWithoutCtx = createAuth({} as any)` invokes `createOptions` with an empty object, which calls `betterAuthComponent.adapter(ctx as any)` at module evaluation time. This passes `{}` as the Convex context into the database adapter, which is incorrect and will cause the adapter to attempt database operations against an undefined context whenever anything imports this module in a non-request scope (e.g., during Next.js build-time analysis, edge cold starts, or server action pre-loading). If the adapter caches or lazily initializes from the passed context reference, this can silently fail or surface incorrect behavior. Additionally, `process.env.BETTER_AUTH_SECRET` is accessed at build time — if the secret is missing the build does not fail but the auth instance is misconfigured.

The comment acknowledges this is "mostly for inferring types," which means the runtime instantiation is a side-effect that should not exist.

**Fix:** Extract type inference without creating a live instance. Use a type-only helper:

```typescript
// Replace the live instantiation with a type-only export
import type { betterAuth } from "better-auth";
// Derive the type from createOptions alone — no runtime call needed
export type AuthType = ReturnType<typeof createAuth>;

// Remove this line entirely:
// export const authWithoutCtx = createAuth({} as any);
```

If downstream consumers actually call methods on `authWithoutCtx` at runtime, those call-sites must be refactored to call `createAuth(ctx)` inside a proper request handler instead.

---

## Warnings

### WR-01: `setSubmitting(false)` not called when `authClient.signIn.email` throws synchronously

**File:** `src/app/(unauth)/sign-in/page.tsx:49-68`
**Issue:** The `onSubmit` handler sets `setSubmitting(true)` before the `await`, then sets `setSubmitting(false)` after the `await`. If `authClient.signIn.email(...)` throws (rather than returning an error result), the `setSubmitting(false)` call on line 55 is never reached, leaving the button permanently disabled for the session. The same pattern exists in `handleGuestSignIn` (lines 72-82) and mirrors identically in `sign-up/page.tsx`.

**Fix:** Wrap the async call in try/finally:

```typescript
async function onSubmit(values: SignInValues) {
  setSubmitting(true);
  try {
    const result = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    if (result.error) {
      // ... error handling unchanged
      return;
    }
    router.push("/");
  } finally {
    setSubmitting(false);
  }
}
```

Apply the same pattern to `handleGuestSignIn` in both `sign-in/page.tsx` and `sign-up/page.tsx`.

---

### WR-02: `scoreEvent: v.any()` in games table bypasses schema validation entirely

**File:** `convex/schema.ts:83`
**Issue:** The `scoreEvent` field is typed as `v.any()`, which means Convex will accept any value (string, object, array, null) with no validation. When Phase 3 wires real game session data, malformed score events will be stored without error and can silently corrupt game ledger calculations downstream (ECON-02). This is a footgun that is difficult to remove once data exists in production.

**Fix:** If the shape is not yet known, prefer `v.optional(v.string())` (store as serialized JSON) or define a union of the expected event types now:

```typescript
// Option A — defer full typing, store serialized
scoreEvent: v.optional(v.string()),

// Option B — lock the known shape now
scoreEvent: v.optional(v.object({
  type: v.string(),
  payload: v.record(v.string(), v.any()), // narrow payload at read time
})),
```

Either is better than bare `v.any()` because the field name is committed to schema and future migrations are cheaper than data cleanup.

---

### WR-03: `create.after` databaseHook inserts directly via `ctx.db` when context lacks `runMutation`, bypassing idempotency guard in `syncUserCreation`

**File:** `src/lib/auth.ts:132-143`
**Issue:** The `create.after` hook has two branches: if `"runMutation" in ctx`, it calls `internal.users.syncUserCreation` (which has the idempotent duplicate-email guard at lines 10-14 of `users.ts`); otherwise it falls through to `ctx.db.insert("users", ...)` directly, skipping the guard. The comment in `users.ts` explicitly documents that "anonymous-to-account conversion fires create.after twice." If the fallback branch is ever reached during that double-fire scenario, two `users` rows will be inserted for the same email, violating the by_email unique-lookup assumption used throughout the codebase (presence, coin ledger lookups all take `.first()` and silently operate on whichever row is returned first).

**Fix:** Apply the same guard in the fallback branch, or remove the fallback branch if it can never be reached in practice (and document why):

```typescript
// Fallback branch with guard
} else if ("db" in ctx) {
  const mutCtx = ctx as MutationCtx;
  const existing = await mutCtx.db
    .query("users")
    .withIndex("by_email", (q) => q.eq("email", user.email))
    .first();
  if (!existing) {
    await mutCtx.db.insert("users", { email: user.email });
  }
}
```

---

### WR-04: Proxy `fetchSession` self-fetches without a timeout — can hang indefinitely on edge cold starts

**File:** `src/proxy.ts:17-34`
**Issue:** The `fetch` call to `/api/auth/get-session` has no `signal` with an `AbortController` timeout. In Next.js edge runtime (which is where middleware/proxy runs), a stalled Convex backend or DNS hiccup during cold start will cause the fetch to block the middleware indefinitely, stalling every inbound request that hits a protected or auth route. There is no maximum wait time, so a network partition causes a total service hang rather than a graceful fallback.

**Fix:** Add a timeout signal:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 s max

const res = await fetch(url, {
  method: "GET",
  headers: { cookie },
  cache: "no-store",
  signal: controller.signal,
});
clearTimeout(timeoutId);
```

The outer `catch` already returns `false` on error, so an aborted fetch will correctly fail closed (unauthenticated) without exposing protected routes.

---

## Info

### IN-01: TODO comment left in production config — email verification disabled

**File:** `src/lib/auth.ts:53-55`
**Issue:** `requireEmailVerification: false` is explicitly disabled with a TODO comment referencing RESEND_API_KEY configuration. Leaving email verification disabled in production means any email address can be used without confirmation, enabling account enumeration and spam registrations.

**Fix:** Track this as a tracked issue rather than a code comment. When RESEND_API_KEY is available, flip to `true` and remove the comment. Until then, consider adding a `console.warn` in development so it surfaces in dev server logs rather than being silently skipped.

---

### IN-02: Duplicate `handleGuestSignIn` implementation across sign-in and sign-up pages

**File:** `src/app/(unauth)/sign-in/page.tsx:72-83`, `src/app/(unauth)/sign-up/page.tsx:75-86`
**Issue:** The guest sign-in handler is copy-pasted identically in both pages. Any future change (e.g., adding analytics, adjusting error messages) must be applied in two places.

**Fix:** Extract to a shared hook or utility, e.g., `src/hooks/use-guest-sign-in.ts`:

```typescript
export function useGuestSignIn() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function signInAsGuest(onError: (msg: string) => void) {
    setSubmitting(true);
    try {
      const result = await authClient.signIn.anonymous();
      if (result.error) { onError("Guest sign-in failed. Please try again."); return; }
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  }

  return { signInAsGuest, submitting };
}
```

---

### IN-03: Hardcoded hex colors in `GuestBanner` will not respond to dark mode / theme tokens

**File:** `src/components/guest-banner.tsx:48-51`
**Issue:** The banner uses inline `style={{ backgroundColor: "#f1f5fb", borderColor: "rgba(59,130,246,0.15)" }}` rather than Tailwind design tokens or CSS custom properties. When a dark mode or alternate theme is applied in future phases, the banner will remain light-blue regardless.

**Fix:** Replace with Tailwind utility classes backed by CSS variables:

```tsx
className="... bg-blue-50/80 dark:bg-blue-950/30 border-blue-200/30 dark:border-blue-800/30"
```

or define a CSS custom property in the theme layer. Either approach keeps the color in the design system.

---

### IN-04: Unused `additionalFields.foo` in user config

**File:** `src/lib/auth.ts:79-83`
**Issue:** The `user.additionalFields` block defines a `foo: { type: "string", required: false }` field with no apparent purpose. This is likely a scaffold left from a template. While harmless, it adds noise to auth configuration and will appear in generated Better Auth types.

**Fix:** Remove the block entirely unless it documents a planned field name. If it is intentional scaffolding, rename it to the actual planned field and add a comment.

---

_Reviewed: 2026-04-26_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
