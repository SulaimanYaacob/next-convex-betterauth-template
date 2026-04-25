# Stack Research: Gami

**Researched:** 2026-04-25
**Overall confidence:** HIGH (verified against Context7 official docs for all major decisions)

---

## Recommended Additions (on top of locked Next.js 16 + Convex 1.36 + Better Auth 1.6)

### Payments

- **stripe** (stripe-node): v19.1.0 — Server-side Stripe SDK for creating Checkout Sessions and verifying webhook signatures inside Convex HTTP actions. Call from a Convex `action` (not mutation) because it requires outbound HTTP. — confidence: HIGH (verified via Context7 Stripe docs)
- **@stripe/stripe-js**: v8.5.0 — Loads `Stripe.js` on the client for redirect-to-checkout. Tiny, async-loaded, PCI-compliant. Only needed if using Stripe Elements embedded; if using hosted Checkout redirect, this is optional. — confidence: HIGH

### Animation / Cursor Trail

- **motion**: current stable (was framer-motion; the package was renamed to `motion` in v11) — Provides `useMotionValue`, `useSpring`, and `motion.div` for cursor trail dot rendering. Render trail dots in a global portal outside the game canvas so they survive fullscreen transitions. Also used for cosmetic hover/equip transitions in the store. — confidence: HIGH (verified via Context7 motion_dev library)

### Theme Cosmetics

- **next-themes**: v0.4.6 (already in package.json) — Supports arbitrary named themes beyond light/dark via the `themes` prop and `data-theme` attribute on `<html>`. Each UI theme cosmetic maps to a `data-theme` value; CSS custom properties then cascade globally. No additional library needed. — confidence: HIGH (verified via Context7 next-themes docs)

### Store / E-Commerce UI

- No additional library. Use existing Radix UI primitives (Dialog, DropdownMenu, Slot) + Tailwind CSS v4 for the store grid, item cards, and coin balance display. The store is a content/grid layout, not a complex e-commerce flow. — confidence: HIGH

### Real-Time Presence

- **convex-helpers**: v0.1.115 (already in package.json) — Provides `SessionProvider` and session-scoped queries for associating presence state with browser sessions, including anonymous users. Pair with a Convex query on a `presence` table keyed by userId + last-seen timestamp. No socket library needed — Convex WebSocket subscriptions handle delivery. — confidence: HIGH (verified via Context7 convex-helpers docs)

### Game Shell / iframe

- No library. Use a standard `<iframe sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen">` element managed by a React component (`GameShell`). The Fullscreen API (`document.documentElement.requestFullscreen()`) is available natively. ESC overlay is implemented as a React portal rendered above the iframe using `z-index` layering. — confidence: HIGH

### Cosmetic Asset Storage

- **Convex File Storage** (built-in, no extra package) — Store cursor skin SVGs, trail particle images, and theme preview thumbnails as Convex storage blobs. Mutations reference `storageId`; components fetch via `useQuery(api.cosmetics.getUrl, { storageId })`. — confidence: HIGH

---

## Key Technical Decisions

### Stripe + Convex Integration

**Recommendation:** Stripe Checkout (hosted page) + Convex HTTP action webhook + internal mutation for coin credit.

**Why:**
Convex actions can call external APIs (`ctx.runMutation` but not `ctx.db` directly). The correct pattern is:

1. Client calls a Convex `action` (`api.payments.createCheckoutSession`) which calls Stripe API and returns `session.url`.
2. Client redirects to Stripe-hosted checkout page. No payment form in the app — avoids PCI scope creep.
3. Stripe fires `checkout.session.completed` webhook to `https://[project].convex.site/api/stripe-webhook` (a Convex `httpAction` registered in `convex/http.ts`).
4. HTTP action reads raw body, calls `stripe.webhooks.constructEvent(rawBody, sig, secret)` using the `stripe` npm package for signature verification. Raw body is obtained via `request.arrayBuffer()` before any parsing — required for HMAC integrity.
5. On verified success, calls `ctx.runMutation(internal.payments.creditCoins, { userId, coinAmount, stripeSessionId })`.
6. The `creditCoins` mutation checks for duplicate `stripeSessionId` before inserting — idempotency guard against Stripe retries.
7. Coin balance is a derived sum of an immutable `coinLedger` table (append-only), never a mutable counter field. This prevents race conditions since Convex mutations are serialized per document but ledger inserts are safe.

**Alternative considered:** Stripe Payment Elements (embedded form) — rejected because it adds PCI scope, requires `@stripe/react-stripe-js` + `stripe-js` on every page load, and adds implementation surface with no user experience benefit for a simple "buy coins" flow.

**Environment variables required:**
- `STRIPE_SECRET_KEY` — in Convex env via `pnpm convex env set`
- `STRIPE_WEBHOOK_SECRET` — in Convex env via `pnpm convex env set`
- Both also in `.env.local` if needed by any Next.js server component (unlikely — Stripe calls go through Convex)

---

### Virtual Currency / Coin Ledger

**Recommendation:** Append-only `coinLedger` table in Convex, balance computed by query.

**Schema:**
```typescript
coinLedger: defineTable({
  userId: v.id("users"),
  amount: v.number(),        // positive = credit, negative = debit
  reason: v.string(),        // "purchase", "game_reward", "cosmetic_spend"
  metadata: v.optional(v.object({
    stripeSessionId: v.optional(v.string()),
    cosmeticId: v.optional(v.id("cosmetics")),
    gameId: v.optional(v.string()),
  })),
  createdAt: v.number(),
}).index("by_user", ["userId"]),
```

**Balance query:** sum all `amount` values for a `userId` using `.collect()` + reduce. For users with large ledger histories, add a periodic balance snapshot via Convex cron + scheduled function.

**Why append-only:** Convex mutations are ACID but optimistic updates on a mutable `balance` field break under concurrent coin-earning events (e.g., game reward fires while a purchase is processing). An immutable ledger means every credit/debit is a new row — no update conflicts. This is verified best practice from Convex's own documentation on transactional integrity.

**Idempotency:** Each Stripe `checkout.session.completed` event carries a unique `session.id`. The `creditCoins` mutation queries `coinLedger` for any existing row with `metadata.stripeSessionId` before inserting. If found, it returns early. This guards against Stripe delivering the webhook more than once.

---

### Cursor Cosmetics (Skin + Trail) — Global Application

**Recommendation:** CSS `cursor` property for skins; `motion` library portal for trails; both applied from a single `<CosmeticsProvider>` client component wrapping the app.

**How skins work:**
```css
/* Each skin is a data URL or CDN URL set as CSS custom property */
[data-cursor-skin="neon-ring"] { cursor: url('/cursors/neon-ring.cur') 16 16, auto; }
[data-cursor-skin="galaxy"]    { cursor: url('/cursors/galaxy.cur') 16 16, auto; }
```
`CosmeticsProvider` reads the user's equipped skin from Convex (`useQuery(api.cosmetics.getEquipped)`) and sets `document.documentElement.dataset.cursorSkin = skin.id`. This cascades globally. `.cur` files or SVG-encoded `cursor: url()` values are the correct web standard — no JavaScript event listeners required for the skin itself.

**How trails work:**
- A `<CursorTrail>` component rendered as a React portal on `document.body` listens to `mousemove` via a global event listener.
- It maintains a ring buffer of N recent positions (e.g., 8 dots).
- Each dot is a `motion.div` with a `useSpring`-animated position and a CSS `opacity` that decays based on dot index.
- `motion` (framer-motion successor) provides `useMotionValue` and `useSpring` for this pattern — both available in the renamed `motion` package.
- `pointer-events: none` on all trail elements prevents interference with game input.
- Inside the game iframe, the trail cannot follow the cursor (iframes block `mousemove` on the parent). This is expected and acceptable — trail is a platform chrome feature.

**Theme cosmetics:**
`next-themes` (already installed) supports arbitrary named themes: `themes={['default', 'midnight', 'candy', 'forest']}`. Each theme maps to a `data-theme` attribute on `<html>` and a corresponding CSS variable block. `CosmeticsProvider` calls `setTheme(user.equippedTheme)` from the `useTheme()` hook.

---

### Game Shell / iframe Embedding

**Recommendation:** `<iframe>` with explicit `sandbox` attributes, managed by a `GameShell` React component. No third-party embedding library.

**Why iframe over Web Components or dedicated pages:**
- Games are external and independently deployed — iframe is the only isolation boundary that works for arbitrary origins without requiring games to be built in the same framework.
- Web Components require game authors to adopt a specific API contract. Iframe is zero-dependency from the game's perspective.
- Dedicated Next.js pages per game would require the game's bundle to be imported into this repo — violates the "platform-agnostic" constraint.

**Implementation pattern:**
```typescript
// src/components/game-shell.tsx
<iframe
  src={game.url}
  sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen allow-forms"
  allow="fullscreen; pointer-lock"
  className="w-full h-full border-0"
  title={game.name}
/>
```

**Fullscreen:** Call `gameContainerRef.current.requestFullscreen()` on the wrapping div (not the iframe) so the ESC overlay stays in DOM scope. The `fullscreenchange` event drives overlay visibility.

**ESC overlay:** A React portal rendered at `document.body` level with `position: fixed; z-index: 9999`. Listens for `keydown` with `key === "Escape"` while in-game route is active. Unfocuses iframe first (`document.activeElement.blur()`) to capture the key event before the browser handles ESC for fullscreen exit.

**Platform API to games:** Pass data via `postMessage` from the platform to the iframe. Define a typed message protocol:
```typescript
type PlatformMessage =
  | { type: "USER_INFO"; userId: string; username: string; coinBalance: number }
  | { type: "GAME_OVER"; score: number }   // game → platform
  | { type: "COIN_AWARD"; amount: number } // game → platform (platform validates)
```
Games listen for `window.addEventListener("message", ...)` and validate `event.origin` matches the trusted platform origin. Coin awards from games go to a Convex mutation that validates the award is within per-game limits.

---

### Real-Time Presence

**Recommendation:** Convex-native. A `presence` table with TTL-based staleness detection, updated by client heartbeat.

**Schema:**
```typescript
presence: defineTable({
  userId: v.id("users"),
  status: v.union(v.literal("online"), v.literal("in-game"), v.literal("idle")),
  gameId: v.optional(v.string()),
  lastSeen: v.number(),
}).index("by_user", ["userId"]),
```

**Heartbeat:** Client runs `useMutation(api.presence.upsert)` on an interval (every 15s). When navigating into a game, status flips to `"in-game"` with `gameId`. When idle (no mouse/keyboard for 60s), client sends `"idle"`.

**Subscription:** The multiplayer section uses `useQuery(api.presence.listActive)` which filters `lastSeen > Date.now() - 30000`. Convex re-runs this query reactively on any presence table change, so all connected clients see updates within ~100ms. No additional socket library needed.

**Stale cleanup:** A Convex cron runs every 5 minutes to delete rows where `lastSeen < Date.now() - 120000`. This prevents the table from growing unbounded.

---

### Store / E-Commerce UI

**Recommendation:** Tailwind CSS grid + existing Radix UI primitives. No e-commerce library.

The store is a browse-and-buy interface for virtual items using virtual currency — no shipping, no addresses, no tax, no cart abandonment flows. A real-money coin purchase uses Stripe Checkout (handled by the payment integration above) and is a single-step flow: pick a coin bundle, redirect to Stripe, return. The cosmetic store itself is fully in-app using coins.

Grid layout: `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`. Each item card is a custom component with preview thumbnail, coin price, and equip/buy button. Radix `Dialog` handles the item detail modal.

---

## What NOT to Use

- **Pusher / Ably / Socket.io** — Convex WebSocket subscriptions already provide real-time delivery. Adding a second real-time layer creates dual-source-of-truth problems and extra cost. Convex presence is sufficient for online/in-game/idle at platform scale.

- **Redux / Zustand / Jotai** — React Compiler is active; the project already uses Convex reactive queries as the client state layer. A global state store would duplicate Convex query results and create staleness bugs. Use Convex query results + React context for UI-only ephemeral state (cosmetics provider, game shell state).

- **Stripe Elements / @stripe/react-stripe-js** — Only needed for embedded payment forms. Stripe Checkout hosted page is correct here: simpler integration, Stripe handles PCI compliance, fewer moving parts in the app.

- **Canvas-based cursor trails (raw Canvas API)** — Works but requires manual animation loop, hit-testing, and devicePixelRatio handling. The `motion` library's spring-animated `div` approach is less code, React-idiomatic, and performs at 60fps for N <= 12 trail dots.

- **Web Components for game embedding** — Requires all game authors to implement a specific web component API. iframe + postMessage is the zero-friction contract for external game authors.

- **next-auth or any other auth library** — Better Auth is locked in; do not add a second auth layer.

- **Prisma / Drizzle / any ORM** — Convex is the only database. There is no SQL layer.

- **React Query / SWR** — Convex's `useQuery` replaces both. Adding either creates a second cache that fights Convex's optimistic update system.

---

## Installation Commands

```bash
# Add Stripe server SDK (goes in Convex actions)
pnpm add stripe

# Add motion for cursor trail animations
pnpm add motion

# @stripe/stripe-js — only if you later switch to embedded Stripe Elements
# pnpm add @stripe/stripe-js

# All other needed libraries are already installed:
# next-themes, convex-helpers, radix-ui/* — already in package.json
```

Set required Convex environment variables:
```bash
pnpm convex env set STRIPE_SECRET_KEY sk_live_...
pnpm convex env set STRIPE_WEBHOOK_SECRET whsec_...
```

---

## Sources

- Convex HTTP Actions: https://docs.convex.dev/functions/http-actions (verified HIGH)
- Convex Optimistic Updates: https://docs.convex.dev/client/react/optimistic-updates (verified HIGH)
- Convex Transactions & Best Practices: https://docs.convex.dev/understanding/best-practices (verified HIGH)
- Convex Scheduled Functions: https://docs.convex.dev/scheduling/scheduled-functions (verified HIGH)
- Stripe Checkout Session API: https://docs.stripe.com/api/checkout/sessions (verified HIGH — API version 2026-04-08)
- Stripe Webhook Verification: https://docs.stripe.com/billing/quickstart (verified HIGH)
- Stripe Metadata Patterns: https://docs.stripe.com/metadata/use-cases (verified HIGH)
- next-themes custom themes: Context7 /pacocoursey/next-themes (verified HIGH)
- convex-helpers sessions: Context7 /get-convex/convex-helpers (verified HIGH)
- motion library: Context7 /websites/motion_dev (resolved HIGH)
- stripe-node version: Context7 /stripe/stripe-node — v19.1.0 (verified HIGH)
