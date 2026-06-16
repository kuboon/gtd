import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

/**
 * Extract the `[userId]` segment from a protected pathname.
 *   /u/<id>/...            -> <id>
 *   /api/u/<id>/...        -> <id>
 *   /api/users/<id>/...    -> <id>
 */
function userIdFromPath(pathname: string): string | null {
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "u") {
    return segments[1] ?? null;
  }
  if (segments[0] === "api" && segments[1] === "u") {
    return segments[2] ?? null;
  }
  if (segments[0] === "api" && segments[1] === "users") {
    return segments[2] ?? null;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isApi = pathname.startsWith("/api/");

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  if (!session) {
    if (isApi) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  const urlUserId = userIdFromPath(pathname);
  if (urlUserId && urlUserId !== session.sub) {
    if (isApi) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Send the user to their own home rather than leaking the requested id.
    const url = request.nextUrl.clone();
    url.pathname = `/u/${session.sub}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/u/:path*", "/api/u/:path*", "/api/users/:userId/:path*"],
};
