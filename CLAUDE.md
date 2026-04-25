# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Next.js 16.2.4** (App Router with Turbopack) - React 19.2.5
- **Convex 1.36** - Real-time backend database and functions
- **Better Auth 1.6** (`@convex-dev/better-auth` 0.12) - Authentication system with email verification, 2FA, magic links, and OAuth
- **TypeScript 6.0** - Full type safety throughout
- **Tailwind CSS v4.2** - Styling with dark mode support
- **Radix UI** - Accessible component primitives
- **pnpm** - Package manager

## Development Commands

### Starting the Application
```bash
# Start both Convex backend and Next.js frontend (recommended)
pnpm dev

# Start only frontend (requires Convex to be running separately)
pnpm dev:frontend

# Start only Convex backend
pnpm dev:backend
# or run once and exit:
pnpm convex dev --once
```

### Building and Deployment
```bash
# Production build
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint

# Deploy Convex to production
pnpm convex deploy
```

### Convex Environment Management
```bash
# Set development environment variables
pnpm convex env set VARIABLE_NAME value

# Set production environment variables
pnpm convex env set VARIABLE_NAME value --prod

# List environment variables
pnpm convex env list
```

## Convex MCP Tools (AI Assistant Integration)

This project has the **Convex MCP server** installed, providing AI assistants with direct access to the Convex backend. See `@convex-mcp.md` for details.

### Available MCP Tools

**Prefer using MCP tools over bash commands when working with Convex** - they provide structured data and better error handling.

- **Deployment**: Use `status` tool to select your deployment
- **Tables**: Use `tables` tool to view schemas, `data` tool to browse table contents, `runOneoffQuery` for custom read-only queries
- **Functions**: Use `functionSpec` to see available functions, `run` to execute them, `logs` to view execution logs
- **Environment**: Use `envList`, `envGet`, `envSet`, `envRemove` instead of bash `convex env` commands

These tools provide structured access to Convex data and are more reliable than parsing CLI output.

## Architecture Overview

### Authentication Flow

This application uses a **dual-system authentication architecture**:

1. **Better Auth** (`src/lib/auth.ts`) - Server-side auth configuration running on Convex
   - Configures providers (Google, GitHub, Slack), email verification, password reset
   - Defines all auth options including 2FA, magic links, email OTP
   - Exports `createAuth(ctx)` which must receive Convex context

2. **Better Auth Client** (`src/lib/auth-client.ts`) - Client-side auth instance
   - React hooks and client methods for auth operations
   - Exports `authClient` used in components for sign in/out, session management
   - Plugins must match server-side configuration

3. **Convex Auth Component** (`convex/auth.ts`) - Connects Better Auth to Convex database
   - `betterAuthComponent` - handles database operations for auth
   - `onCreateUser` - creates application user record when auth user is created
   - `onDeleteUser` - cascade deletes user data (todos, etc.)
   - `onUpdateUser` - keeps email field synced between auth and app user tables
   - `getCurrentUser` - merges Better Auth user metadata with application user data

4. **HTTP Routes** (`convex/http.ts`) - Registers Better Auth API endpoints
   - Must call `betterAuthComponent.registerRoutes(http, createAuth)`
   - Handles `/api/auth/*` endpoints through Convex

5. **Proxy Protection** (`src/proxy.ts`) - Route protection middleware (renamed from middleware.ts in Next.js 16)
   - Uses `getSession()` via `betterFetch` to validate session server-side (more reliable than cookie parsing)
   - Redirects unauthenticated users to `/sign-in`
   - Redirects authenticated users from auth pages to `/dashboard`
   - Matcher excludes static assets, `_next`, and `api/auth` routes

6. **Next.js Auth Handler** (`src/app/api/auth/[...all]/route.ts`) - Proxies auth requests to Convex
   - Uses `convexBetterAuthNextJs({ convexUrl, convexSiteUrl })` from `@convex-dev/better-auth/nextjs`
   - Requires both `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` env vars

### Key Authentication Concepts

- **Session checking**: `proxy.ts` uses `getSession()` (calls `/api/auth/get-session`) — more reliable than `getSessionCookie()` local parsing
- **`convex()` plugin**: Requires `{ authConfig }` argument — pass the imported `convex/auth.config.ts` default export
- **Auth config**: `convex/auth.config.ts` uses `getAuthConfigProvider()` from `@convex-dev/better-auth/auth-config` for RS256 JWT setup
- **Password reset**: `authClient.requestPasswordReset()` (renamed from `forgetPassword` in better-auth 1.6)
- **User data split**: Auth metadata (email, name, image) lives in Better Auth tables; application data lives in `users` table
- **Lifecycle hooks**: `onCreateUser`, `onDeleteUser`, `onUpdateUser` keep application user table in sync with auth system
- **Plugin synchronization**: Client plugins (`src/lib/auth-client.ts`) must match server plugins (`src/lib/auth.ts`)
- **TypeScript node types**: Both `tsconfig.json` and `convex/tsconfig.json` need `"types": ["node"]` for `process.env` to work

### Convex Integration

**Client Setup** (`src/app/ConvexClientProvider.tsx`):
- `ConvexReactClient` - connects to Convex backend using `NEXT_PUBLIC_CONVEX_URL`
- `ConvexBetterAuthProvider` - wraps app with both Convex and auth context
- Must wrap all client components that use `useQuery`, `useMutation`, or auth hooks

**Database Schema** (`convex/schema.ts`):
- Application tables defined here (e.g., `users`, `todos`)
- Better Auth tables auto-generated by `@convex-dev/better-auth`
- Indexes required for efficient queries (e.g., `userId` index on todos)

**Querying Data**:
```typescript
// In client components
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const data = useQuery(api.moduleName.functionName, { args });
const mutate = useMutation(api.moduleName.functionName);
```

### Route Structure

```
src/app/
├── (auth)/           # Protected routes - requires authentication
│   ├── dashboard/    # Main user dashboard
│   └── settings/     # User settings (2FA, profile)
├── (unauth)/         # Public auth routes
│   ├── sign-in/      # Login page
│   ├── sign-up/      # Registration page
│   └── verify-2fa/   # 2FA verification
└── api/auth/[...all]/ # Next.js API route that delegates to Convex (via Better Auth)
```

Route groups `(auth)` and `(unauth)` organize routes without affecting URLs. Proxy handles protection logic.

### Email System

Emails are sent through Convex using `@convex-dev/resend`:
- `convex/email.tsx` - Email templates using `@react-email/components`
- Functions: `sendEmailVerification`, `sendResetPassword`, `sendMagicLink`, `sendOTPVerification`
- Called from `src/lib/auth.ts` auth configuration callbacks

## Environment Variables

### Required in `.env.local`:
```bash
# Convex (auto-generated after first deploy)
CONVEX_DEPLOYMENT=automatic
NEXT_PUBLIC_CONVEX_URL=https://example.convex.cloud
NEXT_PUBLIC_CONVEX_SITE_URL=https://example.convex.site

# Site URL
SITE_URL=http://localhost:3000

# Better Auth Secret (generate with: openssl rand -base64 32)
BETTER_AUTH_SECRET=

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

### Must also be set in Convex:
```bash
pnpm convex env set SITE_URL http://localhost:3000
pnpm convex env set BETTER_AUTH_SECRET your-secret
pnpm convex env set GOOGLE_CLIENT_ID your-id
pnpm convex env set GOOGLE_CLIENT_SECRET your-secret
# etc.
```

**Critical**: Environment variables must be set in BOTH `.env.local` (for Next.js) AND Convex (for backend functions).

## Adding/Removing Auth Providers

When modifying authentication providers:

1. **Update `src/lib/auth.ts`**:
   - Add/remove provider in `socialProviders` section
   - For generic OAuth: add to `genericOAuth({ config: [...] })`

2. **Update `src/lib/auth-client.ts`**:
   - Add/remove corresponding client plugin (e.g., `genericOAuthClient()`)

3. **Environment Variables**:
   - Add `PROVIDER_CLIENT_ID` and `PROVIDER_CLIENT_SECRET` to both `.env.local` and Convex
   - Use `pnpm convex env set` for Convex variables

4. **Update UI Components**:
   - Add provider buttons in sign-in/sign-up pages if needed

Example providers included: Google, GitHub, Slack (via genericOAuth), plus anonymous, magic link, email OTP, and 2FA.

## Important File Locations

- `src/proxy.ts` - Route protection (Next.js 16 renamed from middleware.ts)
- `convex/auth.config.ts` - Better Auth domain configuration
- `convex/schema.ts` - Application database schema
- `convex/polyfills.ts` - Required polyfills for Better Auth in Convex environment
- `next.config.ts` - Next.js configuration (images, remotePatterns)

## Common Patterns

### Creating a New Protected Page
1. Create `src/app/(auth)/page-name/page.tsx`
2. Use `"use client"` directive if using hooks
3. Import `useQuery(api.auth.getCurrentUser)` for current user
4. Wrap content with `<AppContainer>` component (optional, for consistent layout)

### Adding a Convex Function
1. Create function in `convex/*.ts` file
2. Export as `query`, `mutation`, or `action` from `convex/_generated/server`
3. Import in client: `import { api } from "@/convex/_generated/api"`
4. Use with: `useQuery(api.file.functionName)` or `useMutation(api.file.functionName)`

### Accessing Current User
```typescript
// In client components
const user = useQuery(api.auth.getCurrentUser);

// In Convex functions
const user = await betterAuthComponent.getAuthUser(ctx);
```

## Deployment Notes

**Vercel Deployment**:
- Build Command: `npx convex deploy --cmd 'pnpm run build'`
- Install Command: `pnpm install`
- Add all environment variables from `.env.local`
- Set `CONVEX_DEPLOYMENT` to production key from Convex dashboard

**Convex Production Variables**:
```bash
pnpm convex env set SITE_URL https://your-domain.com --prod
pnpm convex env set BETTER_AUTH_SECRET your-prod-secret --prod
# etc. for all required variables
```

## Next.js 16 Specifics

- **Turbopack is default** - no `--turbo` flag needed in dev/build commands
- **Proxy pattern** - `src/proxy.ts` replaces `middleware.ts` (deprecated convention)
- **React 19** - Using React 19.2.0 with async server components

## Best Practices

### Performance

**React Compiler is active** (`reactCompiler: true` in `next.config.ts`) — do NOT add `useMemo`, `useCallback`, or `React.memo` manually. The compiler handles memoization automatically.

**Images** — always use `next/image`. Required props every time:
```tsx
import Image from "next/image";

// Static asset (known dimensions)
<Image src="/hero.png" alt="Hero" width={1200} height={630} priority />

// Responsive (unknown render size) — always include sizes
<Image
  src={user.image}
  alt={user.name}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
/>

// Above-the-fold images: add priority prop
// User-generated images: add placeholder="blur" blurDataURL="data:image/..."
```

**Dynamic imports** — lazy-load heavy client components (dialogs, charts, rich text editors):
```tsx
import dynamic from "next/dynamic";
const RichEditor = dynamic(() => import("@/components/rich-editor"), {
  loading: () => <div className="h-40 animate-pulse bg-muted rounded" />,
  ssr: false,
});
```

**Fonts** — specify weights and `display: "swap"`:
```tsx
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
```

**Icons** — never import entire libraries. Always import individual icons:
```tsx
// ✅ good
import { Search } from "lucide-react";
// ❌ bad
import * as Icons from "lucide-react";
```

---

### SEO

**Every public (non-auth) page** must export `metadata` or `generateMetadata`. Use `metadataBase` + title templates in the root layout:

```tsx
// src/app/layout.tsx
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
  title: { default: "App Name", template: "%s | App Name" },
  description: "Your app description",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "App Name",
  },
  twitter: { card: "summary_large_image" },
};

// src/app/(unauth)/sign-in/page.tsx
export const metadata: Metadata = {
  title: "Sign In",  // renders as "Sign In | App Name"
  description: "Sign in to your account",
};

// Dynamic pages
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: params.slug,
    alternates: { canonical: `/posts/${params.slug}` },
  };
}
```

**Add these files for public sites:**

```ts
// src/app/sitemap.ts
import { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${process.env.SITE_URL}`, lastModified: new Date() },
    { url: `${process.env.SITE_URL}/sign-in`, lastModified: new Date() },
  ];
}

// src/app/robots.ts
import { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard/", "/settings/"] },
    ],
    sitemap: `${process.env.SITE_URL}/sitemap.xml`,
  };
}
```

---

### Responsive Design

**Mobile-first always.** Base styles = mobile. Layer up:

| Prefix | Breakpoint |
|--------|-----------|
| (none) | 0px — mobile |
| `sm:` | 640px |
| `md:` | 768px |
| `lg:` | 1024px |
| `xl:` | 1280px |
| `2xl:` | 1536px |

**Standard page container:**
```tsx
<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

**Layout rules:**
- CSS Grid for 2D layouts: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Flexbox for 1D: `flex flex-col sm:flex-row items-center gap-4`
- Touch targets: `min-h-[44px] min-w-[44px]` on all interactive elements (WCAG 2.5.5)
- Use `@container` for component-level breakpoints (already supported in existing UI components)

**Typography scale:**
```tsx
// Headings
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">
<h2 className="text-xl sm:text-2xl font-semibold">
// Body
<p className="text-sm sm:text-base leading-relaxed text-muted-foreground">
```

---

### Loading & Error States

**Every route with async Convex data needs a `loading.tsx`:**
```tsx
// src/app/(auth)/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
      ))}
    </div>
  );
}
```

**Error boundary for auth routes:**
```tsx
// src/app/(auth)/error.tsx
"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 p-8">
      <p className="text-destructive">{error.message}</p>
      <button onClick={reset} className="underline">Try again</button>
    </div>
  );
}
```

**Convex query loading pattern:**
```tsx
const data = useQuery(api.todos.list);
if (data === undefined) return <LoadingSkeleton />; // undefined = loading in Convex
if (data.length === 0) return <EmptyState />;       // always handle empty
```

---

### UX Patterns

**Mutations:** always show toast feedback (Sonner is installed):
```tsx
import { toast } from "sonner";
const createTodo = useMutation(api.todos.create);

async function handleSubmit(values: FormValues) {
  try {
    await createTodo(values);
    toast.success("Created successfully");
  } catch {
    toast.error("Something went wrong");
  }
}
```

**Optimistic updates** for instant UI response:
```tsx
const deleteTodo = useMutation(api.todos.delete).withOptimisticUpdate(
  (localStore, args) => {
    const todos = localStore.getQuery(api.todos.list);
    if (todos) {
      localStore.setQuery(api.todos.list, todos.filter(t => t._id !== args.id));
    }
  }
);
```

**Forms:** use zod + react-hook-form via the existing `src/components/ui/form.tsx` infrastructure. Always validate before submit, never on every keystroke.

**Empty states:** every list component must render a meaningful empty state — never a blank area.

---

### Accessibility

- Use semantic HTML: `<nav>`, `<main>`, `<header>`, `<aside>`, `<section>`, `<article>`
- Icon-only buttons need `aria-label`:
  ```tsx
  <button aria-label="Close dialog"><X className="size-4" /></button>
  ```
- Screen-reader text for supplemental labels:
  ```tsx
  <span className="sr-only">Notifications</span>
  ```
- Never remove focus ring. Use `focus-visible:ring-2 focus-visible:ring-ring` (Tailwind's ring utilities)
- Radix UI primitives handle keyboard navigation — don't override `onKeyDown` unless adding new behavior
- Color must not be the only indicator of state — pair with icon, text, or pattern

---

### Security Headers

Add to `next.config.ts` for all deployments:

```ts
const nextConfig: NextConfig = {
  // ...existing config...
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};
```

---

<!-- convex-ai-start -->
This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
