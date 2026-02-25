import { createClient } from "@libsql/client";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.warn("TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are not set. Using dummy values for build/dev.");
}

export const client = createClient({
  url: url || "libsql://dummy.turso.io",
  authToken: authToken || "dummy-token",
});
