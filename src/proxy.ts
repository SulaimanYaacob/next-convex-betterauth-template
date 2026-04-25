import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const signInRoutes = ["/sign-in", "/sign-up", "/verify-2fa", "/reset-password"];

export default async function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  console.log("[proxy] cookie header:", request.headers.get("cookie"));
  console.log("[proxy] session:", session);
  const isSignInRoute = signInRoutes.includes(request.nextUrl.pathname);

  if (isSignInRoute && !session) {
    return NextResponse.next();
  }

  if (!isSignInRoute && !session) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  if (isSignInRoute || request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets and api routes
  matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
};
