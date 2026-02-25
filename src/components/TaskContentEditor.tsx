"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TaskContentEditor({
  userId,
  taskId,
  initialContent,
}: {
  userId: string;
  taskId: string;
  initialContent: string;
}) {
  const [content, setContent] = useState(initialContent);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextContent = content.trim();
    if (!nextContent || nextContent === initialContent || loading) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/u/${userId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: nextContent, push: false }),
      });

      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", gap: "10px" }}>
      <input
        type="text"
        maxLength={100}
        value={content}
        onChange={(event) => setContent(event.target.value)}
        style={{
          flex: 1,
          padding: "12px 15px",
          borderRadius: "10px",
          border: "1px solid #ddd",
          fontSize: "1.2rem",
          fontWeight: "bold",
        }}
      />
      <button
        type="submit"
        disabled={loading || content.trim() === initialContent}
        style={{
          backgroundColor: "var(--primary)",
          color: "white",
          padding: "10px 20px",
          borderRadius: "10px",
          fontWeight: "bold",
        }}
      >
        {loading ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
