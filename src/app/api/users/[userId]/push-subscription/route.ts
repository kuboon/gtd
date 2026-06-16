import { client } from "@/lib/db";
import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth";

function normalizeSubscription(value: unknown): string | null {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    const { userId } = await params;

    if ((await getSessionUserId()) !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();

    const rawSubscription =
      body && typeof body === "object" && "subscription" in body
        ? (body as { subscription: unknown }).subscription
        : body;

    const subscription = normalizeSubscription(rawSubscription);

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription is required" },
        { status: 400 },
      );
    }

    await client.execute({
      sql: "INSERT INTO users (id, push_subscription) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET push_subscription = excluded.push_subscription",
      args: [userId, subscription],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update push subscription" },
      { status: 500 },
    );
  }
}
