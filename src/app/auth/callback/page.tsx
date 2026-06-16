"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { completeLogin } from "@/lib/idp-client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    completeLogin()
      .then((userId) => {
        if (!cancelled) {
          router.replace(`/u/${userId}`);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) {
          setError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        padding: "20px",
        textAlign: "center",
      }}
    >
      {error ? (
        <>
          <p style={{ marginBottom: "1.5rem", color: "var(--text-gray)" }}>
            Sign-in failed. Please try again.
          </p>
          <button
            onClick={() => router.replace("/")}
            style={{
              backgroundColor: "var(--primary)",
              color: "white",
              padding: "14px 40px",
              borderRadius: "40px",
              fontSize: "1.1rem",
              fontWeight: "bold",
            }}
          >
            Back
          </button>
        </>
      ) : (
        <p style={{ color: "var(--text-gray)", fontSize: "1.2rem" }}>
          Signing you in…
        </p>
      )}
    </main>
  );
}
