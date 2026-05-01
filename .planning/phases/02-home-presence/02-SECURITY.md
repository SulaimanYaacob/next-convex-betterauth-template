---
phase: 02-home-presence
threats_found: 31
threats_closed: 31
threats_open: 0
asvs_level: 1
audited: 2026-05-01
---

## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Browser client → Convex queries (`getBalance`, `getOnlinePlayers`) | Client invokes public queries; identity derived server-side, never from arguments |
| Convex scheduler → internal mutation (`markStalePresence`) | Internal-only invocation surface; not callable from public `api.*` |
| Browser DOM events → HeartbeatProvider | Mousemove/scroll/keydown/click drive local state; no spoofing risk |
| HeartbeatProvider → `api.presence.updatePresence` | Client sends only `status` literal; server derives `userId` |
| CoinBalance → `api.coinLedger.getBalance` | Read-only subscription; server-side identity derivation |
| Browser → `authClient.signOut()` | Client-initiated session destruction; Better Auth handles invalidation server-side |
| Browser → root layout (server-rendered HTML) | Initial document delivered to client; must not leak credentials in markup |
| HeartbeatProvider mount → Convex mutation gateway | Heartbeat fires once layout hydrates |
| Static page composition → child client components | No data crosses this boundary in `page.tsx` itself |

## Threat Register

| Threat ID | Category | Component | Disposition | Status | Evidence |
|-----------|----------|-----------|-------------|--------|----------|
| T-02-01 | S (Spoofing) | `coinLedger.getBalance` | mitigate | CLOSED | `convex/coinLedger.ts:11` — `betterAuthComponent.getAuthUser(ctx)`; `args: {}` — no `userId` param |
| T-02-02 | T (Tampering) | `coinLedger.getBalance` | mitigate | CLOSED | `convex/coinLedger.ts:8` — `query({` (read-only); no mutation exported in this file |
| T-02-03 | I (Information Disclosure) | `presence.getOnlinePlayers` | accept | CLOSED | Intentional: online status is the feature; only initials + derived display name exposed |
| T-02-04 | I (Information Disclosure) | `presence.getOnlinePlayers` | mitigate | CLOSED | `convex/presence.ts:63-68` — returns only `{userId, name, initials, status}`; raw email and internal fields stripped |
| T-02-05 | E (Elevation of Privilege) | `markStalePresence` | mitigate | CLOSED | `convex/crons.ts:8` — `internalMutation({`; invoked only via `internal.crons.markStalePresence` at line 27 |
| T-02-06 | D (Denial of Service) | `getOnlinePlayers`, `markStalePresence`, `getBalance` | mitigate | CLOSED | `presence.ts:53` `.take(50)`; `crons.ts:14` `.take(100)`; `coinLedger.ts:22` `.take(1000)` — no `.collect()` anywhere |
| T-02-07 | T (Tampering) | `presence` table status field | mitigate | CLOSED | `convex/schema.ts:30` — `v.literal("offline")` added; union now contains all 4 literals; cron writes validated |
| T-02-08 | R (Repudiation) | All queries | accept | CLOSED | Intentional: read-only queries; cron writes logged in Convex function logs server-side |
| T-02-09 | S (Spoofing) | HeartbeatProvider | mitigate | CLOSED | `src/components/heartbeat-provider.tsx:30,34` — `updatePresence({ status: ... })` only; no `userId` arg passed |
| T-02-10 | T (Tampering) | HeartbeatProvider status arg | mitigate | CLOSED | `convex/presence.ts:11-15` — `v.union(v.literal("online"), v.literal("in-game"), v.literal("idle"))` on `updatePresence` args; arbitrary strings rejected at gateway |
| T-02-11 | I (Information Disclosure) | CoinBalance render | mitigate | CLOSED | `src/components/coin-balance.tsx:16` — `if (!session?.user \|\| isAnonymous) return null;` |
| T-02-12 | D (Denial of Service) | HeartbeatProvider 15s timer | mitigate | CLOSED | `src/components/heartbeat-provider.tsx:33,57-60` — single `setInterval`; cleanup calls `clearInterval` + `clearTimeout` + `removeEventListener` for all 4 events |
| T-02-13 | D (Denial of Service) | HeartbeatProvider for guests | mitigate | CLOSED | `src/components/heartbeat-provider.tsx:27` — `if (!isAuthenticated) return;` inside `useEffect`; guest sessions produce zero mutations |
| T-02-14 | E (Elevation of Privilege) | FilterChips visual-only | accept | CLOSED | Intentional: no server interaction; pure local `useState`; no escalation surface |
| T-02-15 | T (Tampering) | /store placeholder | accept | CLOSED | Intentional: static server component; no inputs, no data fetch; nothing to tamper with |
| T-02-16 | S (Spoofing) | AppNav avatar initials | accept | CLOSED | Intentional: initials derived from `session.user.email` validated by Better Auth; client-only display |
| T-02-17 | T (Tampering) | Sign-out flow | mitigate | CLOSED | `src/components/app-nav.tsx:32` — `authClient.signOut()` is sole sign-out path; `router.push("/sign-in")` post-confirmation |
| T-02-18 | R (Repudiation) | Sign-out flow | accept | CLOSED | Intentional: Better Auth logs sign-out server-side; client audit trail not required |
| T-02-19 | I (Information Disclosure) | AppNav CoinBalance render | mitigate | CLOSED | `src/components/app-nav.tsx:67` — `{isAuthenticated && <CoinBalance />}`; component not mounted for guests |
| T-02-20 | I (Information Disclosure) | PresencePanel name/initials | accept | CLOSED | Intentional: same disposition as T-02-03/04; public presence is the feature |
| T-02-21 | D (Denial of Service) | DropdownMenu signOut | mitigate | CLOSED | `src/components/app-nav.tsx:89` — `e.preventDefault()` blocks Radix auto-close; sign-out runs once; navigation follows |
| T-02-22 | E (Elevation of Privilege) | MobileBottomNav active tab | accept | CLOSED | Intentional: read-only `usePathname()`; `aria-current` is presentation only |
| T-02-23 | T (Tampering) | Search input (visual-only) | accept | CLOSED | Intentional: no `onChange`, no server submission, no router push; pure DOM in Phase 2 |
| T-02-24 | I (XSS via initials) | AppNav / MobileNav initials | mitigate | CLOSED | `src/components/app-nav.tsx:29` — `email.split("@")[0].slice(0, 2).toUpperCase()` rendered as React text node; no `dangerouslySetInnerHTML` |
| T-02-25 | I (Information Disclosure) | layout.tsx metadata | accept | CLOSED | Intentional: title/description contain only marketing copy (`"Gami"`, `"Play. Earn. Show off."`); no PII or secrets |
| T-02-26 | T (Tampering) | Inline section background hex | accept | CLOSED | Intentional: hex color strings (`#f8f6f2`, `#f1f5fb`) are static literals in `page.tsx:23,37`; not user-controlled |
| T-02-27 | E (Elevation of Privilege) | HeartbeatProvider mounted at root | mitigate | CLOSED | `src/app/layout.tsx:40` — `<HeartbeatProvider>` inside `<ConvexClientProvider>`; internally guest-gated (see T-02-13) |
| T-02-28 | D (Denial of Service) | Toaster global mount | accept | CLOSED | Intentional: Sonner toasts are client-only render; bounded by user interactions; no amplification |
| T-02-29 | S (Spoofing) | Hardcoded game names in page.tsx | accept | CLOSED | Intentional: names are compile-time constants (`SOLO_GAMES`, `MP_GAMES`); no DB lookup until Phase 3+ |
| T-02-30 | I (Information Disclosure) | GuestBanner global mount | accept | CLOSED | Intentional: GuestBanner is auth-gated in its own component; shows only to guests; no PII leaked |
| T-02-31 | T (Tampering) | Removal of `overflow-hidden` | mitigate | CLOSED | `src/app/layout.tsx:31` — body uses `min-h-svh` with no `overflow-hidden`; confirmed by absence of that class in file |

## Accepted Risks

The following threats were explicitly accepted by the plans as intentional design decisions. No mitigation code is required for these.

| Threat ID | Risk | Reasoning |
|-----------|------|-----------|
| T-02-03 | Public presence information disclosure | Online status is the core feature; only initials and derived name are exposed — no email, password, or auth token |
| T-02-08 | Repudiation of read-only queries | Queries have no side effects to repudiate; cron writes are logged by Convex infrastructure |
| T-02-14 | FilterChips privilege escalation | Visual-only local state with no server calls; no escalation surface exists |
| T-02-15 | /store placeholder tampering | Static server component with no inputs or data fetch |
| T-02-16 | Avatar initials spoofing | Initials are a display-only client convenience derived from server-validated session data |
| T-02-18 | Sign-out repudiation | Better Auth logs sign-out events server-side; client-side audit trail not required at ASVS Level 1 |
| T-02-20 | PresencePanel name/initials disclosure | Same accepted risk as T-02-03; public presence is the feature |
| T-02-22 | MobileBottomNav active tab privilege escalation | `usePathname()` is read-only navigation state; `aria-current` is presentation |
| T-02-23 | Search input tampering | Search input has no `onChange`, no server submission, and no router push in Phase 2 |
| T-02-25 | Layout metadata information disclosure | Title and description are public marketing copy |
| T-02-26 | Inline section hex tampering | Static compile-time literals; not user-controlled |
| T-02-28 | Toaster DoS | Client-only render bounded by user interactions |
| T-02-29 | Hardcoded game name spoofing | Compile-time constants; no runtime input or DB lookup until Phase 3+ |
| T-02-30 | GuestBanner information disclosure | Component is auth-gated internally; shows only to guests; no PII leaked |

## Unregistered Flags

None. All threat flags from SUMMARY.md map to registered threat IDs.

## Audit Trail

### Security Audit 2026-05-01

| Metric | Count |
|--------|-------|
| Threats found | 31 |
| Closed | 31 |
| Open | 0 |
| Mitigate disposition | 17 |
| Accept disposition | 14 |
| Transfer disposition | 0 |
| ASVS Level | 1 |

### Auditor Notes

All 17 "mitigate" threats have implementation evidence located in the cited files and line numbers. Key findings:

- **T-02-01 (server-derived identity):** `coinLedger.ts` correctly uses `betterAuthComponent.getAuthUser(ctx)` with `args: {}`. No `userId` argument accepted.
- **T-02-05 (internal mutation):** `crons.ts` exports `markStalePresence` as `internalMutation` and registers it via `internal.crons.markStalePresence`. It does not appear in `api.*`.
- **T-02-06 (bounded queries):** `.take(50)` in `getOnlinePlayers`, `.take(100)` in `markStalePresence`, `.take(1000)` in `getBalance`. No `.collect()` calls found in any new file.
- **T-02-07 (schema union):** `convex/schema.ts:30` contains `v.literal("offline")` in the presence status union.
- **T-02-09 (status-only mutation call):** `heartbeat-provider.tsx` passes only `{ status: ... }` to `updatePresence`; no `userId` argument anywhere.
- **T-02-10 (Convex validator):** `presence.ts` `updatePresence` args validator is a strict union of 3 literals. Offline is intentionally absent from the client-facing mutation.
- **T-02-11 (guest null return):** `coin-balance.tsx:16` returns `null` for guests before any balance query result is rendered.
- **T-02-13 (guest heartbeat gate):** `heartbeat-provider.tsx:27` early-returns from `useEffect` when `!isAuthenticated`.
- **T-02-19 (nav gate):** `app-nav.tsx:67` uses `{isAuthenticated && <CoinBalance />}` — component not mounted for guests.
- **T-02-24 (XSS-safe initials):** Initials are a plain string expression rendered as a React text node with no `dangerouslySetInnerHTML`.
