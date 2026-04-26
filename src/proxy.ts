import { NextRequest, NextResponse } from "next/server";

// Routes that REQUIRE an authenticated session (registered or anonymous).
// Anonymous sessions count as authenticated for the purpose of protection,
// BUT we keep /dashboard and /settings limited to non-guest sessions in Phase 1
// by treating them as protected; future phases may relax this for guests.
const protectedRoutes = ["/dashboard", "/settings"];

// Routes that authenticated users should be redirected away from.
// Guests count as authenticated — they get redirected to / from auth pages.
const authRoutes = ["/sign-in", "/sign-up"];

type SessionResponse = {
  data?: { session?: unknown; user?: unknown } | null;
};

async function fetchSession(request: NextRequest): Promise<boolean> {
  try {
    const cookie = request.headers.get("cookie") ?? "";
    if (!cookie) return false;

    const url = new URL("/api/auth/get-session", request.url);
    const res = await fetch(url, {
      method: "GET",
      headers: { cookie },
      // Edge runtime fetch — no caching, request-scoped
      cache: "no-store",
    });
    if (!res.ok) return false;
    const json = (await res.json()) as SessionResponse;
    return !!json?.data?.session;
  } catch {
    return false;
  }
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((r) => pathname.startsWith(r));
  const isAuthRoute = authRoutes.some((r) => pathname.startsWith(r));

  // Skip the HTTP session check for routes that don't need it
  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  const isAuthenticated = await fetchSession(request);

  // Authenticated users (including guests) bounce away from sign-in / sign-up
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Unauthenticated users cannot access /dashboard or /settings
  if (!isAuthenticated && isProtected) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets and api routes
  matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
};
