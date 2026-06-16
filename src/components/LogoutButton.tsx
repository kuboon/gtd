"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { logout } from "@/lib/idp-client";

export default function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace("/");
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        background: "none",
        border: "none",
        color: "var(--text-gray)",
        fontSize: "0.9rem",
        textDecoration: "underline",
        cursor: "pointer",
      }}
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
