import { client } from "@/lib/db";
import { sendPushNotification } from "@/lib/push";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string; taskId: string }> },
) {
  const { userId, taskId } = await params;

  try {
    const body = (await request.json()) as {
      list?: unknown;
      content?: unknown;
      push?: unknown;
    };
    const list = typeof body.list === "string" ? body.list : null;
    const content =
      typeof body.content === "string" ? body.content.trim() : null;
    const shouldSendPush = body.push !== false;
    const validLists = ["inbox", "now", "next", "waiting", "done"];

    if (list !== null && !validLists.includes(list)) {
      return NextResponse.json({ error: "Invalid list" }, { status: 400 });
    }

    if (content !== null && (content.length === 0 || content.length > 100)) {
      return NextResponse.json(
        { error: "Content must be 1-100 chars" },
        { status: 400 },
      );
    }

    if (list === null && content === null) {
      return NextResponse.json(
        { error: "Either list or content is required" },
        { status: 400 },
      );
    }

    // Get current list for logging
    const currentTask = await client.execute({
      sql: "SELECT list, content FROM tasks WHERE id = ? AND user_id = ?",
      args: [taskId, userId],
    });

    if (currentTask.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const fromList = String(currentTask.rows[0].list);
    const currentContent = String(currentTask.rows[0].content || "Task");

    if (list !== null) {
      await client.batch(
        [
          {
            sql: "UPDATE tasks SET list = ?, updated_at = (strftime('%s', 'now')) WHERE id = ?",
            args: [list, taskId],
          },
          {
            sql: "INSERT INTO task_logs (id, task_id, from_list, to_list) VALUES (?, ?, ?, ?)",
            args: [nanoid(), taskId, fromList, list],
          },
        ],
        "write",
      );
    }

    if (content !== null) {
      await client.execute({
        sql: "UPDATE tasks SET content = ?, updated_at = (strftime('%s', 'now')) WHERE id = ?",
        args: [content, taskId],
      });
    }

    if (list !== null && shouldSendPush) {
      const userResult = await client.execute({
        sql: "SELECT push_subscription FROM users WHERE id = ?",
        args: [userId],
      });

      const pushSubscription = userResult.rows[0]?.push_subscription;

      if (typeof pushSubscription === "string" && pushSubscription.length > 0) {
        try {
          await sendPushNotification(pushSubscription, {
            title: "tindone",
            body: `${currentContent} moved to ${list}`,
            url: `/u/${userId}/tasks/${taskId}`,
          });
        } catch (error) {
          console.error(error);
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to update task" },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  // Logic to delete task log entry or task itself if needed
  // For now just basic placeholder
  return NextResponse.json({ success: true });
}
