/**
 * gtd's own session cookie: a short HMAC-signed JWT carrying the gtd user id.
 * Kept dependency-light (only `jose`) and free of Node/DB imports so it can run
 * in the Edge runtime (middleware) as well as in route handlers.
 */
import { jwtVerify, SignJWT, type JWTPayload } from "jose";

export const SESSION_COOKIE = "gtd_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function getSessionSecret(): Uint8Array {
  const secret = process.env.GTD_SESSION_SECRET;
  if (!secret) {
    throw new Error("GTD_SESSION_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(gtdUserId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(gtdUserId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSessionSecret());
}

export async function verifySessionToken(
  token: string,
): Promise<{ sub: string } | null> {
  try {
    const { payload }: { payload: JWTPayload } = await jwtVerify(
      token,
      getSessionSecret(),
    );
    if (typeof payload.sub === "string" && payload.sub.length > 0) {
      return { sub: payload.sub };
    }
    return null;
  } catch {
    return null;
  }
}

export function sessionCookieOptions(maxAge: number = SESSION_MAX_AGE) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}
