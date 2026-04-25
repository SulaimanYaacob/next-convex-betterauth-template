# Phase 1: Foundation - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Lock the Convex schema and deliver working auth UI — sign-in, sign-up, guest play, and guest-to-account conversion. No home page (Phase 2), no game shell (Phase 3). The result is a platform where users can authenticate or play anonymously, with all database tables created correctly from day one so no schema migrations are needed in later phases.

</domain>

<decisions>
## Implementation Decisions

### Guest Mode
- **D-01:** "Play as Guest" button lives on the sign-in page, below the sign-in form. Guest anonymous session created immediately via Better Auth anonymous plugin.
- **D-02:** After clicking "Play as Guest", user lands on `/` (home). Phase 1 home is a placeholder — that's acceptable; Phase 2 makes it real.
- **D-03:** Guest-to-account conversion prompt: persistent unobtrusive banner in the nav for guest users ("Create account to save progress"). Dismissible. Added as part of Phase 1 nav scaffolding or Phase 2 nav — whichever makes sense during planning.

### Auth Page Visual Style
- **D-04:** Minimal centered card layout on `#f8f6f2` neutral background (matches V2 Refined solo section). No decoration, no dark theme. Logo ("gami" wordmark) above the card.
- **D-05:** Card contains: logo/brand header, form fields, primary CTA button, secondary links (Play as Guest · Sign up, or Sign in · Play as Guest depending on page).

### Form Validation
- **D-06:** Errors appear inline under each field — triggered on submit and on blur. Uses existing `src/components/ui/form.tsx` + zod + react-hook-form infrastructure.
- **D-07:** Server-side errors (wrong credentials, email taken) shown as inline errors too, not toasts.
- **D-08:** No password strength indicator. Minimum password length enforced with a single inline error if violated. Keeps sign-up minimal.

### Sign-up Fields
- **Claude's Discretion:** User did not specify sign-up fields. Default to email + password only at registration. Username can be set from the Profile page (Phase 4). `users` table should include `username` as optional nullable field so it can be populated later without migration.

### Schema
- **D-09:** Phase 1 creates ALL tables required for the full platform (schema lock): `users`, `coinLedger`, `presence`, `storeItems`, `ownedItems`, `equippedItems`, `games`. This satisfies the Phase 1 success criterion that no schema migrations are needed in later phases.
- **D-10:** Remove `todos` table (scaffold leftover).
- **D-11:** `coinLedger` is append-only — signed amount entries (`userId`, `amount: number`, `reason: string`, `sessionId?: string`). Balance computed as SUM. No mutable balance field on `users`.
- **D-12:** `presence` is a separate table (NOT fields on `users`) — `userId`, `lastSeen: number`, `status: "online" | "in-game" | "idle"`. Heartbeat mutation (Phase 2 will wire the client-side 15s interval, but the mutation + table must exist in Phase 1).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth System
- `convex/auth.ts` — Better Auth client setup, `getCurrentUser` query, lifecycle hooks (`onCreateUser`, `onDeleteUser`, `onUpdateUser`)
- `convex/auth.config.ts` — RS256 JWT config via `getAuthConfigProvider()`
- `convex/http.ts` — Better Auth route registration; any new HTTP actions must coexist here
- `src/lib/auth.ts` — Server-side auth configuration (providers, 2FA, magic links)
- `src/lib/auth-client.ts` — Client-side auth hooks; plugins must stay in sync with server
- `src/proxy.ts` — Route protection middleware (Next.js 16); protects `(auth)` routes, redirects from auth pages when signed in
- `src/app/api/auth/[...all]/route.ts` — Proxies auth requests to Convex

### Schema
- `convex/schema.ts` — Current schema (users + todos scaffold); Phase 1 rewrites this completely
- `CLAUDE.md` — Convex patterns, `convex/_generated/ai/guidelines.md` must be read before writing Convex functions

### UI Components
- `src/components/ui/form.tsx` — Form infrastructure (zod + react-hook-form)
- `src/components/ui/input.tsx`, `button.tsx`, `card.tsx` — Primitives to use in auth pages

### Design
- `.planning/PROJECT.md` — V2 Refined design direction, color tokens (`#f8f6f2` neutral, `#f1f5fb` MP blue)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/form.tsx` + `input.tsx` + `button.tsx` + `card.tsx`: Complete form stack for auth pages — no new primitives needed
- `convex/auth.ts` `betterAuthComponent`: Use `getAuthUser` for session checking; `onCreateUser` for creating app user record
- `src/app/ConvexClientProvider.tsx`: `ConvexBetterAuthProvider` already wraps app — auth context available everywhere

### Established Patterns
- Route protection via `src/proxy.ts` — add new routes to matcher as needed
- User data split: auth metadata in Better Auth tables, app data in `users` table; merge in `getCurrentUser`
- React Compiler active — no `useMemo`/`useCallback`/`React.memo`
- Mutations always show toast feedback (Sonner installed)

### Integration Points
- New auth pages go in `src/app/(unauth)/` — proxy already redirects authenticated users away from these
- Protected routes go in `src/app/(auth)/` — proxy guards these
- `convex/schema.ts` is the single source of truth for all tables; rewrite completely in Phase 1

</code_context>

<specifics>
## Specific Ideas

- Logo on auth card: "gami" in Sora font + geometric overlapping-squares mark (from PROJECT.md design direction). Can be a simple text + SVG or styled text for Phase 1.
- "Play as Guest" should feel like a low-friction secondary option — smaller/lighter text than the primary sign-in button, not equally prominent.
- Nav guest banner: minimal — maybe a thin bar at top of page (not a full modal) with text + "Create account" link.

</specifics>

<deferred>
## Deferred Ideas

- OAuth sign-in UI (Google/GitHub) — AUTH-V2-01; already configured in Better Auth but UI deferred to v2
- 2FA and magic link UI — AUTH-V2-02; functionality exists in Better Auth, surface later
- Password reset flow — not explicitly in v1 AUTH requirements; defer to v2 or add in Phase 2 if needed
- Avatar upload at sign-up — profile features belong in Phase 4

</deferred>

---

*Phase: 01-foundation*
*Context gathered: 2026-04-26*
