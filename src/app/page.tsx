"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoginButton from "@/components/LoginButton";

export default function LandingPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // If already signed in, go straight to the user's home.
    fetch("/api/auth/session")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { userId: string } | null) => {
        if (cancelled) return;
        if (data?.userId) {
          router.replace(`/u/${data.userId}`);
        } else {
          setChecking(false);
        }
      })
      .catch(() => {
        if (!cancelled) setChecking(false);
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
      <h1
        style={{
          fontSize: "4rem",
          marginBottom: "0.5rem",
          color: "var(--primary)",
          fontWeight: "900",
          letterSpacing: "-2px",
        }}
      >
        tindone
      </h1>
      <p
        style={{
          marginBottom: "2.5rem",
          color: "var(--text-gray)",
          fontSize: "1.2rem",
        }}
      >
        Swipe your way to GTD nirvana.
      </p>
      {checking ? (
        <p style={{ color: "var(--text-gray)" }}>Loading…</p>
      ) : (
        <LoginButton />
      )}
    </main>
  );
}
