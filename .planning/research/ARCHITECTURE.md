# Architecture Research: Gami

**Domain:** Browser-based gaming platform with cosmetics, virtual currency, and real-time presence
**Researched:** 2026-04-25
**Confidence:** HIGH (Convex patterns from official docs; postMessage from MDN; CSS custom property pattern from Next.js docs + established practice)

---

## System Components

### Game Shell
**Responsibility:** Renders external games inside the platform chrome. Provides a fullscreen canvas host, pause overlay (ESC), and the postMessage bridge between game and platform.
**Interfaces:** Connects to the Coin Ledger (to award coins on game events), Presence system (to mark user as "in-game"), and Cosmetics layer (cursor/trail still renders over the iframe).
**Key design decisions:**
- Use `<iframe>` with `sandbox="allow-scripts allow-same-origin"` as the embedding primitive. This is the only approach that provides true game isolation without requiring games to be built as React components or Web Components. Games can be any web technology (Canvas, WebGL, Phaser, etc.).
- The iframe URL points to an external game host (separate origin or subdomain). The platform shell communicates via `window.postMessage()` with strict origin whitelisting.
- Web Components are ruled out — they require the game to be written for that interface. postMessage is the universal game-agnostic contract.
- Dedicated game routes (`/play/[gameSlug]`) in the Next.js App Router. Each route renders the shell with zero chrome (fullscreen canvas) and imports the pause overlay component.

### Coin Ledger
**Responsibility:** Tracks all coin earning, spending, and purchasing. Authoritative source of truth for each user's balance.
**Interfaces:** Written to by: game completion mutations, store purchase mutations, real-money purchase webhooks (Stripe). Read by: profile page, store (affordability check), nav balance display.
**Key design decisions:**
- Use an append-only transaction log, never a mutable balance field. Every coin change is an INSERT, never an UPDATE. Balance is always derived as `SUM(amount)` across the user's transactions. This is non-negotiable for a financial ledger — it prevents race conditions from concurrent mutations, gives full audit history, and makes Convex's optimistic concurrency control safe (append-only writes never conflict).
- Convex mutations are transactional: the transaction log insert and any downstream effects (e.g., unlocking an item) are committed atomically or rolled back together.
- Coin award mutations from games must be `internalMutation` — not callable directly from the client. Games trigger awards via the postMessage bridge → the platform's Next.js layer → a Convex action → `internal.ledger.award`. This prevents a game from calling the award endpoint directly and cheating.
- Balance reads use a derived query: `ctx.db.query("coinTransactions").withIndex("by_user", ...).collect()` then sum `amount` fields. For large histories, consider a periodic cached balance document updated by a cron job, but start simple.

### Cosmetics System
**Responsibility:** Tracks which cosmetics a user owns and which are equipped. Applies active cosmetics (cursor skin, cursor trail, UI theme) globally across all platform pages.
**Interfaces:** Store (purchase unlocks ownership), Profile (equip/unequip), App Root Layout (reads active cosmetics and injects CSS variables and overlay components).
**Key design decisions:**
- Application mechanism: CSS custom properties (`--cursor-url`, `--trail-color`, `--theme-primary`, etc.) set on `<html>` or `<body>` at the root layout level. A single client component (`CosmeticsApplicator`) lives inside `src/app/layout.tsx`, subscribes to `useQuery(api.cosmetics.getEquipped)`, and sets `document.documentElement.style.setProperty(...)` when equipped items change. This is the lowest-overhead approach — one query subscription, no prop drilling, no global store.
- Cursor trail requires a separate overlay `<div>` rendered at the root layout level (outside any route content) with `pointer-events: none; position: fixed; z-index: 9999`. A `useEffect` hook on the `CosmeticsApplicator` adds/removes the trail canvas.
- Themes use CSS custom properties that Tailwind reads via `var(--theme-*)`. Active theme class is also added to `<html>` for dark/light mode semantics.
- Do NOT use React Context for cosmetics state — it would cause the entire tree to re-render on equip change. The CSS custom property approach means only `CosmeticsApplicator` re-renders; everything else reacts purely via CSS cascade.
- The game iframe inherits cursor styles from the parent page because cursor CSS applies at the OS-cursor layer. Trail overlays are rendered in the platform shell above the iframe (z-index stacking). Themes do not need to reach inside the iframe.

### Presence System
**Responsibility:** Tracks each user's current status: `online`, `in-game` (with gameSlug), or `idle`. Surfaces status in the multiplayer section of the home page.
**Interfaces:** Written by the client heartbeat (Next.js). Read by the home page MP section and any future multiplayer lobby.
**Key design decisions:**
- Each user has one row in a `presence` table. On mount, the client runs a mutation to upsert `{ userId, status: "online", lastSeen: Date.now() }`. On unmount (beforeunload / visibilitychange), a "going offline" mutation fires.
- Idle detection: client-side `mousemove`/`keydown` event listeners. After 3 minutes of inactivity, the client itself updates status to `"idle"`. This avoids needing a server-side cron for idle — the client is the source of truth for its own activity.
- Stale presence: a Convex cron job runs every 2 minutes and deletes/marks-offline any presence rows where `lastSeen < Date.now() - 5min`. This handles tab crashes, network disconnects, and browser closes that skip `beforeunload`.
- In-game detection: when the game shell mounts, it fires `api.presence.setStatus({ status: "in-game", gameSlug })`. When it unmounts, it fires `api.presence.setStatus({ status: "online" })`.
- `useQuery(api.presence.listOnline)` in the home page MP section gives a real-time subscriber list. Convex's reactive queries push updates automatically — no polling.

### Store
**Responsibility:** Displays purchasable cosmetics, enforces ownership checks, and processes coin-based purchases.
**Interfaces:** Reads from `storeItems` table. Writes to `ownedItems` and `coinTransactions` tables on purchase. Reads `users.coinBalance` (derived) for affordability checks.
**Key design decisions:**
- No CMS needed for v1. Store items are defined directly in the Convex `storeItems` table, seeded by a one-time mutation or manual dashboard entry. The schema is the CMS. A CMS (Sanity, Contentful) only makes sense when non-engineers need to manage catalog copy and images independently — defer unless explicitly required.
- Store items are static catalog records with: name, description, price (coins), type (cursor/trail/theme), assetUrl, previewUrl. No dynamic pricing.
- Purchase mutation: atomic — checks balance (query), inserts `ownedItems`, inserts negative `coinTransactions` entry. Runs in one Convex mutation so it's all-or-nothing.
- Paginate store listing with `usePaginatedQuery` from the start. Even with a small catalog, this establishes the correct pattern for growth.

### Payment / Real-Money Coins
**Responsibility:** Handles Stripe checkout for coin bundle purchases. Converts successful payment into coin ledger entries.
**Interfaces:** Stripe webhook → Convex HTTP action → `internal.ledger.award`.
**Key design decisions:**
- Stripe Checkout (hosted page) not Stripe Elements. Hosted checkout requires no PCI scope, no card field UI to build.
- Flow: client calls a Convex action to create a Stripe Checkout Session → redirects to Stripe → Stripe fires webhook to Convex HTTP endpoint → `internalMutation` inserts coin award into ledger.
- Never award coins from the client side. Only the webhook handler (verified with Stripe signature) triggers `internalMutation` coin awards.

---

## Data Model (Convex Schema)

### Table: `users`
Extension of the existing Better Auth user record. Stores only platform-specific application data.

```typescript
users: defineTable({
  email: v.string(),
  username: v.optional(v.string()),
  avatarUrl: v.optional(v.string()),
}).index("email", ["email"])
  .index("username", ["username"])
```

### Table: `presence`
One row per user. Upserted (not inserted) on every heartbeat.

```typescript
presence: defineTable({
  userId: v.id("users"),
  status: v.union(v.literal("online"), v.literal("in-game"), v.literal("idle")),
  gameSlug: v.optional(v.string()), // populated when status === "in-game"
  lastSeen: v.number(),             // Date.now() timestamp
}).index("by_userId", ["userId"])
  .index("by_status", ["status"])   // for listing all "online" | "in-game" users
```

### Table: `storeItems`
Static catalog of purchasable cosmetics.

```typescript
storeItems: defineTable({
  name: v.string(),
  description: v.string(),
  type: v.union(v.literal("cursor"), v.literal("trail"), v.literal("theme")),
  priceCoins: v.number(),
  assetUrl: v.string(),     // actual cursor/trail asset
  previewUrl: v.string(),   // thumbnail for store card
  sortOrder: v.number(),    // controls display order
  isActive: v.boolean(),    // soft-disable without deleting
}).index("by_type", ["type"])
  .index("by_active_sort", ["isActive", "sortOrder"])
```

### Table: `ownedItems`
Junction table: which users own which store items.

```typescript
ownedItems: defineTable({
  userId: v.id("users"),
  storeItemId: v.id("storeItems"),
  acquiredAt: v.number(),
}).index("by_user", ["userId"])
  .index("by_user_item", ["userId", "storeItemId"]) // unique ownership check
```

### Table: `equippedItems`
One row per cosmetic slot per user. Upserted on equip.

```typescript
equippedItems: defineTable({
  userId: v.id("users"),
  slot: v.union(v.literal("cursor"), v.literal("trail"), v.literal("theme")),
  storeItemId: v.id("storeItems"),
}).index("by_user", ["userId"])
  .index("by_user_slot", ["userId", "slot"]) // .unique() semantics enforced in mutation
```

### Table: `coinTransactions`
Append-only ledger. Every row is immutable after insert.

```typescript
coinTransactions: defineTable({
  userId: v.id("users"),
  amount: v.number(),      // positive = earn/buy, negative = spend
  type: v.union(
    v.literal("game_reward"),
    v.literal("purchase_real_money"),
    v.literal("store_purchase"),    // negative
    v.literal("admin_grant"),
  ),
  referenceId: v.optional(v.string()), // Stripe session ID, game session ID, etc.
  createdAt: v.number(),
}).index("by_user", ["userId"])
  .index("by_user_created", ["userId", "createdAt"])
```

Balance query: `ctx.db.query("coinTransactions").withIndex("by_user", q => q.eq("userId", userId)).collect()` then `transactions.reduce((sum, t) => sum + t.amount, 0)`.

### Table: `games`
Catalog of available games. Static, seeded once.

```typescript
games: defineTable({
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  iframeUrl: v.string(),    // external URL where game is hosted
  thumbnailUrl: v.string(),
  type: v.union(v.literal("solo"), v.literal("multiplayer")),
  isActive: v.boolean(),
}).index("by_slug", ["slug"])
  .index("by_type_active", ["type", "isActive"])
```

---

## Integration Patterns

### Game Embedding

**The contract between platform and game:**

Platform renders:
```tsx
// src/app/(auth)/play/[slug]/page.tsx
<iframe
  src={game.iframeUrl}
  sandbox="allow-scripts allow-same-origin"
  allow="fullscreen"
  className="w-full h-full border-0"
/>
```

Platform listens for game events:
```typescript
// In the game shell component
useEffect(() => {
  const handler = (event: MessageEvent) => {
    if (event.origin !== TRUSTED_GAME_ORIGIN) return;
    const { type, payload } = event.data;
    switch (type) {
      case "GAME_READY":     // game loaded, remove loading state
      case "COINS_EARNED":   // payload.amount — triggers internal award mutation
      case "GAME_OVER":      // payload.score — triggers presence reset
    }
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}, []);
```

Platform sends to game:
```typescript
iframeRef.current.contentWindow.postMessage(
  { type: "PLAYER_DATA", payload: { userId, username, equippedCosmetics } },
  TRUSTED_GAME_ORIGIN
);
```

**Security:** `TRUSTED_GAME_ORIGIN` is an environment variable. Games must be hosted on a known domain. The `COINS_EARNED` message triggers a Convex action (not a direct mutation) that validates the claim before awarding coins — games cannot award arbitrary amounts.

**Fullscreen:** The platform shell handles fullscreen toggle on the `<div>` wrapping the iframe (not the iframe itself) using the Fullscreen API. ESC key listener on the shell opens the pause overlay by setting local React state.

**Why not Web Components:** Games are external products potentially written in any engine. Requiring them to export a Web Component would couple them to the platform's tech stack. iframes with postMessage is the universal contract.

**Why not dedicated game routes with Next.js pages rendering game components:** Game logic lives outside this repo. The games are not React components. They are standalone web applications.

### Global Cosmetics Application

**Component location:** `src/components/CosmeticsApplicator.tsx` — a `"use client"` component rendered once inside `src/app/layout.tsx`, outside all route groups.

**Mechanism:**

```typescript
// CosmeticsApplicator.tsx
"use client";
export function CosmeticsApplicator() {
  const equipped = useQuery(api.cosmetics.getEquipped); // { cursor?, trail?, theme? }

  useEffect(() => {
    if (!equipped) return;
    const root = document.documentElement;

    if (equipped.cursor) {
      root.style.setProperty("--cursor-url", `url(${equipped.cursor.assetUrl})`);
      root.style.cursor = "var(--cursor-url), auto";
    }
    if (equipped.theme) {
      root.dataset.theme = equipped.theme.slug; // e.g. data-theme="neon-dark"
    }
  }, [equipped]);

  return equipped?.trail ? <CursorTrailOverlay trail={equipped.trail} /> : null;
}
```

**CSS variables** are defined in `globals.css` with defaults. Theme CSS files (one per theme cosmetic) override the variables. Since Tailwind v4 supports CSS variables natively, theme tokens flow through the utility classes without any config changes.

**Trail overlay** is a fixed-position `<canvas>` or `<div>` with `pointer-events: none` at `z-index: 9999`. Uses `requestAnimationFrame` to animate particles following mouse position. Rendered at the root layout level so it persists across route navigations.

**Why not React Context:** Wrapping the App Router layout in a cosmetics context provider would cause the entire subtree to re-render whenever equipped items change. CSS custom properties update via the DOM — zero re-renders for any component other than `CosmeticsApplicator` itself.

**Why not middleware:** Next.js middleware (`proxy.ts`) runs on the Edge runtime and cannot access Convex data. It cannot inject user-specific CSS. Middleware is appropriate only for auth redirects, not personalization.

### Coin Ledger

**Earning coins (game completion):**
```
Game → postMessage(COINS_EARNED) → Shell component
  → ctx.runAction(api.games.reportGameResult, { gameSlug, coinsEarned })
  → action validates claim (max coins per session cap)
  → ctx.runMutation(internal.ledger.award, { userId, amount, type: "game_reward" })
  → inserts row in coinTransactions
```

**Spending coins (store purchase):**
```typescript
// Single atomic Convex mutation
export const purchaseItem = mutation({
  args: { storeItemId: v.id("storeItems") },
  handler: async (ctx, { storeItemId }) => {
    const user = await getAuthUser(ctx);
    const item = await ctx.db.get(storeItemId);

    // Check already owned
    const existing = await ctx.db.query("ownedItems")
      .withIndex("by_user_item", q => q.eq("userId", user._id).eq("storeItemId", storeItemId))
      .unique();
    if (existing) throw new Error("Already owned");

    // Check balance (derived)
    const txns = await ctx.db.query("coinTransactions")
      .withIndex("by_user", q => q.eq("userId", user._id)).collect();
    const balance = txns.reduce((s, t) => s + t.amount, 0);
    if (balance < item.priceCoins) throw new Error("Insufficient coins");

    // Atomic: deduct + grant ownership
    await ctx.db.insert("coinTransactions", {
      userId: user._id, amount: -item.priceCoins,
      type: "store_purchase", referenceId: storeItemId, createdAt: Date.now()
    });
    await ctx.db.insert("ownedItems", {
      userId: user._id, storeItemId, acquiredAt: Date.now()
    });
  }
});
```

**Write conflict note (HIGH confidence, from Convex docs):** The balance-check + deduct pattern within a single mutation is safe. Convex uses optimistic concurrency control (OCC) — if two concurrent mutations both try to read and write the same user's transactions, one will retry automatically. The append-only design minimises the conflict surface to just the moment of the purchase check.

**Real-money coin purchase:**
```
Client → Convex action (createStripeSession) → Stripe Checkout URL
Stripe → POST /api/stripe-webhook (Convex HTTP action)
  → verify Stripe signature
  → ctx.runMutation(internal.ledger.award, { userId, amount, type: "purchase_real_money", referenceId: sessionId })
```

---

## Build Order Implications

The following dependency graph defines what must exist before what can be built:

```
1. SCHEMA + AUTH WIRING
   ├── users table extended
   ├── Better Auth lifecycle hooks updated (onCreateUser creates full user row)
   └── getCurrentUser returns merged auth + app user

2. COIN LEDGER (coinTransactions table + query/mutation layer)
   └── No dependencies except users table
   [Nothing else can use coins until this exists]

3. STORE ITEMS CATALOG (storeItems table + seed data)
   └── Depends on: Schema
   [Must exist before Store UI or purchases]

4. OWNED ITEMS + PURCHASE MUTATION (ownedItems table + purchaseItem mutation)
   └── Depends on: Coin Ledger, Store Items
   [Store UI needs this to be functional]

5. EQUIPPED ITEMS (equippedItems table + equip/unequip mutations)
   └── Depends on: Owned Items
   [Can't equip what you don't own]

6. COSMETICS APPLICATOR (CosmeticsApplicator component in root layout)
   └── Depends on: Equipped Items query
   [Pure UI — needs the query to exist]

7. PRESENCE SYSTEM (presence table + heartbeat mutation + cron)
   └── Depends on: users table
   [Independent of coins/cosmetics — can be built in parallel with steps 3-6]

8. GAME SHELL (game route + iframe + postMessage bridge)
   └── Depends on: Presence (to set in-game status), Coin Ledger (to award coins)
   [Shell is a consumer of both systems]

9. STORE UI
   └── Depends on: Store Items, Owned Items, Coin Ledger (balance display)

10. PROFILE PAGE
    └── Depends on: Equipped Items, Owned Items, Coin Ledger (balance)

11. STRIPE INTEGRATION
    └── Depends on: Coin Ledger (award mutation must exist)
    [Can be built last — earn-only coins work for early testing]
```

**Parallelisable:**
- Presence system (step 7) can be built simultaneously with Store Items + Owned Items (steps 3-5)
- Store UI (step 9) and Profile Page (step 10) can be built in parallel once their data layers exist
- Cosmetics Applicator CSS/UI (step 6) can be scaffolded with stub data before the Convex query exists

**Critical path:** Schema → Coin Ledger → Store Items → Owned Items + Purchase → Equipped Items → (Cosmetics Applicator | Store UI | Profile Page) → Game Shell → Stripe

---

## Confidence Assessment

| Area | Confidence | Source |
|------|-----------|--------|
| iframe + postMessage game embedding | HIGH | MDN official docs, established gaming platform pattern |
| Append-only coin ledger in Convex | HIGH | Convex OCC docs confirm safety; financial ledger pattern is standard |
| CSS custom properties for global cosmetics | HIGH | Next.js docs + CSS cascade is deterministic |
| Convex presence with heartbeat + cron cleanup | HIGH | Convex cron docs + subscription pattern confirmed |
| internalMutation for coin award security | HIGH | Convex internal functions docs explicitly confirm client-inaccessibility |
| No CMS needed for store | MEDIUM | Reasonable for curated catalog; reassess if content editors are needed |
| Stripe Checkout flow via Convex action | MEDIUM | Pattern confirmed in Convex action docs; Stripe specifics not verified in Context7 |
