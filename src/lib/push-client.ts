function base64ToArrayBuffer(base64String: string): ArrayBuffer {
  const normalized = base64String
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(base64String.length / 4) * 4, "=");

  const rawData = atob(normalized);
  const bytes = Array.from(rawData, (character) => character.charCodeAt(0));
  return new Uint8Array(bytes).buffer;
}

export async function ensurePushSubscription(): Promise<PushSubscription | null> {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    return null;
  }

  const registration = await navigator.serviceWorker.register("/sw.js");

  let subscription = await registration.pushManager.getSubscription();
  if (subscription) {
    return subscription;
  }

  if (!("Notification" in window)) {
    return null;
  }

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission !== "granted") {
    return null;
  }

  const response = await fetch("/api/push-subscription", { cache: "no-store" });
  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as { publicKey?: string };
  if (!result.publicKey) {
    return null;
  }

  const applicationServerKey = base64ToArrayBuffer(result.publicKey);

  subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey,
  });

  return subscription;
}

export async function syncPushSubscription(userId: string) {
  try {
    const subscription = await ensurePushSubscription();
    if (!subscription) {
      return;
    }

    await fetch(`/api/users/${userId}/push-subscription`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscription }),
    });
  } catch (error) {
    console.error(error);
  }
}
