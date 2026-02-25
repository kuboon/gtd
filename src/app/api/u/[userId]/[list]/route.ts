import { client } from "@/lib/db";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string; list: string }> },
) {
  const { userId, list } = await params;

  const validLists = ["inbox", "now", "next", "waiting"];
  if (!validLists.includes(list)) {
    return NextResponse.json({ error: "Invalid list" }, { status: 400 });
  }

  try {
    const { content } = await request.json();
    if (!content || content.length > 100) {
      return NextResponse.json(
        { error: "Content must be 1-100 chars" },
        { status: 400 },
      );
    }

    const taskId = nanoid();

    // Use a transaction to ensure both task and log are created
    await client.batch(
      [
        {
          sql: "INSERT INTO tasks (id, user_id, content, list) VALUES (?, ?, ?, ?)",
          args: [taskId, userId, content, list],
        },
        {
          sql: "INSERT INTO task_logs (id, task_id, from_list, to_list) VALUES (?, ?, ?, ?)",
          args: [nanoid(), taskId, null, list],
        },
      ],
      "write",
    );

    return NextResponse.json({ success: true, taskId });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to add task" }, { status: 500 });
  }
}
