# AGENTS.md

Project-level instructions for Codex and other coding agents working in this
repository. Treat this as the Codex init file.

## Project Context

Gami is a minimal game platform focused on quick playable browser games,
earned coins, lightweight cosmetics, profile expression, and a clean
low-friction user experience.

## Required Session Context

- Read and follow `.wolf/OPENWOLF.md` every session.
- Check `.wolf/cerebrum.md` before generating code.
- Check `.wolf/anatomy.md` before broad file exploration.
- Read `convex/_generated/ai/guidelines.md` before editing Convex code.

## Core Stack and Commands

- Stack: Next.js 16.2.4, React 19, Convex 1.36, Better Auth 1.6, Tailwind v4.2.
- TypeScript: v6.0.
- Package manager: `pnpm`.
- Development:
  - `pnpm dev` for full stack development.
  - `pnpm dev:frontend` for Next.js only.
  - `pnpm dev:backend` for Convex only.
- Build/deploy:
  - `pnpm build`
  - `pnpm convex deploy`
- Environment values may need to exist in both `.env.local` and Convex.

## Architecture Notes

- Better Auth runs through Convex integration and client hooks in the app.
- Convex stores durable application state such as users, games, rewards,
  store items, owned items, equipped cosmetics, and presence.
- Browser games are expected to run inside the platform play shell and report
  lifecycle events through `postMessage`.
- The platform shell owns the single post-game reward popup; individual games
  should report `GAME_OVER` rather than showing duplicate reward modals.

## Implementation Standards

- Prefer minimal, practical changes that fit the existing app structure.
- Preserve user experience quality: clear states, fast interactions, readable
  text, responsive layouts, and no clutter.
- Build mobile-first, then scale with `sm:`, `md:`, and `lg:` breakpoints.
- Interactive targets should be at least 44px where practical.
- Every Convex query-driven UI must handle loading (`undefined`), empty states,
  and unauthenticated states when relevant.
- Use Sonner toasts for user-facing mutation success/error feedback.
- Keep cosmetics visual-only unless a feature explicitly says otherwise.

## Codex Working Rules

- Prefer `rg` or `rg --files` for search.
- Use `apply_patch` for manual file edits.
- Do not revert unrelated dirty worktree changes.
- If you encounter edits you did not make, work around them unless they block
  the requested task.
- Follow existing local patterns before adding abstractions or libraries.
- Run focused verification after implementation. Use `pnpm build` when changes
  affect routing, Convex types, or shared TypeScript surfaces.

<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.

<!-- convex-ai-end -->

## MCP Servers

- Use context-7 for reference.
- Always focus on using the correct mcp servers.
