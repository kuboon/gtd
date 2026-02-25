import { client } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { id, pushSubscription } = await request.json();

    await client.execute({
      sql: "INSERT INTO users (id, push_subscription) VALUES (?, ?)",
      args: [id, pushSubscription || null],
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
