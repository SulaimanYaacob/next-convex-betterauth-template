# OpenWolf

@.wolf/OPENWOLF.md

This project uses OpenWolf for context management. Read and follow .wolf/OPENWOLF.md every session. Check .wolf/cerebrum.md before generating code. Check .wolf/anatomy.md before reading files.


# CLAUDE.md

## Project Context

Gami: [Insert brief project description here]

## 🛠️ Core Stack & Commands

- **Stack**: Next.js 16.2.4 (React 19), Convex 1.36, Better Auth 1.6, Tailwind v4.2.
- **TypeScript**: v6.0 for full type safety.
- **Package Manager**: pnpm.
- **Development**: `pnpm dev` (Full stack) | `pnpm dev:frontend` | `pnpm dev:backend`.
- **Build/Deploy**: `pnpm build` & `pnpm convex deploy`.
- **Environment**: Variables must be set in `.env.local` AND Convex (`pnpm convex env set <VAR> <VAL>`).

## 🔐 Authentication Patterns

- **Architecture**: Better Auth runs on Convex (`src/lib/auth.ts`) with client hooks in `src/lib/auth-client.ts`.
- **Protection**: `src/proxy.ts` (Next.js 16) uses `getSession()` for reliable server-side route protection.
- **Sync**: `convex/auth.ts` uses hooks like `onCreateUser` to sync Auth metadata with the application `users` table.

## 🤖 Convex MCP Server (AI Tools)

- **Strategy**: Prefer MCP tools over bash commands for structured data and better error handling.
- **Tables**: Use `tables` for schemas, `data` to browse, and `runOneoffQuery` for read-only queries.
- **Functions**: Use `functionSpec` for API docs, `run` to execute, and `logs` to debug.
- **Env**: Use `envList`, `envGet`, `envSet`, and `envRemove` via MCP.

## 🧩 Minimal Practical Implementation

### 1. Small Data Component

```tsx
// src/components/dashboard/UserHeader.tsx
"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function UserHeader() {
  const user = useQuery(api.auth.getCurrentUser);
  if (user === undefined)
    return <div className="h-8 w-32 animate-pulse bg-muted rounded" />; // Loading state
  return (
    <h1 className="text-2xl font-bold tracking-tight">Welcome, {user.name}</h1>
  );
}
```

### 2. Optimistic Mutation (Instant UX)

```ts
const deleteItem = useMutation(api.items.delete).withOptimisticUpdate(
  (localStore, args) => {
    const existing = localStore.getQuery(api.items.list);
    if (existing) {
      localStore.setQuery(
        api.items.list,
        existing.filter((i) => i._id !== args.id),
      ); // Instant UI update
    }
  },
);
```

### 3. Dynamic Loading (Performance)

```tsx
import dynamic from "next/dynamic";
const HeavyChart = dynamic(() => import("@/components/charts"), {
  loading: () => <div className="h-64 bg-muted animate-pulse rounded-lg" />,
  ssr: false, // Client-side only
});
```

## UI/UX & Responsive Standards

- Mobile-First: Styles are mobile-base; use `sm:`, `md:`, `lg:` for scaling.
- Layout: Standard container: `<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">`.
- Touch Targets: Interactive elements must be `min-h-[44px] min-w-[44px]` (WCAG 2.5.5).
- Feedback: Always use `toast.success/error` (Sonner) for mutation feedback.
- Data States: Every query must handle `undefined` (loading) and empty array (empty state).

## Best Practices

- React Compiler: Enabled; do NOT use `useMemo` or `useCallback` manually.
- Images: Always use `next/image` with `sizes` and `priority` for above-the-fold content.
- Icons: Import individual icons only: `import { Search } from "lucide-react"`.
- Security: Security headers (CSP, X-Frame-Options) configured in `next.config.ts`.
- Note: Read `convex/_generated/ai/guidelines.md` before editing backend logic.
