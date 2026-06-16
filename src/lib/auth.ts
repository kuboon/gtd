import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { createRemoteJWKSet, jwtVerify } from "jose";
import { client } from "@/lib/db";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session";

export {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from "@/lib/session";

const IDP_BASE_URL = process.env.IDP_BASE_URL ?? "https://id.kbn.one";

// Lazily created once per server process; createRemoteJWKSet caches/refreshes
// the IdP's public keys internally.
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;
function getJwks() {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL("/.well-known/jwks.json", IDP_BASE_URL));
  }
  return jwks;
}

/**
 * Verify an IdP-issued JWS (from id.kbn.one /session) and return its subject.
 * Validates signature against the IdP JWKS plus issuer and expiry. We do not
 * verify the DPoP `cnf.jkt` here — this is a one-time login exchange over HTTPS
 * and the signature + issuer + freshness are sufficient to trust the subject.
 */
export async function verifyIdpJws(jws: string): Promise<{ sub: string }> {
  const { payload } = await jwtVerify(jws, getJwks(), {
    issuer: IDP_BASE_URL,
  });
  if (typeof payload.sub !== "string" || payload.sub.length === 0) {
    throw new Error("IdP token has no subject");
  }
  return { sub: payload.sub };
}

/**
 * Map an IdP subject to a gtd user id (a nanoid). If a user is already linked,
 * return it. Otherwise, if a legacy anonymous user id is supplied and that row
 * is not yet linked to any IdP subject, adopt it (preserving existing tasks);
 * else create a fresh user.
 */
export async function resolveOrCreateUser(
  idpSub: string,
  legacyUserId?: string | null,
): Promise<string> {
  const existing = await client.execute({
    sql: "SELECT id FROM users WHERE idp_sub = ?",
    args: [idpSub],
  });
  if (existing.rows.length > 0) {
    return String(existing.rows[0].id);
  }

  if (legacyUserId) {
    // Only adopt a legacy row that has no IdP link yet, to prevent attaching
    // an identity to someone else's account by guessing their id.
    const adopt = await client.execute({
      sql: "UPDATE users SET idp_sub = ? WHERE id = ? AND idp_sub IS NULL",
      args: [idpSub, legacyUserId],
    });
    if (adopt.rowsAffected > 0) {
      return legacyUserId;
    }
  }

  const userId = nanoid();
  await client.execute({
    sql: "INSERT INTO users (id, idp_sub) VALUES (?, ?)",
    args: [userId, idpSub],
  });
  return userId;
}

/**
 * Read and verify the gtd session cookie. Returns the authenticated gtd user id
 * or null. For use in server components / route handlers via next/headers.
 */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }
  const session = await verifySessionToken(token);
  return session?.sub ?? null;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "UnauthorizedError";
  }
}

/**
 * Assert that the current session belongs to `userId`. Throws UnauthorizedError
 * if not — used as defense-in-depth inside write API routes (middleware
 * enforces this too).
 */
export async function requireUser(userId: string): Promise<void> {
  const sessionUserId = await getSessionUserId();
  if (sessionUserId !== userId) {
    throw new UnauthorizedError();
  }
}
