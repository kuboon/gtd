import webpush from "web-push";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function getVapidSubject(): string {
  const rawSubject = process.env.VAPID_SUBJECT;
  if (rawSubject && rawSubject.length > 0) {
    return rawSubject;
  }

  return "mailto:admin@example.com";
}

function getPrivateVapidKey(): string | null {
  return process.env.VAPID_PRIVATE_KEY || null;
}

export function getPublicVapidKey(): string | null {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}

export async function sendPushNotification(
  subscriptionJson: string,
  payload: PushPayload,
) {
  const publicKey = getPublicVapidKey();
  const privateKey = getPrivateVapidKey();

  if (!publicKey || !privateKey) {
    return;
  }

  const subscription = JSON.parse(subscriptionJson) as webpush.PushSubscription;

  if (!subscription.endpoint) {
    return;
  }

  webpush.setVapidDetails(getVapidSubject(), publicKey, privateKey);

  await webpush.sendNotification(subscription, JSON.stringify(payload));
}
