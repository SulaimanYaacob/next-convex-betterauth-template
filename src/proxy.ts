import { getSessionCookie } from "better-auth/cookies";
import { NextRequest, NextResponse } from "next/server";

const signInRoutes = ["/sign-in", "/sign-up", "/verify-2fa", "/reset-password"];

export default async function proxy(request: NextRequest) {
  const session = getSessionCookie(request);
  console.log(session, signInRoutes);

  return NextResponse.next();
}

export const config = {
  // Run middleware on all routes except static assets and api routes
  matcher: ["/((?!.*\\..*|_next|api/auth).*)", "/", "/trpc(.*)"],
};
