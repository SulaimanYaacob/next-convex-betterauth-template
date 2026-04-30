# Phase 2: Home + Presence - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-30
**Phase:** 02-home-presence
**Areas discussed:** Nav layout

---

## Nav layout

### Mobile nav structure

| Option | Description | Selected |
|--------|-------------|----------|
| Bottom nav in Phase 2 | Home + Store tabs; store empty but shell exists | ✓ |
| Desktop nav only, responsive | Top nav collapses on mobile; bottom bar added in Phase 4 | |

**User's choice:** Bottom nav in Phase 2
**Notes:** Avoids rework when Store is built in Phase 4.

---

### Coin balance display for guests

| Option | Description | Selected |
|--------|-------------|----------|
| Hidden for guests | No coin slot shown to unauthenticated/anonymous users | ✓ |
| ⟟ 0 for guests | Always show coin slot, guests see zero | |
| Lock icon for guests | Greyed slot with "Sign up to earn coins" tooltip | |

**User's choice:** Hidden for guests
**Notes:** Standard approach — coin balance only meaningful for registered users.

---

### Search bar behavior in Phase 2

| Option | Description | Selected |
|--------|-------------|----------|
| Visual only | Renders but does nothing; functional in Phase 3+ | ✓ |
| Filters placeholder cards | Actually filters hardcoded card list | |

**User's choice:** Visual only
**Notes:** No real game data yet; functional search wired when games exist.

---

### Desktop nav layout

| Option | Description | Selected |
|--------|-------------|----------|
| Logo \| Search (center) \| Coin + Avatar | Wide centered search, coin+avatar right | ✓ |
| Logo \| Search \| Filters \| Coin + Avatar | All in one row with filter chips | |
| Logo + Avatar top bar, search below | Minimal top bar, search in sub-header row | |

**User's choice:** Logo \| Search (center) \| Coin + Avatar
**Notes:** Standard gaming platform pattern.

---

### Avatar click action

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown menu | Profile, Settings, Sign out options | ✓ |
| Navigate to profile | Direct link, no dropdown | |

**User's choice:** Dropdown menu
**Notes:** Dropdown gives access to sign out without extra navigation.

---

## Claude's Discretion

- Game card exact design (dimensions, hover, info density)
- Presence panel layout (horizontal vs vertical, max count shown)
- Mobile search bar placement (collapse into top nav vs row below)
- Loading skeleton patterns for Convex undefined state

## Deferred Ideas

- Functional search (Phase 3+)
- Functional filter chips (Phase 3+)
- Store tab content (Phase 4)
- Presence panel visual details (left to Claude)
