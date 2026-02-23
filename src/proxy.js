import { NextResponse } from "next/server";

export function proxy(request) {
  const session = request.cookies.get("samanghar_session");
  const { pathname } = request.nextUrl;

  // 1. Let public stuff through
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/status") ||
    pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  // 2. Redirect if NO session
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Ensure the matcher is still there
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
