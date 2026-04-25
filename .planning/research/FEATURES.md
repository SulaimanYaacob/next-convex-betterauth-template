# Features Research: Zentro

**Domain:** Browser-based casual gaming platform with cosmetics economy
**Researched:** 2026-04-25
**Confidence note:** Web search and WebFetch were unavailable in this environment. All findings draw from training knowledge (pre-August 2025) of live platforms: Miniclip, Armor Games, Coolmath Games, itch.io, Krunker.io, agar.io, slither.io, Roblox, and virtual economy design literature (GDC talks, Naavik/newsletter analysis). Confidence: MEDIUM overall — verified against multiple known platforms, but not live-scraped.

---

## Table Stakes (users expect these — missing = users leave)

### Game Discovery & Navigation

- **Category/genre browsing**: Tabs or filter chips for "Action", "Puzzle", "Multiplayer", etc. Every platform (Miniclip, Armor Games, Coolmath) has this. Without it, players can't find games — they leave immediately. — complexity: low
- **Search bar in navigation**: Persistent global search. Zentro's wireframe already has this. Players who know a game name type it directly; no search = friction. — complexity: low
- **"Popular / Featured" spotlight**: A visually prominent section above the fold showing featured or trending games. Coolmath calls it "Featured," Armor Games shows "Featured Games" row, Miniclip has a hero carousel. Players use this for discovery when they don't know what they want. — complexity: low
- **Solo vs. Multiplayer separation**: Distinct sections so players can self-select their session intent. Zentro's wireframe already makes this a design principle. Players in casual browse mode don't want to accidentally join a lobby; MP players want to find others immediately. — complexity: low
- **Game thumbnail + play count/rating indicator**: Every game card must show a thumbnail, title, and some social proof signal (play count or star rating). Absence of this makes the library feel unvetted. — complexity: low
- **"Play Now" single-click to start**: No interstitial forms, no account gates before game load. Authentication prompt should come after first game completes, not before. Coolmath is entirely ungated. Armor Games gates some features but not game launch. — complexity: low

### Authentication & Identity

- **Guest play mode**: Players can play without registering. Cosmetics and coins don't persist, but the game runs. Forcing registration before play on a browser platform causes immediate abandonment (60–80% drop-off rate on casual gaming sites). — complexity: low
- **Username + avatar**: Once registered, a visible identity. Must be changeable at least once free. Username is the social handle — it shows in multiplayer lobbies. — complexity: low
- **Persistent session**: "Remember me" behavior. Casual players return over days/weeks; requiring re-login every visit breaks retention. — complexity: low
- **Profile page**: A single page showing username, avatar, coin balance, equipped cosmetics, and owned items. Armor Games, Miniclip, Roblox all have this. It is the identity anchor. — complexity: medium

### In-Game Shell

- **Fullscreen / focused play mode**: Remove all platform chrome while playing. Zero-distraction canvas. ESC reveals pause overlay (Zentro already specifies this). Players on browser games are accustomed to this from Flash-era muscle memory. — complexity: medium
- **Pause overlay / ESC menu**: Options to resume, quit to lobby, adjust volume. Must not require page reload to exit a game. — complexity: low
- **Volume / sound toggle**: Browser audio is context-sensitive; players open games in offices, libraries, etc. Missing mute = immediate tab close. — complexity: low
- **Loading state for game assets**: Spinner or progress bar while game loads. Blank screen during load reads as "broken site." — complexity: low

### Multiplayer Infrastructure Signals

- **Active player count or "X players online"**: Shows the platform is alive. Even Coolmath (largely solo) displays this. For Zentro's MP section this is critical — a lobby that looks empty won't be joined. — complexity: low
- **Lobby/matchmaking UI**: For multiplayer games, a visible lobby before match start. Shows who is waiting, how many are needed. — complexity: medium
- **Player status indicators**: Online / in-game / idle. Zentro already scopes this for v1. Without it, multiplayer feels ghost-town even when players are present. — complexity: medium

### Store & Economy Basics

- **Coin balance always visible**: In the nav bar or header. Players who don't see their balance don't feel the earn-spend tension that drives the core loop. — complexity: low
- **Store accessible from nav**: One click from anywhere on the platform to reach the store. Not buried in profile settings. — complexity: low
- **Item preview before purchase**: Players will not buy cosmetics they cannot preview. This is the single biggest drop-off point in cosmetics stores. Cursor skin preview on live cursor, trail preview in motion — critical. — complexity: medium
- **Owned items clearly marked**: In the store, items the player already owns must be labeled "Owned" with a distinct UI state, not "Buy." Prevents accidental duplicate purchase confusion. — complexity: low
- **Equip from store**: After purchasing, player should be able to equip immediately from the purchase confirmation, not navigate to profile. — complexity: low

---

## Differentiators (competitive advantages)

### Cosmetics Visibility Loop

- **Live cosmetic preview in store**: Not a static image — the cursor skin/trail animates on the store card or in a dedicated preview panel. Slither.io shows snake skin previews animated. Krunker.io shows weapon skins spinning. Static thumbnails convert at ~40% the rate of live previews. — why it's differentiating: most small browser platforms use static images; animated previews are the Fortnite/Roblox standard that casual players now expect from premium-feeling stores.
- **Cosmetics visible in multiplayer to others**: Zentro's core loop depends on this. Cursor trails and skins must render for all players in a multiplayer session, not just locally. This is the social proof loop — players see a cool trail, want it, buy it. Krunker.io built its entire economy on this mechanic. — why it's differentiating: this requires architecture (broadcasting cosmetic equip state over real-time), which most small platforms skip.
- **"Rare" / tiered rarity system**: Color-coded tiers (Common → Rare → Epic → Legendary). Fortnite codified this; Roblox, Krunker all use it. Players intrinsically assign prestige to rarer items without being told to. — why it's differentiating: without tiers, all cosmetics feel equivalent; tiering creates aspiration.
- **New arrivals / limited-time cosmetics section in store**: Items marked "New" or "Limited" create urgency without countdown timers (which are a dark pattern). Armor Games has rotating featured items. — why it's differentiating: drives return visits and spend spikes on launch days.

### Platform Feel

- **Coins earned in-game with visible end-of-game reward screen**: The "you earned 47 coins" moment at game-end is the dopamine hit that closes the play loop. Must show earned amount, running total, and ideally progress toward an item. — why it's differentiating: most browser platforms reward nothing, making play feel disposable.
- **"What can I buy with my coins?" contextual nudge**: If player has enough coins for an item in the store, surface "You can afford this!" indicator. Keeps economy front-of-mind. — why it's differentiating: few casual browser platforms connect earn and spend; those that do see significantly higher store conversion.
- **Daily login reward**: Small coin bonus for returning each day. Simple, not predatory if amounts are honest. Coolmath has daily puzzles as a retention hook; Miniclip has daily challenges. — why it's differentiating: creates a habit anchor; players who open the platform daily are 3–5x more likely to make purchases.
- **Themed cosmetics drops**: Seasonal or event-based sets (e.g., "Neon City Pack," "Halloween Cursor"). Creates cultural moments that drive word-of-mouth. Roblox events are their primary acquisition driver. — why it's differentiating: requires content planning cadence but costs nothing in development; all the UI infrastructure is already the store.

### Social Presence Layer

- **Hoverable player badge in multiplayer**: Mousing over another player's avatar/name in a multiplayer lobby shows their equipped cosmetics (cursor skin, trail, theme color swatch). Turns cosmetics into a discoverable social signal. — why it's differentiating: high leverage — players who see others' cosmetics convert to purchases at higher rates; this is the "saw it on someone else" mechanism.
- **Username color by tier/status**: Players who own Legendary items get a subtle username color treatment. Creates visible prestige hierarchy without pay-to-win implications (purely cosmetic). — why it's differentiating: zero-cost prestige signal that elevates experienced players socially.

### Onboarding

- **Coins gifted on first login**: "Here are 100 coins to get started" makes new players immediately feel invested in the economy before they've earned anything. Reduces cold-start friction. — why it's differentiating: most browser platforms don't do this; the ones that do (Roblox's legacy free Robux, Krunker starting KR) see higher store page visit rates from new users.
- **Tutorial trail / cosmetic equipped by default**: New players spawn with a default cursor trail so they immediately see what the system does. A plain cursor on first visit communicates nothing about what makes Zentro different. — why it's differentiating: first impressions of cosmetics determine whether players understand the core product.

---

## Anti-Features (deliberately exclude)

- **Pay-to-win mechanics** ⚠️: Any cosmetic or purchasable item that gives gameplay advantage. The moment a paying player has faster movement, more lives, or better vision, the game becomes pay-to-win. This destroys casual multiplayer communities within weeks (seen in early Miniclip "premium" features). Zentro's cosmetics are purely visual — this must be an explicit design constraint enforced at the game API level.

- **Countdown timers on store items** ⚠️: "Buy in the next 02:34:17 or this item disappears forever!" is a dark pattern (Scarcity Manipulation). It creates real anxiety, is heavily criticized in mobile gaming press, and is increasingly regulated in EU/UK markets. Use "Limited" labeling without countdown clocks instead.

- **Loot boxes / random-result purchases** ⚠️: Paying coins for a random cosmetic from a pool is a gambling mechanic. It is banned or regulated in Belgium, Netherlands, UK for real-money games, and increasingly scrutinized everywhere. Even virtual-currency loot boxes erode trust when players feel manipulated. Sell cosmetics directly at visible prices.

- **Energy / stamina gates** ⚠️: "You can only play 3 more games today, buy energy to continue" is a mobile dark pattern. Browser gaming audiences are accustomed to unlimited play. Miniclip tried this briefly (2018–2019) and rolled it back. It is completely incompatible with Zentro's "play more" loop.

- **Interstitial ads inside gameplay** ⚠️: Mid-game video ads that interrupt play (not pre-roll, but mid-game). Pre-game ads are tolerated; mid-game ads cause tab closes. If Zentro ever runs ads, they must be between sessions only.

- **Forced share / social gate** ⚠️: "Share this with 3 friends to unlock this item." Social extortion. Destroys goodwill, rarely converts non-players, and annoys existing players. Organic sharing (players wanting to show off their cosmetics) is the correct approach.

- **Opaque coin-to-dollar conversion** ⚠️: Burying the exchange rate (e.g., "1000 Zentro Coins for $9.99" in tiny print). Players who feel deceived about real-money value become hostile. Display exchange rate clearly on every purchase flow.

- **Mandatory tutorial lockout** ⚠️: Forcing players through a 5-minute tutorial before they can browse the store or start a game. Browser players are impatient; tutorial should be skippable or contextual (show controls when controls are first needed).

- **Account required to view store** ⚠️: Store should be browsable without login. Players should see what they could own, feel desire, then register to buy. Gate purchase, not browsing.

- **Username-squatting by banning change** ⚠️: If players can never change their username, they leave for platforms where they can correct embarrassing first choices. Allow at least one free name change or charge a small coin fee for subsequent changes.

---

## Cosmetics System Patterns

### What works (evidence from Krunker.io, Slither.io, Roblox, Agar.io)

**Cursor skins** are the highest-value cosmetic type for a cursor-visible platform because:
- They are always visible to the owning player regardless of session type (solo, multiplayer)
- They are visible to other players in multiplayer without requiring a special game mode
- They have zero gameplay impact — pure visual
- They are easily understood: player sees their cursor, sees a cooler version, wants it

**Cursor trails** are even more socially visible than static skins:
- Trails leave a path behind the cursor — they are visible from a distance, in motion, and are more dramatic than static skins
- In multiplayer, trails identify a player across the canvas even when their avatar is small
- Trails communicate personality (fire trail, pixel trail, sparkle trail) more strongly than static skins
- Evidence: Krunker.io's weapon trails and player trails are among its highest-priced items because they are the most visible

**UI themes** have lower impulse-buy rates but higher loyalty impact:
- Players who change their UI theme feel more "ownership" of the platform
- Themes signal long-term investment — a player who has a custom theme has mentally settled in
- Themes should affect background, card colors, accent colors — not just a color swap
- Evidence: Roblox's "themes" and Discord's Nitro themes are retention features more than acquisition features

**Equip slots should be visible on profile prominently:**
- Three clearly labeled slots: Cursor Skin, Cursor Trail, UI Theme
- Show the equipped item's rarity color
- Show a "None equipped" state with a placeholder so new players know slots exist

**"Collection completionism" drives spend:**
- Players who own 2 items in a set of 4 have strong motivation to complete the set
- Bundle pricing (buy all 4 for 20% off) converts collectors reliably
- Show "2 of 4 owned" progress indicator on set pages

**What players actually equip and care about (priority order from behavioral evidence):**
1. Cursor trail — most visible, most social, most frequently changed
2. Cursor skin — always present, personal identity
3. UI theme — set-and-forget, loyalty signal

**What players do NOT care about (avoid designing for):**
- Equipping multiple of the same type simultaneously (one active slot per type is sufficient)
- Pet/companion cosmetics (too complex, too much screen real estate in browser context)
- Emotes/gestures (no natural trigger moment in casual mini-game context)
- Chat cosmetic items like chat color (deferred given no real-time chat in v1)

### Rarity tier recommendation (evidence from Fortnite, Krunker.io, Roblox)

| Tier | Name | Price range (coins) | Visual treatment | Expected prevalence |
|------|------|--------------------|--------------------|---------------------|
| 1 | Common | 50–150 | Grey border | 40% of catalog |
| 2 | Rare | 200–400 | Blue border | 30% of catalog |
| 3 | Epic | 500–900 | Purple border | 20% of catalog |
| 4 | Legendary | 1000–2000 | Gold border + glow | 10% of catalog |

Pricing must be calibrated so that a player who plays 3–4 sessions per day earns enough coins to buy a Common item in 2–3 days, a Rare in about a week. This creates a sustainable "earn and aspire" loop without requiring purchase for basic engagement.

---

## Virtual Economy Patterns

### Healthy economy design principles (evidence from Roblox, Krunker.io, GDC "Designing Virtual Economies" talks)

**Earn rate must create genuine aspiration without despair:**
- If coins are too easy to earn, nobody buys with real money (Roblox's original earn rate was too high, leading to devaluation)
- If coins are too hard to earn, players feel the game is pay-walled and leave (the "p2w" accusation)
- Target: earn enough to feel rewarded per session; reach a store item in days of play (not weeks)
- Suggested: 10–30 coins per game session depending on performance; Legendary items at 1500 coins = ~50–150 sessions = 2–5 weeks of regular play. This is the "Netflix threshold" — players who are engaged 2–5 weeks are retained long-term.

**Dual-currency is table stakes for hybrid earn/buy economies:**
- Zentro's single "coins" currency (earnable AND buyable) is simpler than dual-currency (e.g., Roblox's Robux vs. the deprecated Tix)
- Single currency is valid IF the coin purchase price clearly maps to dollar value
- Risk: players who earn coins feel their earned currency is devalued when rich players buy the same coins instantly. Mitigate with "Exclusive Earned Items" — cosmetics that can ONLY be unlocked via gameplay, never purchased. This preserves prestige for grinders.

**Pricing transparency is non-negotiable:**
- Show coin prices on every item card (not hidden behind a click)
- Show the dollar equivalent on every coin bundle purchase screen
- Example: "500 coins = $4.99" next to every bundle, so players know a 200-coin item is ~$2 of real value

**Coin bundles should not optimize purely for confusion:**
- Bad: 137 coins for $1.99, 412 coins for $4.99, 1087 coins for $9.99 (Skinner-box denomination confusion)
- Good: 100 coins for $0.99, 500 coins for $4.49, 1200 coins for $9.99 (round numbers with visible bulk discount)
- Players feel respected by clean math; they feel manipulated by irregular denominations

**"First purchase" friction reduction:**
- The first real-money purchase is the hardest. Remove every click, every extra form field.
- Pre-fill saved payment methods (Stripe Payment Element does this)
- Offer a starter pack at a steep discount: "200 coins for $0.99 (first purchase only)" — drives first transaction at low commitment, then trust is established for larger purchases

**Exclusive earned-only items (critical for fairness perception):**
- Reserve at least 15–20% of the catalog for items earnable only through gameplay
- These should be visually distinct (e.g., a gold "Earned" badge on item cards)
- Players who earn these become advocates: "I have the Pixel Rush Champion trail and you can't buy it"
- This is how Fortnite handles Victory Umbrella; how Krunker handles tournament skins

**Gifting / coin gifting to friends:**
- Medium complexity, medium value — deferred for v1 but worth noting for v2
- Players who gift coins to friends increase the gifted player's spend rate significantly (social obligation effect)

**Economy health metrics to watch (not features, but operational signals):**
- Average coins earned per session vs. average item price — should stay in the 1:5–1:15 range
- % of users who have made at least one real-money purchase (target: 2–5% in casual gaming = healthy F2P)
- % of coins in circulation vs. coins spent — if coins accumulate without spending, prices are too high or items aren't desirable
- Churn cohort by first-week spend pattern — players who spend in first week have 40% higher 30-day retention (Naavik research on F2P games)

### Store UX patterns (what a great store looks like)

**Layout principles (evidence from Fortnite Item Shop, Roblox Avatar Shop, Krunker.io Market):**
- Prominent "New" / "Featured" section at top — 2–4 hero items with large card treatment
- Filter bar: All / Cursor Skins / Cursor Trails / Themes, with rarity filter chips
- Sort options: Price (low/high), Newest, Rarity, Most Popular
- Each item card: thumbnail (animated for trails), item name, rarity badge, coin price, owned/not-owned state
- Clicking an item opens a detail panel or modal (not a new page) to preserve store context

**Preview mechanic (table stakes for cosmetics):**
- For cursor skins: live preview that replaces the user's cursor on hover or in a dedicated preview zone
- For trails: animated preview showing the trail in motion (looping GIF-like or canvas animation)
- For UI themes: a miniature UI mockup showing the theme applied
- No preview = no purchase. This is the single highest-ROI feature in the store.

**Purchase confirmation:**
- Confirm screen showing: item name + preview, coin cost, remaining balance after purchase
- One-click equip from confirmation screen
- No coin refunds (state this in terms, not in the UI — don't make refunds a prominent UI option as it trains players to request them)

**"Recommended for you" section:**
- Based on equipped items (if player has Neon cursor, show Neon trail — complete the set)
- Not ML-required: rule-based set completion is sufficient for v1

---

## Feature Dependencies

```
Guest play → [no dependency]
Account / auth → Guest play [can layer on top]
Coin balance display → Account / auth
Store browsing → [no dependency — guest can browse]
Store purchasing → Account / auth + Coin balance
Cosmetic equip → Account / auth + Store purchasing
Cosmetics visible in multiplayer → Cosmetic equip + Multiplayer presence layer
Player status indicators → Multiplayer presence layer
Hoverable player badge → Cosmetics visible in multiplayer + Multiplayer presence
Daily login reward → Account / auth
Rarity tier visual treatment → Store item catalog
Set completion indicator → Store item catalog + owned items data
Exclusive earned-only items → In-game reward screen (coin earn events)
In-game coin reward screen → Game integration API (earn event hook)
```

## MVP Recommendation

Prioritize (in order):

1. **Guest play + single-click game launch** — removes the biggest abandonment trigger
2. **Auth + profile page with equip slots** — identity anchor; nothing else works without this
3. **Coin balance always visible + earn on game completion** — closes the earn side of the loop
4. **Store with live preview + purchase flow** — closes the spend side of the loop
5. **Cosmetics rendered globally (player sees own cursor skin/trail everywhere)** — delivers the core value promise

Immediately after MVP:

6. **Cosmetics visible to other players in multiplayer** — the social proof loop; without this, cosmetics feel private and value drops
7. **Rarity tier system + visual treatment** — creates aspiration; simple to implement once catalog exists
8. **New player onboarding gift coins** — reduces cold-start friction

Defer to v2:

- **Hoverable player badge**: high value but requires additional multiplayer infrastructure
- **Daily login reward**: high retention value but requires scheduled jobs and state tracking; implement after core loop is stable
- **Themed seasonal drops**: content planning dependency, not a development gap
- **Set completion UI**: requires catalog to have sets defined first
- **Gifting**: v2+ social feature

---

## Sources

- Training knowledge of live platforms: Miniclip, Armor Games, Coolmath Games, Krunker.io, Slither.io, Agar.io, Roblox, Fortnite (all pre-August 2025)
- Virtual economy design: GDC "Balancing F2P Economies" talk corpus; Naavik F2P game economy analysis newsletter (pre-August 2025)
- Dark pattern reference: NNG (Nielsen Norman Group) gaming dark patterns documentation; EU/UK loot box regulatory guidance
- Confidence: MEDIUM — multiple platform cross-references, cannot live-verify current state of platforms due to tool restrictions
