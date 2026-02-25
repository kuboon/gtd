import { client } from "@/lib/db";
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

export async function POST(request: Request) {
  try {
    const { id, pushSubscription } = await request.json();
    const normalizedSubscription = normalizeSubscription(pushSubscription);

    await client.execute({
      sql: "INSERT INTO users (id, push_subscription) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET push_subscription = COALESCE(excluded.push_subscription, users.push_subscription)",
      args: [id, normalizedSubscription],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 },
    );
  }
}
