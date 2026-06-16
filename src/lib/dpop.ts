/**
 * Client-side DPoP helper (browser only). Generates (or reuses) a
 * non-extractable ECDSA P-256 key pair in IndexedDB and exposes a
 * `fetch`-compatible wrapper that attaches a fresh `DPoP` proof header to every
 * request, per RFC 9449.
 *
 * Vendored from @kuboon/dpop (https://github.com/kuboon/id.kbn.one) because the
 * JSR registry is not reachable from this deployment. The only change is an
 * inline base64url encoder in place of `@std/encoding/base64url`.
 *
 * @module
 */

const textEncoder = new TextEncoder();

/** Base64url-encode a byte buffer (no padding). Browser only (uses btoa). */
function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Normalize an HTTP method for the `htm` claim (RFC 9449 §4.2). */
const normalizeMethod = (method: string): string => method.trim().toUpperCase();

/** Normalize a URL for the `htu` claim: origin + path + query, no fragment. */
const normalizeHtu = (url: string): string => {
  const parsed = new URL(url);
  return `${parsed.origin}${parsed.pathname}${parsed.search}`;
};

/**
 * Compute the RFC 7638 JWK SHA-256 thumbprint of a public EC (P-256) JWK,
 * base64url-encoded. This is the `dpop_jkt` / `cnf.jkt` value.
 */
const computeThumbprint = async (jwk: JsonWebKey): Promise<string> => {
  const canonical = JSON.stringify({
    crv: jwk.crv,
    kty: jwk.kty,
    x: jwk.x,
    y: jwk.y,
  });
  const hash = await crypto.subtle.digest(
    "SHA-256",
    textEncoder.encode(canonical),
  );
  return base64UrlEncode(new Uint8Array(hash));
};

interface DpopJwtPayload {
  readonly htm: string;
  readonly htu: string;
  readonly jti: string;
  readonly iat: number;
}

/** A storage backend for a single `CryptoKeyPair`. */
export interface KeyRepository {
  getKeyPair(): Promise<CryptoKeyPair | undefined>;
  saveKeyPair(keyPair: CryptoKeyPair): Promise<void>;
}

/** Non-persistent in-memory implementation — for tests / non-browser runtimes. */
export class InMemoryKeyRepository implements KeyRepository {
  private store = new Map<string, CryptoKeyPair>();

  getKeyPair(): Promise<CryptoKeyPair | undefined> {
    return Promise.resolve(this.store.get("default"));
  }

  saveKeyPair(keyPair: CryptoKeyPair): Promise<void> {
    this.store.set("default", keyPair);
    return Promise.resolve();
  }
}

/**
 * Browser-only. Persists the key pair in IndexedDB `dpop-keys-v1`, object store
 * `keys`, under the key `"default"`. Works with non-extractable keys because
 * IndexedDB stores `CryptoKey` objects via structured clone.
 */
export class IndexedDbKeyRepository implements KeyRepository {
  private dbName = "dpop-keys-v1";

  private openDb() {
    const req = indexedDB.open(this.dbName, 1);
    return new Promise<IDBDatabase>((resolve, reject) => {
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("keys")) {
          db.createObjectStore("keys");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async getKeyPair(): Promise<CryptoKeyPair | undefined> {
    const db = await this.openDb();
    const tx = db.transaction("keys", "readonly");
    const store = tx.objectStore("keys");
    const req = store.get("default");
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async saveKeyPair(keyPair: CryptoKeyPair): Promise<void> {
    const db = await this.openDb();
    const tx = db.transaction("keys", "readwrite");
    const store = tx.objectStore("keys");
    const req = store.put(keyPair, "default");
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}

const stripPrivateFields = (jwk: JsonWebKey): JsonWebKey => {
  const { crv, kty, x, y } = jwk;
  return { crv, kty, x, y };
};

const createDpopProof = async (
  keyPair: CryptoKeyPair,
  method: string,
  url: string,
): Promise<string> => {
  const htm = normalizeMethod(method);
  const htu = normalizeHtu(url);
  const iat = Math.floor(Date.now() / 1000);
  const jti = crypto.randomUUID();

  if (!htm) {
    throw new TypeError("HTTP method is required to create a DPoP proof.");
  }

  const payload: DpopJwtPayload = { htm, htu, iat, jti };

  const publicJwk = await crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const header = {
    alg: "ES256" as const,
    typ: "dpop+jwt" as const,
    jwk: stripPrivateFields(publicJwk),
  };

  const encodedHeader = base64UrlEncode(
    textEncoder.encode(JSON.stringify(header)),
  );
  const encodedPayload = base64UrlEncode(
    textEncoder.encode(JSON.stringify(payload)),
  );
  const signingInput = `${encodedHeader}.${encodedPayload}`;
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    keyPair.privateKey,
    textEncoder.encode(signingInput),
  );
  const encodedSignature = base64UrlEncode(signature);
  return `${signingInput}.${encodedSignature}`;
};

type FetchLike = typeof fetch;

/** Options for {@link init}. */
export interface InitOptions {
  keyStore?: KeyRepository;
  fetch?: FetchLike;
}

function generateKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign", "verify"],
  );
}

function getMethodUrl(
  input: RequestInfo | URL,
  init?: RequestInit,
): { method: string; url: string } {
  const method =
    (init && init.method) ?? (input instanceof Request ? input.method : "GET");
  if (typeof input === "string") {
    if (input.includes("://")) {
      return { method, url: input };
    }
    const origin = globalThis.location?.origin ?? "http://test.localhost";
    return { method, url: origin + input };
  }
  const url = input instanceof URL ? input.toString() : input.url;
  return { method, url };
}

/**
 * Bootstrap a DPoP-enabled fetch for the current context. `thumbprint` is the
 * RFC 7638 JWK SHA-256 thumbprint the IdP expects as `dpop_jkt` / `cnf.jkt`.
 */
export async function init(opts: InitOptions = {}): Promise<{
  fetchDpop: FetchLike;
  thumbprint: string;
  publicJwk: JsonWebKey;
}> {
  opts.keyStore ??= new IndexedDbKeyRepository();
  const fetchImpl = opts.fetch ?? fetch.bind(globalThis);

  let keyPair_ = await opts.keyStore.getKeyPair();
  if (!keyPair_) {
    keyPair_ = await generateKeyPair();
    await opts.keyStore.saveKeyPair(keyPair_);
  }
  const keyPair = keyPair_;

  const publicJwk = stripPrivateFields(
    await crypto.subtle.exportKey("jwk", keyPair.publicKey),
  );
  const thumbprint = await computeThumbprint(publicJwk);

  const fetchDpop: FetchLike = async (
    input: RequestInfo | URL,
    init?: RequestInit,
  ) => {
    const { method, url } = getMethodUrl(input, init);
    const proof = await createDpopProof(keyPair, method, url);

    const headers = new Headers(
      init?.headers ??
        (typeof input === "string" ? undefined : (input as Request).headers),
    );
    headers.set("DPoP", proof);

    const merged: RequestInit = { ...(init ?? {}), headers };
    return fetchImpl(input, merged);
  };

  return { fetchDpop, thumbprint, publicJwk };
}
