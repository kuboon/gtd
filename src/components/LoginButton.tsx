"use client";

import { useState } from "react";
import { startLogin } from "@/lib/idp-client";

export default function LoginButton() {
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      await startLogin();
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogin}
      disabled={loading}
      style={{
        backgroundColor: "var(--primary)",
        color: "white",
        padding: "18px 50px",
        borderRadius: "40px",
        fontSize: "1.2rem",
        fontWeight: "bold",
        boxShadow: "0 4px 15px rgba(255, 68, 88, 0.4)",
      }}
    >
      {loading ? "Redirecting…" : "Sign in with Passkey"}
    </button>
  );
}
