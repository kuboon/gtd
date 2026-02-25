import { client } from "@/lib/db";
import { NextResponse } from "next/server";

export async function DELETE(
  request: Request,
  {
    params,
  }: { params: Promise<{ userId: string; taskId: string; logId: string }> },
) {
  try {
    const { taskId, logId } = await params;
    await client.execute({
      sql: "DELETE FROM task_logs WHERE id = ? AND task_id = ?",
      args: [logId, taskId],
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to delete log" },
      { status: 500 },
    );
  }
}
