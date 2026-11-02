import { NextResponse, type NextRequest } from "next/server";

// Optimistic check only: sends visitors without a session cookie to /login.
// Real authorisation happens in requireUser() inside pages and Server Actions.
export function proxy(request: NextRequest) {
  if (!request.cookies.has("prephub_session")) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/tracks/:path*", "/search/:path*"],
};
