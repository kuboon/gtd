"use client";

import { useMemo, useState } from "react";

const tabs = ["curl", "wget", "fetch"] as const;
type ApiTab = (typeof tabs)[number];
type ApiMode = "task-update" | "task-create";

export default function ApiInst({
  apiUrl,
  mode = "task-update",
}: {
  apiUrl: string;
  mode?: ApiMode;
}) {
  const [activeTab, setActiveTab] = useState<ApiTab>("curl");
  const [copied, setCopied] = useState(false);

  const tabContent = useMemo<Record<ApiTab, string>>(
    () =>
      mode === "task-create"
        ? {
            curl: `curl -X POST ${apiUrl} -H "Content-Type: application/json" -d '{"content":"buy milk"}'`,
            wget: `wget --method=POST --body-data='{"content":"buy milk"}' --header="Content-Type: application/json" ${apiUrl}`,
            fetch: `await fetch("${apiUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ content: "buy milk" }),
});`,
          }
        : {
            curl: `curl -X PATCH ${apiUrl} -H "Content-Type: application/json" -d '{"list":"now"}'`,
            wget: `wget --method=PATCH --body-data='{"list":"now"}' --header="Content-Type: application/json" ${apiUrl}`,
            fetch: `await fetch("${apiUrl}", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ list: "now" }),
});`,
          },
    [apiUrl, mode],
  );

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tabContent[activeTab]);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <section
      style={{
        padding: "20px",
        backgroundColor: "var(--gray)",
        borderRadius: "15px",
        border: "1px dashed var(--text-gray)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <h2 style={{ fontSize: "1rem" }}>API</h2>
        <button
          onClick={handleCopy}
          style={{
            color: copied ? "var(--primary)" : "var(--text-gray)",
            fontWeight: "bold",
            fontSize: "0.8rem",
          }}
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: "6px 12px",
              borderRadius: "999px",
              border: "1px solid var(--text-gray)",
              backgroundColor:
                activeTab === tab ? "var(--primary)" : "var(--background)",
              color: activeTab === tab ? "white" : "var(--foreground)",
              fontSize: "0.8rem",
              fontWeight: "bold",
              textTransform: "lowercase",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      <code
        style={{
          fontSize: "0.75rem",
          display: "block",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          backgroundColor: "var(--background)",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        {tabContent[activeTab]}
      </code>
    </section>
  );
}
