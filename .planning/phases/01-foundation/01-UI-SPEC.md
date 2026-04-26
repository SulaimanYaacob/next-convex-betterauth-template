---
phase: 1
name: Foundation
status: draft
created: 2026-04-26
---

# UI-SPEC: Phase 1 — Foundation

## 1. Overview

Phase 1 delivers working auth screens and a home placeholder. No game content, no nav coin balance, no presence panel. The visual and interaction contracts in this document cover exactly what Phase 1 ships:

- Sign-in page (email + password + guest entry point)
- Sign-up page (email + password only)
- Home placeholder (`/`) — a minimal holding page for authenticated and guest users alike
- Guest conversion banner — a thin persistent bar for anonymous (guest) users

Everything else is Phase 2+.

Design system detected: **shadcn/ui (New York style, neutral base color, CSS variables)**. Components already available: `Button`, `Input`, `Card`, `Form`, `Label`, `Sonner`. No additional shadcn components or third-party registries required for this phase.

---

## 2. Design Tokens

### Color

The auth pages use the Gami brand palette, not the generic shadcn defaults. These overrides must be applied to `globals.css` as CSS custom properties.

| Token | Hex | Usage |
|-------|-----|-------|
| `--auth-bg` | `#f8f6f2` | Auth page full-page background (both sign-in + sign-up) |
| `--auth-card` | `#ffffff` | Card surface on auth pages |
| `--auth-card-border` | `rgba(0,0,0,0.08)` | Card border — subtle, not harsh |
| `--gami-primary` | Use existing `--primary` (orange-amber, oklch 0.6716 0.1368 48.5130) | Primary CTA buttons |
| `--gami-text-main` | Use existing `--foreground` | Body text |
| `--gami-text-muted` | Use existing `--muted-foreground` | Labels, helper text, secondary links |
| `--gami-destructive` | Use existing `--destructive` | Inline field errors |
| `--guest-banner-bg` | `#f1f5fb` | Guest conversion banner background (soft blue, matches MP section identity) |
| `--guest-banner-border` | `rgba(59,130,246,0.15)` | Guest banner bottom border — very subtle blue |

**Color contract: 60/30/10**
- 60% `#f8f6f2` — auth page background
- 30% `#ffffff` — card surfaces, input backgrounds
- 10% `--primary` (orange-amber) — primary CTAs only. Reserved for: "Sign in" button, "Create account" button. NOT used on "Play as Guest" text link or secondary navigation links.

**Dark mode:** Auth pages are explicitly light-only (`#f8f6f2` background). Do not apply dark mode overrides to the auth layout. The `(unauth)` route group layout must suppress the `.dark` class on the `<html>` element or apply `data-theme="light"` to isolate auth pages from system theme.

### Typography

Font family:
- **Sora** — logo wordmark only. Load via `next/font/google` with weights `[600, 700]` and `display: "swap"`. Variable: `--font-sora`.
- **Inter** — body, labels, inputs, buttons, error messages. Already loaded in `layout.tsx` (`--font-inter`). Keep as-is.

| Role | Size | Weight | Line-height | Where |
|------|------|--------|-------------|-------|
| Logo wordmark | 28px (`text-3xl`) | 700 | 1 (leading-none) | Auth card header |
| Card heading | 20px (`text-xl`) | 600 (semibold) | 1.2 | "Welcome back" / "Create your account" |
| Card subheading | 14px (`text-sm`) | 400 | 1.4 | Below heading — "Sign in to continue" |
| Body / labels | 14px (`text-sm`) | 400 | 1.5 | Field labels, placeholder text |
| Input text | 14px (`text-sm`) | 400 | 1.5 | User-typed text in inputs |
| Primary button | 14px (`text-sm`) | 500 (medium) | 1 | "Sign in", "Create account" |
| Inline error | 12px (`text-xs`) | 400 | 1.4 | Below field on error state |
| Secondary link | 14px (`text-sm`) | 400 | 1.5 | "Don't have an account? Sign up" |
| Guest link | 13px (`text-[13px]`) | 400 | 1.4 | "Play as Guest" text link |
| Guest banner text | 13px (`text-[13px]`) | 400 | 1.4 | Banner body copy |

Two weights in use: **400 (regular)** and **600 (semibold)**. The 500 on buttons is a minor variant — acceptable as a third weight only for interactive elements.

### Spacing

8-point base grid. All spacing in multiples of 4px.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon-to-label gaps, tight inline gaps |
| sm | 8px | Field label to input gap, inline error to field gap |
| md | 16px | Card internal horizontal padding (mobile), field-to-field vertical gap |
| lg | 24px | Card internal horizontal padding (desktop), section separation within card |
| xl | 32px | Card-to-logo gap, top padding for auth page |
| 2xl | 48px | Auth page vertical centering breathing room |

Card width: `w-full max-w-sm` (384px cap) on mobile; no wider on any breakpoint — auth cards are intentionally narrow.

Card padding: `px-6 py-8` (24px horizontal, 32px vertical).

### Border Radius

Use existing shadcn token `--radius: 0.75rem` (12px). Apply:
- Card: `rounded-xl` (16px — slightly softer than the 12px base, override explicitly)
- Inputs: `rounded-md` (existing shadcn default, ~8px)
- Buttons: `rounded-md` (existing shadcn default)
- Guest conversion banner: `rounded-none` — full-width bar, no radius

### Shadows

Auth card: `shadow-sm` (existing shadcn token — subtle 1px shadow). Do not use stronger shadows on the card; the contrast with `#f8f6f2` background is sufficient.

---

## 3. Screen Inventory

| Screen | Route | Auth State | Phase 1 Ships? |
|--------|-------|-----------|----------------|
| Sign-in | `/sign-in` | Unauthenticated | Yes |
| Sign-up | `/sign-up` | Unauthenticated | Yes |
| Home placeholder | `/` | Any (auth or guest) | Yes (stub only) |
| Guest conversion banner | Overlay on `/` | Guest only | Yes |
| Dashboard (scaffold) | `/dashboard` | Authenticated | Exists — leave as-is |
| Settings (scaffold) | `/settings` | Authenticated | Exists — leave as-is |

---

## 4. Per-Screen Specs

### 4.1 Sign-in Page (`/sign-in`)

**Layout**
Full-viewport centered column. Background: `#f8f6f2`. No nav, no footer.

```
[full viewport, bg: #f8f6f2]
  [vertical center, flex-col items-center]
    [Logo mark + "gami" wordmark]   ← above card, 32px gap below
    [Card, max-w-sm, w-full]
      [CardHeader]
        "Welcome back"              ← text-xl font-semibold
        "Sign in to your account"  ← text-sm text-muted-foreground
      [CardContent, space-y-4]
        [FormField: Email]
          Label: "Email"
          Input: type=email, placeholder="you@example.com"
          [ErrorMessage if invalid]
        [FormField: Password]
          Label: "Password"
          Input: type=password, placeholder="••••••••"
          [ErrorMessage if invalid]
        [Button, variant=default, size=lg, w-full]
          "Sign in"
      [CardFooter, flex-col gap-3]
        [Secondary links row]
          "Don't have an account?" [link: "Sign up" → /sign-up]
        [Divider: thin hr or "or" text, text-muted-foreground text-xs]
        [Guest link]
          [link/button: "Play as Guest"]
```

**Responsive**
- Mobile (default): `px-4` page padding, card fills width minus padding
- sm+ (640px+): card centered with `mx-auto`, `max-w-sm` constrains to 384px

**States**
- Idle: empty form
- Submitting: primary button shows spinner (Lucide `Loader2` spinning), disabled, text stays "Sign in"
- Field error (blur or submit): input gets `aria-invalid=true`, red ring via existing `aria-invalid:border-destructive` class, error message below
- Server error (wrong credentials): inline error below the password field — "Incorrect email or password"
- Success: no visual state — redirect to `/` handled by proxy

---

### 4.2 Sign-up Page (`/sign-up`)

**Layout**
Identical layout structure to sign-in. Same background, same card width.

```
[full viewport, bg: #f8f6f2]
  [vertical center, flex-col items-center]
    [Logo mark + "gami" wordmark]   ← above card
    [Card, max-w-sm, w-full]
      [CardHeader]
        "Create your account"       ← text-xl font-semibold
        "Start playing in seconds"  ← text-sm text-muted-foreground
      [CardContent, space-y-4]
        [FormField: Email]
          Label: "Email"
          Input: type=email, placeholder="you@example.com"
          [ErrorMessage if invalid]
        [FormField: Password]
          Label: "Password"
          Input: type=password, placeholder="8+ characters"
          [ErrorMessage if invalid]
        [Button, variant=default, size=lg, w-full]
          "Create account"
      [CardFooter, flex-col gap-3]
        [Secondary links row]
          "Already have an account?" [link: "Sign in" → /sign-in]
        [Divider]
        [Guest link]
          [link/button: "Play as Guest"]
```

**States**
- Idle: empty form
- Submitting: spinner on button, disabled
- Email taken (server error): inline error below email field — "An account with this email already exists"
- Password too short (client validation): inline error below password field — "Password must be at least 8 characters"
- Success: redirect to `/` (proxy handles redirect for authenticated users)

---

### 4.3 Home Placeholder (`/`)

**Purpose:** A minimal landing surface for Phase 1. Phase 2 replaces this entirely with the V2 Refined spotlight layout. This is a functional stub only.

**Layout**
```
[full viewport]
  [GuestConversionBanner if guest]      ← top of page, below any future nav
  [centered content area]
    [text: "Gami"]                      ← text-2xl font-semibold, text-foreground
    [text: "Coming soon — Phase 2"]     ← text-sm text-muted-foreground
```

**No nav scaffold in Phase 1** — Phase 2 builds the nav. The guest banner attaches to the top of the viewport.

---

### 4.4 Guest Conversion Banner

**Trigger:** Rendered when the current session is anonymous (guest). Persists until user dismisses or creates an account.

**Layout**
```
[full-width bar, fixed top-0 or top of content flow, bg: #f1f5fb, border-bottom: 1px solid rgba(59,130,246,0.15)]
  [container, max-w-7xl mx-auto px-4, flex items-center justify-between]
    [left: text]
      "Create an account to save your progress"
    [right: actions row, gap-3]
      [link/button: "Create account" → /sign-up]   ← text-sm font-medium, primary color
      [icon button: X, aria-label="Dismiss banner"] ← ghost, size-icon sm
```

**States**
- Visible: default when `isAnonymous === true`
- Dismissed: hidden — store dismissal in `localStorage` key `gami_banner_dismissed`. On next page load if still guest, respect dismissal (do not re-show until next session or account creation).
- Gone: when user successfully creates account, banner disappears (session is no longer anonymous)

**Position:** `position: sticky; top: 0; z-index: 40` — sticks to top of scroll but does not cover modals. Not `fixed` — does not overlay above content on non-scrollable pages.

---

## 5. Component Contracts

### 5.1 `<GamiLogo />`

Reusable brand logo component. Used above the auth card.

```tsx
interface GamiLogoProps {
  size?: "sm" | "md" | "lg"  // default: "md"
}
```

| Size | Mark height | Wordmark size |
|------|-------------|---------------|
| sm | 24px | text-xl (20px) |
| md | 32px | text-3xl (28px) |
| lg | 40px | text-4xl (36px) |

Structure:
- Flex row, `items-center gap-2`
- Left: geometric overlapping-squares SVG mark (two overlapping rounded squares, brand primary color `--primary`)
- Right: "gami" in Sora font, `font-bold`, `text-foreground`

The SVG mark is two rounded squares (8px radius, 20×20px each at `md` size) offset by 6px, overlapping. Front square: `fill: var(--primary)`, back square: `fill: var(--primary)` at 40% opacity.

### 5.2 `<AuthCard />`

Thin wrapper — applies the auth-page card styling consistently.

```tsx
interface AuthCardProps {
  children: React.ReactNode
}
```

Renders: shadcn `<Card>` with `className="w-full max-w-sm rounded-xl shadow-sm border border-black/[0.08] bg-white"`. The explicit `bg-white` overrides the `--card` CSS variable to ensure white regardless of system theme (auth pages are light-only).

### 5.3 `<AuthLayout />`

Layout shell for all `(unauth)` pages.

```tsx
interface AuthLayoutProps {
  children: React.ReactNode
}
```

Renders:
```tsx
<div className="min-h-svh flex flex-col items-center justify-center gap-8 px-4 py-12"
     style={{ backgroundColor: "#f8f6f2" }}>
  {children}
</div>
```

The `min-h-svh` (small viewport height unit) prevents overflow issues on mobile browsers with dynamic toolbars.

### 5.4 `<GuestBanner />`

```tsx
interface GuestBannerProps {
  // no props — reads auth state internally via authClient.useSession()
}
```

Internal state: reads `isAnonymous` from session. Reads/writes `gami_banner_dismissed` in `localStorage`. If dismissed or not guest, renders `null`.

Renders: sticky bar described in §4.4.

### 5.5 `<InlineError />`

```tsx
interface InlineErrorProps {
  message: string | undefined
  id?: string  // linked to input via aria-describedby
}
```

Renders:
```tsx
<p role="alert" id={id} className="text-xs text-destructive mt-1">
  {message}
</p>
```

Only renders when `message` is truthy. Used within `FormMessage` from `src/components/ui/form.tsx` — do not create a separate component; extend `FormMessage` styling if needed.

---

## 6. Interaction Patterns

### Form Validation

**Trigger rules (locked — D-06, D-07):**
- On field blur: validate that field only
- On form submit: validate all fields
- On server error return: set field error via `form.setError()` from react-hook-form

**Validation schemas (zod):**

Sign-in:
```ts
z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
})
```

Sign-up:
```ts
z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
```

**No password strength indicator** (locked — D-08). Minimum length only.

### Loading State

Primary button during submission:
- `disabled={true}`
- Replace button text with: `<Loader2 className="size-4 animate-spin" />` + "Signing in..." or "Creating account..."
- Spinner is inline-left of text, not replacing it entirely

### Error Display

Field errors render below their input via `<FormMessage>` (existing shadcn form infrastructure). The input gets `aria-invalid="true"` automatically via `react-hook-form` + `register()`.

Server errors:
- Wrong credentials → `form.setError("password", { message: "Incorrect email or password" })`
- Email taken → `form.setError("email", { message: "An account with this email already exists" })`
- Network/unknown → `form.setError("root", { message: "Something went wrong. Please try again." })` — render root error above submit button

### Guest Flow

Clicking "Play as Guest":
1. Call `authClient.signIn.anonymous()` (Better Auth anonymous plugin)
2. Show inline loading state on "Play as Guest" text (replace text with spinner, same size)
3. On success: redirect to `/`
4. On failure: show root form error — "Guest sign-in failed. Please try again."

### Page Transitions

No animated transitions for Phase 1. Next.js default page navigation. Phase 2+ can add transitions with the View Transitions API.

---

## 7. Accessibility Contracts

### Focus Management

- On page load: auto-focus the email input field on sign-in and sign-up pages
  ```tsx
  <Input autoFocus type="email" ... />
  ```
- After form submission error: focus moves to the first field with an error
  ```tsx
  // react-hook-form: setFocus("email") after setError
  ```
- After dismissing guest banner: focus returns to the element that would logically follow (first interactive element on page)

### ARIA

| Element | Required ARIA |
|---------|--------------|
| Email input | `aria-label="Email address"` (plus visible label via `<Label>`) |
| Password input | `aria-label="Password"` (plus visible label via `<Label>`) |
| Inline error | `role="alert"` so screen readers announce on inject; linked to input via `aria-describedby` |
| Primary button during loading | `aria-busy="true"` |
| Guest banner dismiss button | `aria-label="Dismiss banner"` |
| GamiLogo SVG | `aria-hidden="true"` on the SVG; "gami" wordmark text is sufficient for screen readers |
| Form | `aria-label="Sign in form"` / `aria-label="Sign up form"` |

### Keyboard Navigation

- Tab order on sign-in: Email → Password → Sign in button → Sign up link → Play as Guest link
- Tab order on sign-up: Email → Password → Create account button → Sign in link → Play as Guest link
- Enter key on any input: submits the form
- Escape key on banner: dismisses banner (same as clicking X)

### Touch Targets

All interactive elements meet WCAG 2.5.5 minimum 44×44px touch target:
- Primary button: `size=lg` → `h-10` (40px height) + `w-full` — add `min-h-[44px]` override
- Secondary links: wrap in `<button className="min-h-[44px] inline-flex items-center">` or use `py-2` padding on anchor tags
- Banner dismiss X button: `size-icon` variant is `size-9` (36px) — override to `size-[44px]` for the banner
- "Play as Guest": ensure parent element has `min-h-[44px]`

### Color Contrast

- Primary orange-amber on white: verify meets WCAG AA 4.5:1 for 14px text. The `--primary` oklch value (0.6716 0.1368 48.5130) on white renders at approximately 3.1:1 — insufficient for small text. Use `text-primary-foreground` (white) on the filled button background instead; the button background itself provides contrast for the button text. For text links using primary color, use `font-medium` to compensate slightly, and verify in implementation.
- Inline error (destructive on white): `--destructive` oklch(0.6368 0.2078 25.3313) on white — verify meets 4.5:1. If not, darken slightly for text-only error messages.
- Muted foreground on white: `--muted-foreground` oklch(0.5510) — verify 4.5:1 for 14px text; if insufficient, use `--foreground` at 70% opacity as alternative for subheadings.

---

## 8. Copy & Tone

Tone: Friendly, brief, action-oriented. No corporate language. No exclamation points (they feel hollow in auth flows).

### Sign-in Page

| Element | Copy |
|---------|------|
| Card heading | "Welcome back" |
| Card subheading | "Sign in to continue" |
| Email label | "Email" |
| Email placeholder | "you@example.com" |
| Password label | "Password" |
| Password placeholder | "••••••••" |
| Primary CTA | "Sign in" |
| Loading state CTA | "Signing in..." |
| Sign-up prompt | "Don't have an account? **Sign up**" |
| Guest link | "Play as Guest" |
| Wrong credentials error | "Incorrect email or password" |
| Network error | "Something went wrong. Please try again." |
| Guest sign-in failure | "Guest sign-in failed. Please try again." |

### Sign-up Page

| Element | Copy |
|---------|------|
| Card heading | "Create your account" |
| Card subheading | "Start playing in seconds" |
| Email label | "Email" |
| Email placeholder | "you@example.com" |
| Password label | "Password" |
| Password placeholder | "8+ characters" |
| Primary CTA | "Create account" |
| Loading state CTA | "Creating account..." |
| Sign-in prompt | "Already have an account? **Sign in**" |
| Guest link | "Play as Guest" |
| Email validation error | "Enter a valid email address" |
| Email taken error | "An account with this email already exists" |
| Password too short error | "Password must be at least 8 characters" |
| Password required error | "Password is required" |
| Network error | "Something went wrong. Please try again." |

### Guest Conversion Banner

| Element | Copy |
|---------|------|
| Banner message | "Create an account to save your progress" |
| CTA link | "Create account" |
| Dismiss button aria-label | "Dismiss banner" |

### Home Placeholder

| Element | Copy |
|---------|------|
| Page title (text) | "Gami" |
| Subtext | "Games and more — coming soon" |

### Destructive Actions in Phase 1

No destructive actions (delete, permanent data removal) in Phase 1. Guest session creation is non-destructive (reversible by creating an account). No confirmation dialogs needed.

---

## 9. Out of Scope

The following UI elements are explicitly NOT part of Phase 1 and must not be implemented:

| Item | Phase |
|------|-------|
| Global navigation bar with coin balance, search, filter chips | Phase 2 |
| Home page spotlight layout (solo section, MP section) | Phase 2 |
| OAuth sign-in buttons (Google, GitHub) | Auth v2 (deferred) |
| 2FA verification UI | Auth v2 (deferred) |
| Magic link / email OTP UI | Auth v2 (deferred) |
| Password reset flow | Auth v2 (deferred) |
| Avatar / username at sign-up | Phase 4 |
| Coin balance display anywhere | Phase 2 (nav) |
| Presence indicators | Phase 2 |
| Game cards or game shell | Phase 3 |
| Dark mode on auth pages | Never (auth pages are light-only per D-04) |
| Toast notifications for auth errors | Not used — inline errors only (D-07) |
| Animated page transitions | Phase 2+ |
| Profile page | Phase 4 |
| Store | Phase 4 |

---

## Appendix: shadcn State

- **Style:** New York
- **Base color:** Neutral
- **CSS variables:** Yes
- **Icon library:** Lucide
- **Components available for Phase 1:** `Button`, `Input`, `Card`, `CardHeader`, `CardContent`, `CardFooter`, `CardTitle`, `CardDescription`, `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `Label`, `Sonner`
- **Third-party registries:** None
- **Registry safety gate:** Not applicable (no third-party blocks declared)

---

*Spec authored: 2026-04-26*
*Status: draft — pending checker validation*
