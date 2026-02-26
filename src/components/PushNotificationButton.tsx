"use client";

import { useEffect, useState } from "react";
import { ensurePushSubscription } from "@/lib/push-client";

type PushStatus = "unsupported" | "denied" | "subscribed" | "unsubscribed";

async function getPushStatus(): Promise<PushStatus> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return "unsupported";
  }
  if (!("Notification" in window)) {
    return "unsupported";
  }
  if (Notification.permission === "denied") {
    return "denied";
  }
  const existing = await navigator.serviceWorker.getRegistration("/sw.js");
  const registration =
    existing ?? (await navigator.serviceWorker.register("/sw.js"));
  const subscription = await registration.pushManager.getSubscription();
  return subscription ? "subscribed" : "unsubscribed";
}

export default function PushNotificationButton({ userId }: { userId: string }) {
  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getPushStatus()
      .then(setStatus)
      .catch((error) => {
        console.error(error);
        setStatus("unsupported");
      });
  }, []);

  const handleClick = async () => {
    if (
      status === "subscribed" ||
      status === "unsupported" ||
      status === "denied"
    ) {
      return;
    }
    setLoading(true);
    try {
      const subscription = await ensurePushSubscription();
      if (subscription) {
        const response = await fetch(`/api/users/${userId}/push-subscription`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscription }),
        });
        if (response.ok) {
          setStatus("subscribed");
        } else {
          const newStatus = await getPushStatus();
          setStatus(newStatus);
        }
      } else {
        const newStatus = await getPushStatus();
        setStatus(newStatus);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (status === null) return null;

  const iconColor =
    status === "subscribed"
      ? "var(--primary)"
      : status === "denied" || status === "unsupported"
        ? "var(--text-gray)"
        : "#ffcc00";

  const title =
    status === "subscribed"
      ? "Push notifications enabled"
      : status === "denied"
        ? "Push notifications blocked"
        : status === "unsupported"
          ? "Push notifications not supported"
          : "Enable push notifications";

  return (
    <button
      onClick={handleClick}
      disabled={
        loading ||
        status === "subscribed" ||
        status === "unsupported" ||
        status === "denied"
      }
      title={title}
      aria-label={title}
      style={{
        background: "none",
        border: "none",
        cursor: status === "unsubscribed" && !loading ? "pointer" : "default",
        padding: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      <span style={{ fontSize: "1.4rem" }}>🔔</span>
      <span
        style={{
          position: "absolute",
          bottom: 2,
          right: 2,
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: iconColor,
          border: "1px solid var(--background)",
        }}
      />
    </button>
  );
}
