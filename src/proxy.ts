import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, isValidSessionToken } from "./lib/auth";

// Next.js 16 renamed `middleware.ts` to `proxy.ts` (the `middleware`
// convention is deprecated) — this is not a typo of the old name.
export function proxy(request: NextRequest) {
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (isValidSessionToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  // /api/webhooks/* and /api/cron/* are called by GHL and Vercel Cron
  // respectively, not by a logged-in browser -- they authenticate with
  // their own secret headers (see route.ts files) instead of the session
  // cookie, so they must NOT go through the password gate.
  matcher: ["/dashboard/:path*", "/api/((?!webhooks|cron).*)"],
};
