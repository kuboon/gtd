import { NextResponse } from "next/server";
import {
  createSessionToken,
  getSessionUserId,
  resolveOrCreateUser,
  SESSION_COOKIE,
  sessionCookieOptions,
  verifyIdpJws,
} from "@/lib/auth";

/**
 * Exchange an IdP-issued JWS (from id.kbn.one /session) for a gtd session.
 * Verifies the JWS, maps the IdP subject to a gtd user (optionally adopting a
 * legacy anonymous account), and sets the httpOnly gtd session cookie.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      jws?: unknown;
      legacyUserId?: unknown;
    };
    const jws = typeof body.jws === "string" ? body.jws : null;
    const legacyUserId =
      typeof body.legacyUserId === "string" ? body.legacyUserId : null;

    if (!jws) {
      return NextResponse.json({ error: "jws is required" }, { status: 400 });
    }

    let sub: string;
    try {
      ({ sub } = await verifyIdpJws(jws));
    } catch (error) {
      console.error("IdP token verification failed", error);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const userId = await resolveOrCreateUser(sub, legacyUserId);
    const token = await createSessionToken(userId);

    const response = NextResponse.json({ userId });
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions());
    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 },
    );
  }
}

/** Whoami: returns the current gtd user id, or 401 if not signed in. */
export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ userId });
}

/** Logout: clears the gtd session cookie. */
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", sessionCookieOptions(0));
  return response;
}
