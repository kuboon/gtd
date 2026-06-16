/**
 * Browser-side helpers driving the id.kbn.one login flow (Passkeys + DPoP).
 * The DPoP key never leaves the browser; we exchange the IdP-issued JWS for a
 * gtd session cookie via /api/auth/session.
 */
import { init } from "@/lib/dpop";

const IDP_BASE_URL =
  process.env.NEXT_PUBLIC_IDP_BASE_URL ?? "https://id.kbn.one";

const LEGACY_USER_KEY = "tindone_user_id";
export const CALLBACK_PATH = "/auth/callback";

/**
 * Begin login: ensure a DPoP key exists, then redirect to the IdP authorize
 * endpoint with our key thumbprint. The IdP returns to CALLBACK_PATH.
 */
export async function startLogin(): Promise<void> {
  const { thumbprint } = await init();
  const redirectUri = `${window.location.origin}${CALLBACK_PATH}`;
  const url = new URL("/authorize", IDP_BASE_URL);
  url.searchParams.set("dpop_jkt", thumbprint);
  url.searchParams.set("redirect_uri", redirectUri);
  window.location.href = url.toString();
}

/**
 * Complete login after returning from the IdP: fetch the bound session with a
 * DPoP proof, hand the JWS to gtd's backend, and return the gtd user id.
 */
export async function completeLogin(): Promise<string> {
  const { fetchDpop } = await init();
  const res = await fetchDpop(new URL("/session", IDP_BASE_URL).toString());
  if (!res.ok) {
    throw new Error(`Failed to retrieve IdP session (${res.status})`);
  }
  const { jws } = (await res.json()) as { jws?: string };
  if (!jws) {
    throw new Error("IdP session response did not include a token");
  }

  const legacyUserId = localStorage.getItem(LEGACY_USER_KEY);

  const exchange = await fetch("/api/auth/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jws, legacyUserId }),
  });
  if (!exchange.ok) {
    throw new Error(`Failed to establish gtd session (${exchange.status})`);
  }
  const { userId } = (await exchange.json()) as { userId: string };

  // The httpOnly gtd session cookie is now authoritative; drop the legacy id.
  if (legacyUserId) {
    localStorage.removeItem(LEGACY_USER_KEY);
  }
  return userId;
}

/** Log out of gtd (clears the gtd session cookie). */
export async function logout(): Promise<void> {
  await fetch("/api/auth/session", { method: "DELETE" });
}
