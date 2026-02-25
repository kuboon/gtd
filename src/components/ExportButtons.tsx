"use client";

import { useMemo, useState } from "react";
import type { Task } from "@/types";

const orderedLists: Task["list"][] = [
  "inbox",
  "now",
  "next",
  "waiting",
  "done",
];

function toMarkdown(tasks: Task[]) {
  const sections = orderedLists
    .map((list) => {
      const rows = tasks.filter((task) => task.list === list);
      if (rows.length === 0) return "";

      const body = rows.map((task) => `- ${task.content}`).join("\n");
      return `## ${list.toUpperCase()}\n${body}`;
    })
    .filter(Boolean)
    .join("\n\n");

  return sections || "# Tasks\n\n(no tasks)";
}

function toJson(tasks: Task[]) {
  return JSON.stringify(tasks, null, 2);
}

export default function ExportButtons({ tasks }: { tasks: Task[] }) {
  const [copiedType, setCopiedType] = useState<"markdown" | "json" | null>(
    null,
  );

  const payload = useMemo(
    () => ({
      markdown: toMarkdown(tasks),
      json: toJson(tasks),
    }),
    [tasks],
  );

  const handleCopy = async (type: "markdown" | "json") => {
    try {
      await navigator.clipboard.writeText(payload[type]);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 1200);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section
      style={{
        marginTop: "20px",
        padding: "20px",
        backgroundColor: "var(--gray)",
        borderRadius: "15px",
      }}
    >
      <h2 style={{ fontSize: "1.1rem", marginBottom: "10px" }}>Export</h2>
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={() => handleCopy("markdown")}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid var(--text-gray)",
            backgroundColor: "var(--background)",
            fontWeight: "bold",
          }}
        >
          {copiedType === "markdown" ? "Copied markdown" : "markdown"}
        </button>
        <button
          onClick={() => handleCopy("json")}
          style={{
            padding: "8px 12px",
            borderRadius: "10px",
            border: "1px solid var(--text-gray)",
            backgroundColor: "var(--background)",
            fontWeight: "bold",
          }}
        >
          {copiedType === "json" ? "Copied json" : "json"}
        </button>
      </div>
    </section>
  );
}
