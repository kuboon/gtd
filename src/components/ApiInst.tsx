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
            curl: `curl -X POST ${apiUrl} -H "Content-Type: text/plain" -d 'buy milk'`,
            wget: `wget --method=POST --body-data='buy milk' --header="Content-Type: text/plain" ${apiUrl}`,
            fetch: `await fetch("${apiUrl}", {
  method: "POST",
  headers: { "Content-Type": "text/plain" },
  body: "buy milk",
});`,
          }
        : {
            curl: `curl -X PATCH ${apiUrl} -H "Content-Type: application/json" -d '{"list":"done"}'`,
            wget: `wget --method=PATCH --body-data='{"list":"done"}' --header="Content-Type: application/json" ${apiUrl}`,
            fetch: `await fetch("${apiUrl}", {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ list: "done" }),
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
      {mode === "task-update" && (
        <p
          style={{
            marginTop: "8px",
            fontSize: "0.75rem",
            color: "var(--text-gray)",
          }}
        >
          Add <code>{'"push": false'}</code> to the body to suppress push
          notifications.
        </p>
      )}
    </section>
  );
}
