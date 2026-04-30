# Gami

[![Next.js](https://img.shields.io/badge/Next.js-16.2.4-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.5-blue?style=flat&logo=react)](https://react.dev/)
[![Convex](https://img.shields.io/badge/Convex-1.36-orange?style=flat&logo=convex)](https://convex.dev/)
[![Better Auth](https://img.shields.io/badge/Better%20Auth-1.6-green?style=flat)](https://better-auth.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Browser-based gaming platform hosting solo and multiplayer mini-games. Players earn and spend virtual coins (⟟) on cosmetics — cursor skins, cursor trails, and UI themes — that apply globally and are visible to others in multiplayer sessions.

## Roadmap

| Phase | Name                                                              | Status         |
| ----- | ----------------------------------------------------------------- | -------------- |
| 1     | Foundation — Schema lock, auth UI, coin ledger                    | ✅ Complete    |
| 2     | Home + Presence — V2 layout, real-time presence, nav coin balance | 🔄 In Progress |
| 3     | Game Shell + Earn — Iframe embed, ESC overlay, coin earn          | ⏳ Pending     |
| 4     | Cosmetics + Store + Profile — Earn-spend-equip loop               | ⏳ Pending     |
| 5     | Payments — Stripe coin purchases                                  | ⏳ Pending     |

## Features

- 🎮 Solo & multiplayer mini-game platform
- 💰 Virtual coin economy (⟟) with earn & spend mechanics
- 🎨 Global cosmetics: cursor skins, trails, UI themes
- 👥 Real-time player presence & status
- 🎯 Guest mode for instant play
- 🔒 Full authentication (email/password, OAuth)

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript 6.0
- **Backend**: Convex 1.36 (database + functions)
- **Auth**: Better Auth 1.6
- **Styling**: Tailwind CSS v4.2, Radix UI, Lucide React
- **Runtime**: React Compiler (automatic memoization)

## Quick Start

```bash
pnpm install
pnpm dev        # Full stack (Convex + Next.js)
pnpm build      # Production build
```

## Project Structure

```
src/
├── app/
│   ├── (auth)/       # Protected routes
│   └── (unauth)/    # Public pages (sign-in, sign-up)
├── components/       # UI components
└── lib/             # Auth & utilities (Better Auth config)

convex/              # Backend (schema, mutations, queries)
├── schema.ts        # Core data model
├── auth.ts          # Better Auth + Convex integration
└── http.ts          # HTTP routes
```

## Links

- 🤖 **[CLAUDE.md](CLAUDE.md)** — Architecture docs, patterns, best practices for AI assistants
- 📋 **[Roadmap](.planning/ROADMAP.md)** — Detailed phase planning

## License

MIT — free to use, modify, and distribute.
