import { client } from "@/lib/db";
import { getPublicVapidKey } from "@/lib/push";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

function normalizeSubscription(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

export async function GET() {
  const publicKey = getPublicVapidKey();

  if (!publicKey) {
    return NextResponse.json(
      { error: "VAPID public key is not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({ publicKey });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const rawSubscription =
    payload && typeof payload === "object" && "subscription" in payload
      ? (payload as { subscription: unknown }).subscription
      : payload;
  const subscription = normalizeSubscription(rawSubscription);

  if (!subscription) {
    return NextResponse.json(
      { error: "Subscription is required" },
      { status: 400 },
    );
  }

  let userId: string | null = null;
  if (payload && typeof payload === "object" && "userId" in payload) {
    const value = (payload as { userId: unknown }).userId;
    if (typeof value === "string" && value.length > 0) {
      userId = value;
    }
  }

  if (!userId) {
    const cookieStore = await cookies();
    userId = cookieStore.get("tindone_user_id")?.value || null;
  }

  if (userId) {
    await client.execute({
      sql: "UPDATE users SET push_subscription = ? WHERE id = ?",
      args: [subscription, userId],
    });
  }

  return NextResponse.json({ success: true });
}
