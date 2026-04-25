# Pitfalls Research: Gami

**Domain:** Browser gaming platform with virtual economy, cosmetics, and multiplayer presence
**Researched:** 2026-04-25
**Confidence:** HIGH (Convex-specific from official guidelines + first-principles verified against known production incidents)

---

## Critical Pitfalls

### CRIT-1: Non-Atomic Coin Credit After Payment

**Risk:** HIGH

**What goes wrong:** Stripe sends a `checkout.session.completed` webhook. Your handler runs an Action (required to call Stripe's API), reads the user's balance inside the Action, adds the purchased coins, and writes back. Actions do NOT have database transactions — `ctx.db` is not available inside actions. So the pattern is: action calls `ctx.runQuery` to read balance, then `ctx.runMutation` to write. Between those two calls another request can race in and read the stale balance. Result: two concurrent purchases both read balance=0, both write balance=100, net coins earned=100 instead of 200.

**Why it happens in Convex specifically:** Actions are the only place you can call external APIs (Stripe). But actions are NOT transactions. The correct pattern is: do ALL balance modification inside a single `internalMutation` that reads AND writes atomically. Never read balance in the action then pass it as an arg to a mutation.

**Prevention:**
- Webhook action does only: (a) verify Stripe signature, (b) extract `paymentIntentId` + `coinsToCredit`, (c) call `ctx.runMutation(internal.economy.creditCoins, { paymentIntentId, coinsToCredit, userId })`
- The mutation reads current balance and writes new balance in one atomic transaction
- The mutation also writes the `paymentIntentId` to a `payments` table as part of the same transaction (idempotency key)
- If the mutation is retried with the same `paymentIntentId`, it reads the existing record and exits early — no double credit

**Warning signs:**
- Coin balance mutations that accept `currentBalance` as an argument from the caller
- Any action that does `const user = await ctx.runQuery(...); await ctx.runMutation(..., { newBalance: user.coinBalance + amount })`

**Phase to address:** Payment integration phase (before any real-money transactions go live)

---

### CRIT-2: Stripe Webhook Replay and Double-Credit

**Risk:** HIGH

**What goes wrong:** Stripe retries webhooks when your endpoint returns non-200 or times out. If your handler credited coins but then crashed before returning 200, Stripe retries and credits again. Additionally, Stripe guarantees at-least-once delivery, not exactly-once. Without idempotency enforcement you will double-credit on retries.

**Why it happens:** Teams verify the signature and call the mutation but don't persist the event ID before returning 200. If the mutation succeeds but the HTTP response delivery fails, the retry re-credits.

**Prevention:**
- Use Stripe's `checkout.session.id` (or `payment_intent.id`) as your idempotency key
- In the `creditCoins` mutation: first check `ctx.db.query("payments").withIndex("by_stripe_id", q => q.eq("stripeId", args.stripeId))` — if a record exists, return early
- Insert the payment record AND update balance in the same mutation (one atomic write)
- Return HTTP 200 from the webhook action ONLY after the mutation commits

**Warning signs:**
- No `payments` or `coinTransactions` table in the schema
- Webhook handler that calls Stripe API or sends email inside the same action before persisting the event

**Phase to address:** Payment integration phase

---

### CRIT-3: Client-Controlled Coin Awards (Earn In-Game)

**Risk:** HIGH

**What goes wrong:** Game iframes call `postMessage` with `{ type: "AWARD_COINS", amount: 500 }`. The platform shell listens and calls a Convex mutation with that amount. A player opens DevTools, calls `window.parent.postMessage({ type: "AWARD_COINS", amount: 999999 }, "*")`, and has unlimited coins.

**Why it happens:** Trusting the iframe as a source of truth for economic events. The iframe knows "game over" but should NOT be the authority on how many coins that earns.

**Prevention:**
- Coins are NEVER awarded based on client-reported amounts. The server determines awards.
- Games report events (e.g., `{ type: "GAME_OVER", score: 142, gameId: "pixel-rush" }`). The server applies a deterministic, server-side formula: `coins = Math.min(Math.floor(score / 10), MAX_PER_GAME_SESSION)`.
- Server enforces a per-session cap (e.g., max 50 coins per game session) to bound abuse even if score is spoofed.
- The mutation validates: `userId` comes from `ctx.auth.getUserIdentity()`, never from the message payload.

**Warning signs:**
- Any mutation with an argument like `v.number()` for `coinsAmount` called directly from client postMessage handlers
- No `MAX_COINS_PER_SESSION` constant enforced server-side

**Phase to address:** Game integration + coin earning implementation

---

### CRIT-4: postMessage Origin Spoofing

**Risk:** HIGH

**What goes wrong:** Platform shell registers `window.addEventListener("message", handler)` without checking `event.origin`. Any page (phishing site, ad network, injected script) that has a reference to your window can fire arbitrary messages and trigger coin awards, cosmetic unlocks, or navigation.

**Why it happens:** It's easy to forget the origin check, and it works fine in development where origin is localhost.

**Prevention:**
- ALWAYS validate `event.origin` against an allowlist of known game origins before processing any message
- Maintain a server-side registry of allowed game origins (or derive from the iframe `src` you set)
- Pattern: `if (!ALLOWED_GAME_ORIGINS.includes(event.origin)) return;`
- For games hosted on the same domain, still check: `if (event.origin !== window.location.origin) return;`
- Never use `targetOrigin: "*"` when posting messages TO the iframe that contain session tokens or capabilities

**Warning signs:**
- `window.addEventListener("message", (e) => { /* no origin check */ })`
- Posting messages with `iframe.contentWindow.postMessage(data, "*")`

**Phase to address:** Game shell / integration layer (first iframe implementation)

---

### CRIT-5: iframe Sandbox Attribute Missing

**Risk:** HIGH

**What goes wrong:** An external game (or a future third-party game) contains malicious script that reads `document.cookie`, accesses `localStorage` for session tokens, or navigates `window.top` away from the platform. Without `sandbox`, the iframe has full same-origin privileges if hosted on your domain, or reduced (but not minimal) privileges if cross-origin.

**Why it happens:** Teams add `<iframe src={gameUrl} />` and it works, so no one adds sandbox.

**Prevention:**
- All game iframes must use `sandbox="allow-scripts allow-same-origin"` at minimum
- If games need forms: add `allow-forms`
- Do NOT add `allow-top-navigation` — this lets the game redirect the parent page
- Do NOT add `allow-same-origin` if the game is hosted on your own domain (it bypasses sandbox for same-origin)
- Prefer hosting external games on a separate domain/subdomain (`games.zentro.gg`) so `allow-same-origin` is inert
- Set `Content-Security-Policy: frame-src` to allowlist only known game origins

**Warning signs:**
- `<iframe src={url} />` without `sandbox` prop
- Games hosted on same apex domain as the platform

**Phase to address:** Game shell implementation

---

## Virtual Economy Pitfalls

### ECON-1: No Coin Transaction Ledger

**Risk:** HIGH

**What goes wrong:** Balance is stored as a single integer on the user document. When a bug double-awards or a chargeback occurs, you have no history to audit, no way to reconstruct correct balance, and no way to reverse specific transactions.

**Prevention:**
- Store balance as a derived value: the sum of a `coinTransactions` table, OR maintain a balance field updated only by mutation that also inserts a ledger entry atomically
- Every credit and debit creates a row: `{ userId, delta, type: "purchase"|"earn"|"spend"|"refund"|"admin_adjust", referenceId, timestamp }`
- Balance = always read from user document (for performance), but mutations always write BOTH the ledger entry and the updated balance in the same Convex mutation (atomic)

**Warning signs:**
- Schema has `coinBalance: v.number()` on user document with no separate transactions table
- Mutations that call `ctx.db.patch("users", userId, { coinBalance: newBalance })` without a corresponding ledger insert

**Phase to address:** Before any coin award logic is written

---

### ECON-2: Refund Without Balance Lock

**Risk:** MEDIUM

**What goes wrong:** Player buys cosmetic for 100 coins, issues chargeback with Stripe (or support refund). Your refund handler deducts 100 coins. But the player's balance might have been 80 (they spent coins after the purchase). Balance goes to -20 — you've created negative balance debt with no enforcement to prevent further spending.

**Prevention:**
- All "spend" mutations check: `if (user.coinBalance < cost) throw new ConvexError("Insufficient balance")`
- For chargebacks: accept negative balance is possible but flag the account for review rather than silently going negative
- OR: maintain a `pendingChargebackAmount` field and block purchases while a chargeback is pending
- Do NOT assume you can always claw back coins — design your economy to accept some loss

**Warning signs:**
- Spend mutations that do not check current balance before deducting
- No account status field for flagging problematic accounts

**Phase to address:** Store / cosmetics purchase flow

---

### ECON-3: Earn Rate Exploit via Session Farming

**Risk:** MEDIUM

**What goes wrong:** Player opens 10 browser tabs, each running a game session. Each session earns coins at the same rate. Player farms 10x the intended earn rate with no skill involved.

**Prevention:**
- Server enforces a global per-user earn cooldown: after earning coins from a game session, the user cannot earn from another session start for N minutes
- OR: enforce a daily cap (`maxCoinsPerDay`) tracked server-side, reset by a cron job
- Track `lastEarnAt` and `dailyCoinsEarned` on the user record
- Cooldowns and caps are enforced in the `internalMutation` that awards coins, not in client code

**Warning signs:**
- No rate limiting on coin award mutations
- `coinsEarned` based purely on time-in-game (which tabs can fake by staying open)

**Phase to address:** Coin earn implementation

---

### ECON-4: Store Item Double-Purchase

**Risk:** MEDIUM

**What goes wrong:** Player rapidly double-clicks "Buy" button. Two purchase requests reach Convex within milliseconds. Both read balance = 200, both check "enough balance? yes", both deduct 100 and insert the owned cosmetic. Player now owns the item twice and was charged 200 coins total — but if the item grants a duplicate entry in the owned table, the inventory is corrupted.

**Prevention:**
- Purchase mutation: `const existing = await ctx.db.query("ownedCosmetics").withIndex("by_user_and_item", q => q.eq("userId", userId).eq("itemId", args.itemId)).unique()` — if exists, throw or return early
- Convex transactions guarantee serialization — if two mutations read then write the same user doc, one will win and the other will see the updated state on re-read (Convex uses OCC — optimistic concurrency control, with automatic retries on conflict)
- Add a unique index on `(userId, itemId)` in the `ownedCosmetics` table to make duplicates impossible at the database level

**Warning signs:**
- No uniqueness constraint on owned item records
- Purchase button without client-side debounce (defense in depth, not primary protection)

**Phase to address:** Store purchase flow

---

## Cosmetics Performance Pitfalls

### COSM-1: Cursor Trail Causing Paint Thrashing

**Risk:** HIGH

**What goes wrong:** Cursor trail is implemented by listening to `mousemove` and appending DOM elements or updating CSS variables. At 120Hz displays with fast mouse movement this fires hundreds of events per second. Using `setState` or direct DOM manipulation on every `mousemove` without throttling causes the browser to repaint every frame, dropping frame rate for the game canvas running beneath.

**Prevention:**
- Trail elements must use CSS `transform: translate()` ONLY — never `top/left` (forces layout reflow)
- Throttle trail updates to animation frames: wrap the trail update in `requestAnimationFrame`, skip if a frame is already queued
- Use a pooled set of DOM nodes (object pool pattern) — never create/destroy elements on every tick
- Prefer CSS animations on pooled elements (opacity fade, scale) over JS-driven per-frame updates
- Consider `canvas` overlay for the trail instead of DOM elements — a single canvas paint is cheaper than N DOM element updates

**Warning signs:**
- `mousemove` handler that calls `setState`, `document.createElement`, or updates layout properties (`top`, `left`, `width`, `height`)
- Trail that creates elements with `document.createElement` on every move event

**Phase to address:** Cosmetics rendering implementation

---

### COSM-2: Global Theme Switching Flash (FOUC)

**Risk:** MEDIUM

**What goes wrong:** Theme is stored in Convex (loaded async). On page load, the default theme renders for 200-400ms before the user's theme loads. This "flash of unstyled/wrong-themed content" is especially bad on protected routes where Convex query data is loading. In dark mode, this manifests as a white flash.

**Prevention:**
- Store theme preference in a cookie or `localStorage` as well as Convex
- In the root layout (server component), read the cookie and inject the theme class/CSS variable synchronously before hydration: `<html className={cookieTheme}>`
- The Convex subscription updates the cookie when theme changes — so the next page load is instant
- Use Tailwind's `dark:` variant with a class on `<html>` rather than CSS-in-JS to avoid runtime style injection flashes

**Warning signs:**
- Theme loaded exclusively from Convex `useQuery` with no server-side fallback
- Theme applied via `useEffect` (runs after hydration, guaranteeing a flash)

**Phase to address:** Cosmetics system + theme implementation

---

### COSM-3: Cursor Trail Breaking in iframes

**Risk:** MEDIUM

**What goes wrong:** The cursor trail listens to `mousemove` on the platform document. When the mouse moves into the game iframe, `mousemove` events stop firing on the parent document (the iframe captures pointer events). Trail freezes mid-screen and the last trail segment lingers visibly.

**Prevention:**
- On `mouseleave` on the iframe container element, hide/fade out the trail immediately
- Listen to `pointerleave` on the iframe wrapper `div`, not the iframe itself
- When the game sends a `postMessage` with cursor position data (if implemented), use that to continue trail rendering — but this adds complexity; simpler to just hide the trail on iframe hover
- Use `pointer-events: none` on the trail overlay to prevent the trail canvas from accidentally eating mouse events

**Warning signs:**
- Trail only listens to `document.addEventListener("mousemove")` with no handling for iframe boundary

**Phase to address:** Game shell + cosmetics integration

---

### COSM-4: CSS Variable Scope Leaking Into Games

**Risk:** LOW

**What goes wrong:** Platform themes use CSS custom properties (`--color-primary`, `--bg-surface`) set on `:root`. Game iframes on the same origin inherit these variables. A game that reads `var(--color-primary)` for its own UI gets the platform theme color — unintended, and potentially wrong after theme switches.

**Prevention:**
- Scope platform CSS variables under a class: `.zentro-platform { --color-primary: ... }` applied to the platform shell wrapper, NOT `:root`
- Game iframes in cross-origin contexts don't inherit parent CSS at all (separate browsing context)
- For same-origin games: document this as a known behavior and ensure game CSS is scoped

**Warning signs:**
- CSS variables defined on `:root` or `body` globally
- Games hosted on the same domain as platform

**Phase to address:** Theme system implementation

---

## Game Embedding Security

### EMBED-1: Insufficient Content Security Policy

**Risk:** HIGH

**What goes wrong:** Without CSP `frame-src`, any website can load and control your platform in their own iframe. Without `frame-ancestors`, click-jacking attacks can trick users into making purchases. Without restricting what your game iframes can load, a compromised game can exfiltrate data.

**Prevention (specific headers for Gami):**
```
Content-Security-Policy:
  frame-ancestors 'self';                    // Prevents Gami from being iframed on other sites
  frame-src 'self' https://games.zentro.gg;  // Only allowed game origins
  script-src 'self' 'nonce-{random}';        // Prevent XSS in platform shell
```
- Set `X-Frame-Options: SAMEORIGIN` as fallback for older browsers (already in CLAUDE.md best practices)
- Validate all game URLs server-side before rendering them in `<iframe src>` — never accept arbitrary user-supplied game URLs

**Warning signs:**
- No CSP header set
- Game URL comes from URL params or user input without validation against a server-side allowlist
- Platform can be iframed on any third-party site

**Phase to address:** Game shell implementation (before any games go live)

---

### EMBED-2: Trusting iframe Load Events for Game State

**Risk:** MEDIUM

**What goes wrong:** Platform starts a game session (creates a DB record, starts a timer) when it detects the iframe's `load` event. But `load` fires when the iframe HTML loads — not when the game is actually ready or the player has started. Session timer runs while the loading screen is showing. Player gets shortchanged on session time.

**Prevention:**
- Game signals readiness via `postMessage({ type: "GAME_READY" })` after its own initialization
- Platform only starts the session timer after receiving and validating the `GAME_READY` message from the correct origin
- Have a fallback timeout: if `GAME_READY` doesn't arrive within 10 seconds, surface an error to the user rather than silently timing out

**Warning signs:**
- Session start logic tied to `iframe.onload`

**Phase to address:** Game shell implementation

---

### EMBED-3: Game Shell Navigation Away

**Risk:** MEDIUM

**What goes wrong:** A malicious or buggy game calls `window.top.location = "https://phishing.example.com"`. Without sandbox restrictions, this works and redirects the entire platform shell.

**Prevention:**
- `sandbox` attribute WITHOUT `allow-top-navigation` prevents this completely
- This is a subset of CRIT-5 but worth calling out separately as the consequence (phishing redirect) is distinct from XSS

**Phase to address:** First iframe implementation

---

## Real-Money Purchase Pitfalls

### PAY-1: Fulfilling Purchases Before Payment Confirmation

**Risk:** HIGH

**What goes wrong:** Platform optimistically credits coins when the Stripe Checkout redirects to the success URL (`/success?session_id=xxx`). The success URL is visible to anyone who modifies it — Stripe's session ID is not a secret proof of payment. A player can guess or reuse session IDs to trigger credits without paying.

**Prevention:**
- NEVER fulfill purchases on the success URL redirect
- Fulfill ONLY from the `checkout.session.completed` webhook, after signature verification with `stripe.webhooks.constructEvent`
- The success page shows: "Payment processing — your coins will appear shortly"
- Use Stripe's webhook to credit coins, then Convex real-time subscription updates the UI automatically

**Warning signs:**
- Success redirect handler that calls a Convex mutation to add coins
- Any fulfillment logic that reads from URL params

**Phase to address:** Payment integration

---

### PAY-2: Webhook Signature Verification in Wrong Runtime

**Risk:** HIGH

**What goes wrong:** Stripe webhook verification with `stripe.webhooks.constructEvent` requires the raw request body as a `Buffer` — not JSON-parsed. Next.js App Router with `bodyParser: true` (the default) parses the body before your handler sees it, destroying the raw bytes needed for HMAC verification. Signature verification fails for every webhook, or you disable verification to make it "work."

**Prevention:**
- Stripe webhooks in this stack must be received by a Convex `httpAction` (in `convex/http.ts`), not a Next.js API route
- In the `httpAction`: `const body = await req.bytes()` gets raw bytes, then pass to Stripe's verification
- Never parse the body as JSON before calling `stripe.webhooks.constructEvent`
- The `httpAction` approach is correct for this stack — Convex handles the raw body correctly

**Warning signs:**
- Stripe webhook endpoint defined as a Next.js API route without `export const config = { api: { bodyParser: false } }`
- Any `JSON.parse(body)` before calling `stripe.webhooks.constructEvent`

**Phase to address:** Payment integration

---

### PAY-3: No Chargeback / Fraud Strategy

**Risk:** MEDIUM

**What goes wrong:** Player buys $20 of coins, spends them on cosmetics, then issues a chargeback. You lose the $20, pay a chargeback fee (~$15), and the player has the cosmetics. At scale (even 1% of users), this breaks unit economics.

**Prevention:**
- Require email verification before allowing purchases (already in stack with Better Auth)
- Consider a minimum account age (e.g., account must be 24 hours old) before real-money purchases are allowed
- Store purchase history with Stripe Customer ID linked to Gami user — enables detecting repeat chargebacks
- On chargeback: flag the account, soft-lock the cosmetics (they still render but are flagged), open support ticket
- Accept some loss rate in unit economics — trying to prevent all fraud with friction will hurt honest users more

**Warning signs:**
- No `stripeCustomerId` stored on user record
- Purchases allowed immediately after account creation

**Phase to address:** Payment integration + store launch

---

## Real-Time Presence Pitfalls

### PRES-1: Ghost Sessions After Network Drop

**Risk:** HIGH

**What goes wrong:** Player closes their laptop (network drops without a clean disconnect). The Convex subscription closes but the server-side presence record (`status: "online"`) remains. 5 minutes later, the multiplayer lobby shows the player as "online" or "in-game" — a ghost. Other players try to invite them, get no response.

**Prevention:**
- Presence uses a heartbeat pattern: client sends a `updatePresence` mutation every 30 seconds
- Server-side: `lastHeartbeatAt` timestamp on a dedicated `presence` table (NOT on the user document — see Convex guideline on separating high-churn data)
- A Convex cron job runs every 60 seconds, queries `presence` records where `lastHeartbeatAt < Date.now() - 90_000`, and marks them as `status: "offline"`
- On client disconnect (detected via `useConvexConnectionState` or page `visibilitychange`), immediately call the `setOffline` mutation

**Warning signs:**
- Presence stored on the `users` table document (not a separate table)
- No heartbeat mechanism — presence only updated on explicit user actions
- No cron job to clean up stale presence

**Phase to address:** Multiplayer presence implementation

---

### PRES-2: Thundering Herd on Reconnect

**Risk:** MEDIUM

**What goes wrong:** Server briefly restarts or Convex deployment is pushed. All connected clients lose their WebSocket connection simultaneously. All clients retry with exponential backoff starting from 0. All 100+ clients reconnect within 500ms and all simultaneously call `setOnline` mutation + subscribe to presence queries. The burst overwhelms Convex mutation throughput and causes query invalidation storms.

**Prevention:**
- Convex's client SDK has built-in reconnection with jitter — do NOT disable or override this behavior
- Do NOT implement your own WebSocket reconnection logic on top of Convex — the client library handles it
- Heartbeat mutations should be scheduled with jitter: `setTimeout(sendHeartbeat, 30000 + Math.random() * 5000)` so clients don't all fire at once even after reconnect
- Presence subscriptions should use a single query for the relevant lobby/room, not N individual per-user subscriptions

**Warning signs:**
- Custom WebSocket reconnection logic
- N separate `useQuery(api.presence.getUser, { userId })` calls in a list component instead of one `useQuery(api.presence.getMultiple, { userIds })`

**Phase to address:** Multiplayer presence implementation

---

### PRES-3: Presence on the User Document (Convex-Specific)

**Risk:** HIGH (Convex-specific)

**What goes wrong:** Status and `lastSeen` stored on the `users` table document. Every heartbeat (every 30s) patches the user document. Every mutation to the user document invalidates ALL queries that read from it — including profile queries, balance queries, settings queries. Any component subscribed to the user document re-renders every 30 seconds across the entire app.

**Why it matters in Convex:** Convex's reactive query system re-runs and re-delivers query results whenever any document read by that query is modified. High-churn writes to a shared document pollute read caches for every subscriber.

**Prevention:** (directly from Convex official guidelines)
- Create a dedicated `presence` table: `{ userId, status, lastHeartbeatAt, currentGameId }`
- Index: `by_userId` on this table
- Profile/balance queries read only from `users` table — unaffected by heartbeat writes
- Presence queries read only from `presence` table — scoped invalidation

**Warning signs:**
- `status: v.string()` or `lastSeen: v.number()` fields on the `users` table schema
- Heartbeat mutations that `ctx.db.patch` the users document

**Phase to address:** Before presence table schema is committed (day one of presence work)

---

## Convex-Specific Gotchas

### CVX-1: Using Action to Read-Then-Write Balance (Already Flagged as CRIT-1)

See CRIT-1. The core rule: never split a read-then-write across an action boundary. All balance modifications must be a single `internalMutation`.

---

### CVX-2: Calling Public Mutations from Webhooks

**Risk:** HIGH

**What goes wrong:** Stripe webhook calls `api.economy.creditCoins` (a public mutation). This mutation is exposed on the public Internet. Anyone with the Convex deployment URL can call it with arbitrary `{ userId, amount }` args. Even if you check Stripe's signature in the action, the mutation itself has no way to verify it came from the webhook action and not a direct client call.

**Prevention:**
- Stripe webhook action calls `internal.economy.creditCoins` — an `internalMutation`
- Internal functions are NOT callable from outside the Convex deployment — only from other Convex functions
- NEVER use public `mutation` for any function that performs financial operations server-side

**Warning signs:**
- `api.economy.*` functions that award coins
- Any financial mutation not prefixed with `internal`

**Phase to address:** Economy implementation (schema and function design)

---

### CVX-3: Unbounded Coin Transaction History Query

**Risk:** MEDIUM

**What goes wrong:** `ctx.db.query("coinTransactions").filter(q => q.eq(q.field("userId"), userId)).collect()` loads the entire transaction history of a user. After 1 year of play, a user with 10,000 transactions causes the query to time out (Convex has execution time limits) or return a result that exceeds the response size limit.

**Prevention:**
- Never use `.collect()` on user-scoped transaction queries
- Use `.order("desc").take(50)` for displaying recent history
- For balance computation: NEVER compute balance by summing transactions at query time — maintain a `coinBalance` field updated atomically with each transaction insert
- For admin audits that need full history: paginate using `paginationOptsValidator`

**Warning signs:**
- `.collect()` on any table that grows per-user over time
- Balance computed as `transactions.reduce((sum, t) => sum + t.delta, 0)`

**Phase to address:** Economy implementation

---

### CVX-4: Storing Presence / Heartbeat in the Users Document

See PRES-3. Repeated here because it violates an explicit Convex official guideline and causes pervasive re-render issues that are hard to diagnose after the fact.

---

### CVX-5: Missing Index on Lookup Queries

**Risk:** MEDIUM

**What goes wrong:** `ctx.db.query("ownedCosmetics").filter(q => q.eq(q.field("userId"), userId))` performs a full table scan. Works fine at 100 users. At 10,000 users with 10 cosmetics each (100,000 rows), this query reads every row on every request. Convex will eventually throttle or timeout these queries.

**Prevention:** (directly from Convex official guidelines — "Do NOT use `filter` in queries")
- Define indexes for every query pattern before writing the queries
- `ownedCosmetics` table needs: `.index("by_userId", ["userId"])` and optionally `.index("by_user_and_item", ["userId", "itemId"])`
- `coinTransactions` table needs: `.index("by_userId", ["userId"])`
- `presence` table needs: `.index("by_userId", ["userId"])`

**Warning signs:**
- Any `.filter()` call in Convex query handlers
- Schema tables without indexes for their foreign key fields

**Phase to address:** Schema design (before any query is written)

---

### CVX-6: Using `userId` from Function Arguments for Auth

**Risk:** HIGH

**What goes wrong:** Client calls `api.economy.spendCoins({ userId: "user123", itemId: "cursor-x" })`. The mutation uses `args.userId` to look up the user and deduct balance. A player modifies the call from DevTools, passes another user's `userId`, and spends that user's coins.

**Prevention:** (directly from Convex official guidelines)
- NEVER accept `userId` as a function argument for authorization
- Always: `const identity = await ctx.auth.getUserIdentity()` then look up the user by `identity.tokenIdentifier`
- The only valid source of the acting user's identity is `ctx.auth`

**Warning signs:**
- Any mutation with `userId: v.id("users")` or `userId: v.string()` as a top-level argument used to determine WHO is acting

**Phase to address:** Every function that performs user-scoped writes

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Schema design | Presence fields on user doc; no indexes | Design separate `presence` table, add indexes for all FK fields before writing queries |
| Coin earn (in-game) | Client-controlled award amount; no session cap | Server derives award from score formula; enforce `maxCoinsPerSession` and daily cap |
| Cosmetics store | Double-purchase race; no ledger | Unique index on owned items; insert ledger row + update balance atomically |
| Game shell | postMessage origin not checked; no sandbox | Validate `event.origin`; set `sandbox` without `allow-top-navigation` |
| Stripe payments | Fulfilling on redirect; wrong runtime for signature | Fulfill only from webhook httpAction; use `req.bytes()` not parsed JSON |
| Cursor trail | mousemove causing repaints; iframe boundary | rAF throttle; pooled DOM nodes; hide trail on iframe hover |
| Theme system | FOUC on protected routes | Sync theme to cookie; read cookie in root layout server component |
| Multiplayer presence | Ghost sessions; thundering herd | Heartbeat with cron cleanup; jitter on reconnect; separate presence table |
| Real-money launch | Chargeback abuse; no fraud signals | Email verification required; minimum account age; Stripe Customer ID on user record |

---

## Sources

- Convex official guidelines: `convex/_generated/ai/guidelines.md` (project file, HIGH confidence)
- Convex documentation patterns: function calling, transaction model, query filtering rules (HIGH confidence)
- Stripe webhook documentation: idempotency, raw body requirement for signature verification (HIGH confidence, from direct Stripe documentation knowledge)
- iframe security: MDN `sandbox` attribute, `postMessage` origin validation (HIGH confidence, W3C spec)
- Browser rendering: CSS transform vs layout properties, requestAnimationFrame patterns (HIGH confidence)
- Virtual economy design: transaction ledger pattern, OWASP API security (MEDIUM confidence, established industry patterns)
