import { client } from "@/lib/db";
import { nanoid } from "nanoid";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ userId: string, taskId: string }> }
) {
  const { taskId } = await params;
  
  try {
    const { list } = await request.json();
    const validLists = ['inbox', 'now', 'next', 'waiting', 'done'];
    
    if (!validLists.includes(list)) {
      return NextResponse.json({ error: "Invalid list" }, { status: 400 });
    }

    // Get current list for logging
    const currentTask = await client.execute({
      sql: "SELECT list FROM tasks WHERE id = ?",
      args: [taskId],
    });

    if (currentTask.rows.length === 0) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const fromList = currentTask.rows[0].list;

    await client.batch([
      {
        sql: "UPDATE tasks SET list = ?, updated_at = (strftime('%s', 'now')) WHERE id = ?",
        args: [list, taskId],
      },
      {
        sql: "INSERT INTO task_logs (id, task_id, from_list, to_list) VALUES (?, ?, ?, ?)",
        args: [nanoid(), taskId, fromList, list],
      }
    ], "write");

    // TODO: Trigger Web Push notification here

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string, taskId: string }> }
) {
  // Logic to delete task log entry or task itself if needed
  // For now just basic placeholder
  return NextResponse.json({ success: true });
}
